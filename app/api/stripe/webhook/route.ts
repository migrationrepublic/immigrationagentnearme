import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";
import { InvoiceService } from "@/lib/services/invoice.service";
import { CustomerService } from "@/lib/services/customer.service";
import {
  sendBookingConfirmation,
  sendAdminAlert,
} from "@/lib/email";
import Stripe from "stripe";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;


  // -------------------------------
  // Validate Required Values
  // -------------------------------
  if (!sig) {
    console.error("Missing Stripe signature");
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    console.error("Missing webhook secret");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  // -------------------------------
  // Verify Stripe Webhook
  // -------------------------------
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";

    console.error("Webhook verification failed:", errorMessage);

    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  const eventId = event.id;

  // -------------------------------
  // Check Duplicate Event
  // -------------------------------
  const { data: existingEvent, error: existingEventError } =
    await supabaseServer
      .from("stripe_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

  if (existingEventError) {
    console.error(
      "Error checking existing event:",
      existingEventError
    );

    // If the table 'stripe_events' is missing from the database, log a warning but proceed
    // so we don't completely block booking creation and email delivery.
    if (existingEventError.code === "PGRST205" || existingEventError.message?.includes("stripe_events")) {
      console.warn("WARNING: 'stripe_events' table does not exist in Supabase. Processing event anyway.");
    } else {
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }
  }

  if (existingEvent) {
    console.log(`Duplicate event skipped: ${eventId}`);

    return NextResponse.json({ received: true });
  }

  // -------------------------------
  // Handle Checkout Completed
  // -------------------------------
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const metadata = session.metadata;
    const sessionId = session.id;

    // -------------------------------
    // Validate Payment Status
    // -------------------------------
    if (session.payment_status !== "paid") {
      console.log(`Session not paid: ${sessionId}`);

      return NextResponse.json({ received: true });
    }

    // -------------------------------
    // Validate Metadata
    // -------------------------------
    if (
      !metadata ||
      !metadata.name ||
      !metadata.email ||
      !metadata.date ||
      !metadata.time ||
      !metadata.planId
    ) {
      console.error("Missing required metadata");

      return NextResponse.json(
        { error: "Missing metadata" },
        { status: 400 }
      );
    }

    try {
      // -------------------------------
      // Prevent Duplicate Booking
      // -------------------------------
      const { data: existingBooking } = await supabaseServer
        .from("bookings")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (existingBooking) {
        console.log(
          `Booking already exists for session: ${sessionId}`
        );

        return NextResponse.json({ received: true });
      }

      // -------------------------------
      // Check Slot Availability (admin-blocked, this consultation type)
      // -------------------------------
      const { data: existingSlot } = await supabaseServer
        .from("availability")
        .select("is_booked")
        .eq("date", metadata.date)
        .eq("time", metadata.time)
        .eq("plan_id", metadata.planId)
        .maybeSingle();

      if (existingSlot?.is_booked) {
        console.error(
          `Slot already booked: ${metadata.date} ${metadata.time}`
        );

        return NextResponse.json(
          { error: "Slot already booked" },
          { status: 409 }
        );
      }

      // -------------------------------
      // Check Slot Availability (any client, any consultation type) — only
      // one client can be booked at a given date+time across Phone/Video/Office
      // -------------------------------
      const { data: crossTypeBookings } = await supabaseServer
        .from("bookings")
        .select("id")
        .eq("date", metadata.date)
        .eq("time", metadata.time)
        .not("status", "eq", "cancelled")
        .limit(1);

      if (crossTypeBookings && crossTypeBookings.length > 0) {
        console.error(
          `Slot already booked by another consultation type: ${metadata.date} ${metadata.time}`
        );

        return NextResponse.json(
          { error: "Slot already booked" },
          { status: 409 }
        );
      }

      // -------------------------------
      // Insert Booking. A unique index on bookings(date, time) for
      // non-cancelled rows is the real guarantee against a race between two
      // simultaneous checkouts — the checks above are a fast, friendly
      // pre-check only.
      // -------------------------------
      const { data: newBooking, error: bookingError } = await supabaseServer
        .from("bookings")
        .insert([
          {
            name: metadata.name,
            email: metadata.email,
            phone: metadata.phone || "",
            plan_id: metadata.planId,
            date: metadata.date,
            time: metadata.time,
            notes: metadata.notes || "",
            status: "confirmed",
            stripe_session_id: sessionId,
          },
        ])
        .select("*")
        .single();

      if (bookingError) {
        if (bookingError.code === "23505") {
          console.error(
            `Slot taken between check and insert: ${metadata.date} ${metadata.time}`
          );
          return NextResponse.json(
            { error: "Slot already booked" },
            { status: 409 }
          );
        }

        console.error(
          "Booking insert failed:",
          bookingError
        );

        return NextResponse.json(
          { error: "Failed to create booking" },
          { status: 500 }
        );
      }

      // -------------------------------
      // Mark Slot As Booked
      // -------------------------------
      const { error: availabilityError } =
        await supabaseServer
          .from("availability")
          .upsert(
            {
              date: metadata.date,
              time: metadata.time,
              plan_id: metadata.planId,
              is_booked: true,
            },
            {
              onConflict: "date,time,plan_id",
            }
          );

      if (availabilityError) {
        console.error(
          "Availability update failed:",
          availabilityError
        );
      }

      // -------------------------------
      // Customer + Invoice: auto-create the customer record and the draft
      // invoice, then immediately mark the invoice paid and email the client
      // a copy — this is the real Stripe payment, so it's authoritative
      // "payment complete" for the auto-send requirement.
      // -------------------------------
      try {
        await CustomerService.getOrCreateFromBooking({
          name: newBooking.name,
          email: newBooking.email,
          phone: newBooking.phone,
          bookingId: newBooking.id,
        });
        await InvoiceService.createDraftInvoiceForBooking(newBooking);
        await InvoiceService.markInvoicePaidAndSend(newBooking.id, {
          mode: "Stripe",
          referenceNumber: sessionId,
          amount: session.amount_total ? session.amount_total / 100 : undefined,
        });
      } catch (invoiceError) {
        console.error("Invoice auto-generation failed:", invoiceError);
      }

      // -------------------------------
      // Save Processed Event
      // IMPORTANT:
      // Save AFTER successful processing
      // -------------------------------
      const { error: saveEventError } =
        await supabaseServer
          .from("stripe_events")
          .insert([{ id: eventId }]);

      if (saveEventError) {
        console.error(
          "Failed to save event ID:",
          saveEventError
        );
      }

      // -------------------------------
      // Send Emails
      // -------------------------------
      try {
        await sendBookingConfirmation(
          metadata.email,
          metadata.name,
          metadata.planName || "Consultation",
          metadata.date,
          metadata.time,
          metadata.phone || ""
        );

        await sendAdminAlert(
          metadata.name,
          metadata.email,
          metadata.planName || "Consultation",
          metadata.date,
          metadata.time,
          metadata.phone || "",
          metadata.notes || ""
        );
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      console.log(
        `Booking processed successfully: ${sessionId}`
      );

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Webhook processing failed:", error);

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }

  // -------------------------------
  // Ignore Other Events
  // -------------------------------
  return NextResponse.json({ received: true });
}