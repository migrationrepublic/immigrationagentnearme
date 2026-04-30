import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";
import { sendBookingConfirmation, sendAdminAlert } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!webhookSecret) {
      throw new Error("Stripe webhook secret is not set");
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook Error: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const metadata = session.metadata;
    const sessionId = session.id;

    if (!metadata) {
      console.error("No metadata found in session");
      return NextResponse.json({ error: "No metadata" }, { status: 400 });
    }

    try {
      // 1. Insert into bookings table
      const { data: booking, error: insertError } = await supabaseServer
        .from("bookings")
        .insert([
          {
            name: metadata.name,
            email: metadata.email,
            phone: metadata.phone,
            plan_id: metadata.planId,
            date: metadata.date,
            time: metadata.time,
            notes: metadata.notes,
            status: "confirmed",
            stripe_session_id: sessionId,
          },
        ])
        .select()
        .single();

      if (insertError) {
        // If error is unique constraint on stripe_session_id, it means we already processed this
        if (insertError.code === "23505") {
          console.log(`Booking for session ${sessionId} already exists.`);
          return NextResponse.json({ received: true });
        }
        console.error("Error inserting booking:", insertError);
        throw new Error("Failed to insert booking");
      }

      // 2. Mark the slot as booked (or insert it if it doesn't exist)
      const { error: updateError } = await supabaseServer
        .from("availability")
        .upsert(
          {
            date: metadata.date,
            time: metadata.time,
            is_booked: true,
          },
          { onConflict: "date, time" },
        );

      if (updateError) {
        console.error("Error updating availability:", updateError);
        // We don't throw here because the booking was paid and saved. An admin might need to manually fix the slot.
      }

      // 3. Send Emails
      await sendBookingConfirmation(
        metadata.email,
        metadata.name,
        metadata.planName,
        metadata.date,
        metadata.time,
      );

      await sendAdminAlert(
        metadata.name,
        metadata.email,
        metadata.planName,
        metadata.date,
        metadata.time,
        metadata.notes,
      );

      console.log(`Successfully processed booking for session ${sessionId}`);
    } catch (error) {
      console.error("Error processing webhook data:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
