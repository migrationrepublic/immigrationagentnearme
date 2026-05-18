"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { headers } from "next/headers";

// Define the schema for booking input
const BookingSchema = z.object({
  planId: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:mm:ss
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  notes: z.string().optional(),
});

export type BookingInput = z.infer<typeof BookingSchema>;

export async function getPlans() {
  const { data, error } = await supabaseServer
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price_aud", { ascending: true });

  if (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
  return data;
}

export async function getPlan(id: string) {
  const { data, error } = await supabaseServer
    .from("plans")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching plan:", error);
    return null;
  }
  return data;
}

export async function getPlanBySlug(slug: string) {
  const { data, error } = await supabaseServer
    .from("plans")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching plan by slug:", error);
    return null;
  }
  return data;
}

export async function getAvailableSlots(date: string) {
  // Format: YYYY-MM-DD
  const { data, error } = await supabaseServer
    .from("availability")
    .select("time, is_booked")
    .eq("date", date)
    .order("time", { ascending: true });

  if (error) {
    console.error("Error fetching slots:", error);
    return [];
  }

  // Filter out booked slots
  return data.filter((slot) => !slot.is_booked).map((slot) => slot.time);
}

import { sendBookingConfirmation, sendAdminAlert } from "@/lib/email";

export async function createCheckoutSession(input: BookingInput) {
  try {
    const validatedData = BookingSchema.parse(input);

    // 1. Fetch the plan details to get the price and name
    const plan = await getPlan(validatedData.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    // 2. Verify the slot is still available (prevent double booking at checkout start)
    const { data: slotData, error: slotError } = await supabaseServer
      .from("availability")
      .select("is_booked")
      .eq("date", validatedData.date)
      .eq("time", validatedData.time)
      .maybeSingle();

    if (slotError) {
      console.error("Error fetching availability:", slotError);
      throw new Error("Could not verify slot availability.");
    }

    // If slot exists and is booked, reject
    if (slotData && slotData.is_booked) {
      throw new Error("This time slot is no longer available.");
    }

    const host = (await headers()).get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const hasStripeKey = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_');

    // BYPASS STRIPE FOR TESTING OR "FREE" MODE
    if (!hasStripeKey || plan.price_aud === 0) {
      const mockSessionId = "mock_session_" + Math.random().toString(36).substring(7);
      
      // Insert Booking
      const { error: insertError } = await supabaseServer.from("bookings").insert([{
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        plan_id: validatedData.planId,
        date: validatedData.date,
        time: validatedData.time,
        notes: validatedData.notes,
        status: "confirmed",
        stripe_session_id: mockSessionId,
      }]);

      if (insertError) {
        console.error("Error saving mock booking:", insertError);
        throw new Error(`Failed to save booking: ${insertError.message}`);
      }

      // Upsert Availability
      const { error: upsertError } = await supabaseServer.from("availability").upsert({
        date: validatedData.date,
        time: validatedData.time,
        is_booked: true
      }, { onConflict: "date, time" });

      if (upsertError) {
        console.error("Error updating availability:", upsertError);
        // We don't throw here to avoid failing the whole process if just availability update fails
      }

      // Send Emails
      await sendBookingConfirmation(
        validatedData.email,
        validatedData.name,
        plan.name,
        validatedData.date,
        validatedData.time
      );
      
      await sendAdminAlert(
        validatedData.name,
        validatedData.email,
        plan.name,
        validatedData.date,
        validatedData.time,
        validatedData.notes
      );

      return { url: `${appUrl}/success?session_id=${mockSessionId}` };
    }

    // 3. NORMAL STRIPE FLOW
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: validatedData.email,
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: `Consultation: ${plan.name}`,
              description: `${plan.duration_minutes} minutes consultation on ${validatedData.date} at ${validatedData.time}`,
            },
            unit_amount: plan.price_aud, 
          },
          quantity: 1,
        },
      ],
      metadata: {
        planId: validatedData.planId,
        planName: plan.name,
        date: validatedData.date,
        time: validatedData.time,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        notes: (validatedData.notes || "").substring(0, 490), // Limit length for metadata
      },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/book/${plan.id}?canceled=true`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error("Failed to generate checkout URL. Please try again.");
    }

    return { url: session.url };
  } catch (error) {
    console.error("Checkout error:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error("Error retrieving session:", error);
    return null;
  }
}

export async function handleSuccessfulPaymentAction(sessionId: string) {
  try {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // 1. Retrieve Checkout Session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      throw new Error("Session not found in Stripe");
    }

    // 2. Validate Payment Status
    if (session.payment_status !== "paid") {
      return { success: false, error: `Session payment status is ${session.payment_status}` };
    }

    const metadata = session.metadata;
    if (
      !metadata ||
      !metadata.name ||
      !metadata.email ||
      !metadata.date ||
      !metadata.time ||
      !metadata.planId
    ) {
      return { success: false, error: "Required metadata is missing in the checkout session" };
    }

    // 3. Prevent Duplicate Booking
    const { data: existingBooking, error: checkError } = await supabaseServer
      .from("bookings")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing booking in action:", checkError);
    }

    if (existingBooking) {
      console.log(`Booking already exists for session (processed via action backup): ${sessionId}`);
      return { success: true, alreadyExists: true };
    }

    // 4. Insert Booking into bookings table
    const { error: bookingError } = await supabaseServer
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
      ]);

    if (bookingError) {
      console.error("Booking insert failed in backup action:", bookingError);
      throw new Error(`Failed to create booking database entry: ${bookingError.message}`);
    }

    // 5. Mark Slot As Booked in availability table
    const { error: availabilityError } = await supabaseServer
      .from("availability")
      .upsert(
        {
          date: metadata.date,
          time: metadata.time,
          is_booked: true,
        },
        {
          onConflict: "date,time",
        }
      );

    if (availabilityError) {
      console.error("Availability update failed in backup action:", availabilityError);
    }

    // 6. Send Confirmation and Admin Emails
    try {
      await sendBookingConfirmation(
        metadata.email,
        metadata.name,
        metadata.planName || "Consultation",
        metadata.date,
        metadata.time
      );

      await sendAdminAlert(
        metadata.name,
        metadata.email,
        metadata.planName || "Consultation",
        metadata.date,
        metadata.time,
        metadata.notes || ""
      );
    } catch (emailError) {
      console.error("Email delivery failed in backup action:", emailError);
    }

    console.log(`Booking processed successfully via backup action: ${sessionId}`);
    return { success: true, processedNow: true };
  } catch (error) {
    console.error("Backup booking processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

