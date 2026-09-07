import { supabaseServer } from "@/lib/supabase-server";
import { Booking, Plan } from "@/lib/types";

/**
 * BookingService
 * 
 * Responsible for:
 * - Availability slots loading
 * - Stripe checkout integration
 * - Booking reservations
 * - Confirmations mapping
 */
export class BookingService {
  /**
   * Retrieves all active plans ordered by price.
   */
  static async getPlans(): Promise<Plan[]> {
    const { data, error } = await supabaseServer
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("price_aud", { ascending: true });

    if (error) {
      console.error("BookingService.getPlans error:", error);
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Retrieves a single plan by its ID.
   */
  static async getPlanById(id: string): Promise<Plan | null> {
    const { data, error } = await supabaseServer
      .from("plans")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`BookingService.getPlanById (${id}) error:`, error);
      return null;
    }
    return data;
  }

  /**
   * Retrieves a single plan by its slug.
   */
  static async getPlanBySlug(slug: string): Promise<Plan | null> {
    const { data, error } = await supabaseServer
      .from("plans")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error(`BookingService.getPlanBySlug (${slug}) error:`, error);
      return null;
    }
    return data;
  }

  /**
   * Retrieves all available consultation slots for a date and consultation
   * type (plan). Each plan (Phone / Online Video / In-Office) has its own
   * independent availability, so blocking a slot for one type does not
   * affect the others.
   */
  static async getAvailableSlots(date: string, planId: string): Promise<string[]> {
    const defaultSlots = [
      "09:00:00",
      "10:00:00",
      "11:00:00",
      "13:00:00",
      "14:00:00",
      "15:00:00",
      "16:00:00",
    ];

    // Fetch booked slots from availability table, scoped to this plan
    const { data, error } = await supabaseServer
      .from("availability")
      .select("time")
      .eq("date", date)
      .eq("plan_id", planId)
      .eq("is_booked", true);

    if (error) {
      console.error(`BookingService.getAvailableSlots (${date}, ${planId}) error:`, error);
      return defaultSlots;
    }

    const bookedTimes = new Set(data?.map((slot) => slot.time) || []);
    let availableSlots = defaultSlots.filter((time) => !bookedTimes.has(time));

    // Handle today's date filter (Australia/Melbourne timezone check)
    const melbourneNowStr = new Date().toLocaleString("en-US", { timeZone: "Australia/Melbourne" });
    const melbourneNow = new Date(melbourneNowStr);
    
    const yyyy = melbourneNow.getFullYear();
    const mm = String(melbourneNow.getMonth() + 1).padStart(2, "0");
    const dd = String(melbourneNow.getDate()).padStart(2, "0");
    const melbourneTodayStr = `${yyyy}-${mm}-${dd}`;

    if (date === melbourneTodayStr) {
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      availableSlots = availableSlots.filter((timeStr) => {
        const [sh, sm, ss] = timeStr.split(":").map(Number);
        const slotDate = new Date(melbourneNow);
        slotDate.setHours(sh, sm, ss, 0);
        return (slotDate.getTime() - melbourneNow.getTime()) >= twoHoursInMs;
      });
    }

    return availableSlots;
  }

  /**
   * Inserts a new booking record and blocks the availability slot.
   */
  static async createBooking(bookingInput: Omit<Booking, "id" | "status" | "created_at">): Promise<Booking> {
    // 1. Verify slot is not already booked for this consultation type
    const { data: slotData, error: slotError } = await supabaseServer
      .from("availability")
      .select("is_booked")
      .eq("date", bookingInput.date)
      .eq("time", bookingInput.time)
      .eq("plan_id", bookingInput.plan_id)
      .maybeSingle();

    if (slotError) {
      throw new Error(`Availability verify failed: ${slotError.message}`);
    }

    if (slotData && slotData.is_booked) {
      throw new Error("This time slot is no longer available.");
    }

    // 2. Insert the booking
    const { data, error } = await supabaseServer
      .from("bookings")
      .insert([
        {
          name: bookingInput.name,
          email: bookingInput.email,
          phone: bookingInput.phone,
          plan_id: bookingInput.plan_id,
          date: bookingInput.date,
          time: bookingInput.time,
          notes: bookingInput.notes,
          status: "confirmed",
          stripe_session_id: bookingInput.stripe_session_id,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("BookingService.createBooking insert error:", error);
      throw new Error(`Failed to create booking database entry: ${error.message}`);
    }

    // 3. Mark the availability slot as booked for this consultation type
    const { error: availabilityError } = await supabaseServer
      .from("availability")
      .upsert(
        {
          date: bookingInput.date,
          time: bookingInput.time,
          plan_id: bookingInput.plan_id,
          is_booked: true,
        },
        { onConflict: "date,time,plan_id" }
      );

    if (availabilityError) {
      console.error("BookingService.createBooking availability upsert error:", availabilityError);
    }

    return data;
  }

  /**
   * Confirms payment for a Stripe Session ID and updates status.
   */
  static async confirmBookingPayment(sessionId: string): Promise<boolean> {
    const { data: existingBooking, error: checkError } = await supabaseServer
      .from("bookings")
      .select("id, date, time, plan_id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (checkError) {
      console.error("BookingService.confirmBookingPayment check error:", checkError);
      return false;
    }

    if (!existingBooking) {
      return false;
    }

    const { error: updateError } = await supabaseServer
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", existingBooking.id);

    if (updateError) {
      console.error("BookingService.confirmBookingPayment update error:", updateError);
      return false;
    }

    // Ensure slot is booked for this consultation type
    await supabaseServer.from("availability").upsert(
      {
        date: existingBooking.date,
        time: existingBooking.time,
        plan_id: existingBooking.plan_id,
        is_booked: true,
      },
      { onConflict: "date,time,plan_id" }
    );

    return true;
  }

  /**
   * Cancels a booking and releases the slot.
   */
  static async cancelBooking(bookingId: string): Promise<boolean> {
    const { data: booking, error: fetchError } = await supabaseServer
      .from("bookings")
      .select("date, time, plan_id")
      .eq("id", bookingId)
      .single();

    if (fetchError) {
      console.error("BookingService.cancelBooking fetch error:", fetchError);
      return false;
    }

    // Update status to cancelled
    const { error: updateError } = await supabaseServer
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (updateError) {
      console.error("BookingService.cancelBooking update error:", updateError);
      return false;
    }

    // Delete availability record to release slot for this consultation type
    const { error: deleteError } = await supabaseServer
      .from("availability")
      .delete()
      .eq("date", booking.date)
      .eq("time", booking.time)
      .eq("plan_id", booking.plan_id);

    if (deleteError) {
      console.error("BookingService.cancelBooking availability release error:", deleteError);
    }

    return true;
  }
}
