"use server";

import { BookingService } from "@/lib/services/booking.service";
import { EmailService } from "@/lib/services/email.service";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { headers } from "next/headers";
import { env } from "@/lib/env";

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
  try {
    return await BookingService.getPlans();
  } catch (error) {
    console.error("Action getPlans error:", error);
    return [];
  }
}

export async function getPlan(id: string) {
  try {
    return await BookingService.getPlanById(id);
  } catch (error) {
    console.error("Action getPlan error:", error);
    return null;
  }
}

export async function getPlanBySlug(slug: string) {
  try {
    return await BookingService.getPlanBySlug(slug);
  } catch (error) {
    console.error("Action getPlanBySlug error:", error);
    return null;
  }
}

export async function getAvailableSlots(date: string) {
  try {
    return await BookingService.getAvailableSlots(date);
  } catch (error) {
    console.error("Action getAvailableSlots error:", error);
    return [];
  }
}

export async function createCheckoutSession(input: BookingInput) {
  try {
    const validatedData = BookingSchema.parse(input);

    // 1. Fetch plan
    const plan = await BookingService.getPlanById(validatedData.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    const host = (await headers()).get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const appUrl = env.APP_URL || `${protocol}://${host}`;
    const hasStripeKey = env.STRIPE_KEY && env.STRIPE_KEY.startsWith("sk_");

    // BYPASS STRIPE FOR TESTING OR "FREE" MODE
    if (!hasStripeKey || plan.price_aud === 0) {
      const mockSessionId = "mock_session_" + Math.random().toString(36).substring(7);
      
      // Call Booking Service
      await BookingService.createBooking({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        plan_id: validatedData.planId,
        date: validatedData.date,
        time: validatedData.time,
        notes: validatedData.notes || "",
        stripe_session_id: mockSessionId,
      });

      // Send Emails via Email Service
      await EmailService.sendBookingConfirmation(
        validatedData.email,
        validatedData.name,
        plan.name,
        validatedData.date,
        validatedData.time,
        validatedData.phone
      );
      
      await EmailService.sendAdminBookingAlert(
        validatedData.name,
        validatedData.email,
        plan.name,
        validatedData.date,
        validatedData.time,
        validatedData.phone,
        validatedData.notes
      );

      return { url: `${appUrl}/success?session_id=${mockSessionId}` };
    }

    // 2. NORMAL STRIPE FLOW
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
        notes: (validatedData.notes || "").substring(0, 490),
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
      error: error instanceof Error ? error.message : "An unknown error occurred",
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

    // Retrieve Session from Stripe to verify payment metadata
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      throw new Error("Session not found in Stripe");
    }

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

    // Confirm booking using BookingService
    const confirmed = await BookingService.confirmBookingPayment(sessionId);

    // If it was already confirmed or mock session was pre-filled, we check if it already existed
    if (confirmed) {
      // Send Confirmation and Admin Emails
      try {
        await EmailService.sendBookingConfirmation(
          metadata.email,
          metadata.name,
          metadata.planName || "Consultation",
          metadata.date,
          metadata.time,
          metadata.phone || ""
        );

        await EmailService.sendAdminBookingAlert(
          metadata.name,
          metadata.email,
          metadata.planName || "Consultation",
          metadata.date,
          metadata.time,
          metadata.phone || "",
          metadata.notes || ""
        );
      } catch (emailError) {
        console.error("Email delivery failed in backup action:", emailError);
      }
    }

    console.log(`Booking payment checked successfully: ${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Backup booking processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
