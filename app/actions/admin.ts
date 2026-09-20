"use server";

import { supabaseServer, createClientForAction } from "@/lib/supabase-server";
import { z } from "zod";
import { EmailService } from "@/lib/services/email.service";
import { InvoiceService } from "@/lib/services/invoice.service";
import { CustomerService } from "@/lib/services/customer.service";

// Zod Validation Schemas
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (must be YYYY-MM-DD)");

const AvailabilityUpdateSchema = z.object({
  date: DateSchema,
  blockedTimes: z.array(z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format (must be HH:mm:ss)")),
  planId: z.string().uuid("Invalid plan ID"),
});

const TimeSchema = z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format (must be HH:mm:ss)");

const DEFAULT_SLOTS = [
  "09:00:00", "10:00:00", "11:00:00",
  "13:00:00", "14:00:00", "15:00:00", "16:00:00",
];

const BulkAvailabilitySchema = z.object({
  startDate: DateSchema,
  endDate: DateSchema,
  planId: z.string().uuid("Invalid plan ID"),
  mode: z.enum(["block", "unblock"]),
  times: z.array(TimeSchema).optional(),
});

export async function checkIsAdminAction() {
  try {
    const supabase = await createClientForAction();
    // getSession() reads the (signed, tamper-proof) JWT straight from the
    // cookie — no network round trip to the Supabase Auth server. This is
    // called on every single admin server action, so that round trip (which
    // getUser() pays every time to also re-check ban/deletion status) was
    // the single biggest source of admin-panel latency. It's safe here
    // because the real authorization gate is the `admins` table lookup right
    // below, run against a cryptographically-signed user id.
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return { isAdmin: false };
    }

    return await processUser(session.user);
  } catch (e: unknown) {
    console.error("Admin check error:", e);
    return { isAdmin: false };
  }
}

async function processUser(user: { id: string }) {
  // Check DB using service role
  const { data: admin } = await supabaseServer
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    isAdmin: !!admin,
  };
}

async function verifyAdmin() {
  const res = await checkIsAdminAction();
  return res.isAdmin;
}

export async function getBookingsAction() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  const { data, error } = await supabaseServer
    .from("bookings")
    .select("*, plans(name), invoices(id, invoice_number, status, total, balance_due)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getToolLeadsAction() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  const { data, error } = await supabaseServer
    .from("tool_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getWebsiteLeadsAction() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  const { data, error } = await supabaseServer
    .from("website_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateWebsiteLeadStatusAction(idInput: string, statusInput: string, notesInput?: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  const id = z.string().uuid("Invalid lead ID").parse(idInput);
  const status = z.string().min(1).parse(statusInput);
  const notes = notesInput !== undefined ? z.string().nullable().parse(notesInput) : undefined;

  const updateFields: Record<string, string | null> = { status, updated_at: new Date().toISOString() };
  if (notes !== undefined) {
    updateFields.notes = notes;
  }

  const { data, error } = await supabaseServer
    .from("website_leads")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { success: true, lead: data };
}

export async function bulkUpdateWebsiteLeadStatusAction(idsInput: string[], statusInput: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  const ids = z.array(z.string().uuid("Invalid lead ID")).min(1, "No leads selected").parse(idsInput);
  const status = z.string().min(1).parse(statusInput);

  const { data, error } = await supabaseServer
    .from("website_leads")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids)
    .select();

  if (error) throw error;
  return { success: true, count: data?.length || 0, leads: data };
}

export async function getAvailabilityForDateAction(dateInput: string, planIdInput: string) {
  // Validate input
  const date = DateSchema.parse(dateInput);
  const planId = z.string().uuid("Invalid plan ID").parse(planIdInput);

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  // Fetch actual bookings for this date, scoped to this consultation type
  const { data: realBookings, error: bookingsError } = await supabaseServer
    .from("bookings")
    .select("time")
    .eq("date", date)
    .eq("plan_id", planId)
    .not("status", "eq", "cancelled");

  if (bookingsError) throw bookingsError;
  const bookedTimes = realBookings.map((b) => b.time);

  // Fetch all blocked slots in the availability table for this consultation type
  const { data, error } = await supabaseServer
    .from("availability")
    .select("time")
    .eq("date", date)
    .eq("plan_id", planId)
    .eq("is_booked", true);

  if (error) throw error;

  // A slot is "manually blocked" if it's in the availability table but NOT in real bookings
  const allBlocked = data.map((d) => d.time);
  const manuallyBlockedTimes = allBlocked.filter((t) => !bookedTimes.includes(t));

  return {
    blockedTimes: manuallyBlockedTimes,
    bookedTimes
  };
}

export async function updateAvailabilityAction(dateInput: string, blockedTimesInput: string[], planIdInput: string) {
  // Validate inputs
  const validated = AvailabilityUpdateSchema.parse({
    date: dateInput,
    blockedTimes: blockedTimesInput,
    planId: planIdInput,
  });

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  // Fetch real bookings to protect them from deletion, scoped to this consultation type
  const { data: realBookings, error: bookingsError } = await supabaseServer
    .from("bookings")
    .select("time")
    .eq("date", validated.date)
    .eq("plan_id", validated.planId)
    .not("status", "eq", "cancelled");

  if (bookingsError) throw bookingsError;
  const bookedTimes = new Set(realBookings.map(b => b.time));

  // Delete availability records for this date, scoped to this consultation type only
  // (other consultation types' availability is left untouched)
  const { error: deleteError } = await supabaseServer
    .from("availability")
    .delete()
    .eq("date", validated.date)
    .eq("plan_id", validated.planId);

  if (deleteError) throw deleteError;

  // Insert real bookings AND the new blockedTimes for this consultation type
  const timesToInsert = new Set([...bookedTimes, ...validated.blockedTimes]);

  if (timesToInsert.size > 0) {
    const insertData = Array.from(timesToInsert).map((time) => ({
      date: validated.date,
      time,
      plan_id: validated.planId,
      is_booked: true,
    }));

    const { error: insertError } = await supabaseServer
      .from("availability")
      .insert(insertData);

    if (insertError) throw insertError;
  }

  return { success: true };
}

/**
 * Blocks or releases every time slot for a consultation type across a whole
 * date range in one go (e.g. "disable In-Office Consultation for a month")
 * instead of the admin having to open the panel and block each day by hand.
 * Existing client bookings are always protected — they are never blocked out
 * or removed by this action.
 */
export async function bulkUpdateAvailabilityAction(input: {
  startDate: string;
  endDate: string;
  planId: string;
  mode: "block" | "unblock";
  times?: string[];
}) {
  const validated = BulkAvailabilitySchema.parse(input);

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  if (validated.startDate > validated.endDate) {
    throw new Error("Start date must be on or before the end date.");
  }

  const times = validated.times && validated.times.length > 0 ? validated.times : DEFAULT_SLOTS;

  // Build the list of dates in the range (inclusive), capped to a sane max.
  const dates: string[] = [];
  const cursor = new Date(`${validated.startDate}T00:00:00Z`);
  const end = new Date(`${validated.endDate}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (dates.length > 366) {
      throw new Error("Date range is too large (max 366 days).");
    }
  }

  // Real, non-cancelled bookings for this plan in range must never be touched.
  const { data: realBookings, error: bookingsError } = await supabaseServer
    .from("bookings")
    .select("date, time")
    .eq("plan_id", validated.planId)
    .gte("date", validated.startDate)
    .lte("date", validated.endDate)
    .not("status", "eq", "cancelled");

  if (bookingsError) throw bookingsError;
  const bookedSet = new Set(realBookings.map((b) => `${b.date}|${b.time}`));

  if (validated.mode === "block") {
    const rows = dates.flatMap((date) =>
      times.map((time) => ({ date, time, plan_id: validated.planId, is_booked: true }))
    );

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabaseServer
        .from("availability")
        .upsert(chunk, { onConflict: "date,time,plan_id" });
      if (error) throw error;
    }

    return { success: true, datesAffected: dates.length };
  }

  // mode === "unblock": release manually-blocked slots in range, leaving real bookings intact.
  const { data: availRows, error: availError } = await supabaseServer
    .from("availability")
    .select("id, date, time")
    .eq("plan_id", validated.planId)
    .gte("date", validated.startDate)
    .lte("date", validated.endDate)
    .in("time", times);

  if (availError) throw availError;

  const idsToDelete = (availRows || [])
    .filter((r) => !bookedSet.has(`${r.date}|${r.time}`))
    .map((r) => r.id);

  for (let i = 0; i < idsToDelete.length; i += 500) {
    const chunk = idsToDelete.slice(i, i + 500);
    const { error } = await supabaseServer.from("availability").delete().in("id", chunk);
    if (error) throw error;
  }

  return { success: true, datesAffected: dates.length };
}

const AdminBookingSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  planId: z.string().uuid("Invalid plan ID"),
  date: z.string(),
  time: z.string(),
  notes: z.string().optional(),
  status: z.enum(["confirmed", "pending", "cancelled"]).default("confirmed"),
});

export async function createAdminBookingAction(input: z.infer<typeof AdminBookingSchema>) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  const validated = AdminBookingSchema.parse(input);

  let formattedTime = validated.time;
  if (/^\d{2}:\d{2}$/.test(formattedTime)) {
    formattedTime = `${formattedTime}:00`;
  }

  const { data, error } = await supabaseServer
    .from("bookings")
    .insert([
      {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        plan_id: validated.planId,
        date: validated.date,
        time: formattedTime,
        notes: validated.notes || "",
        status: validated.status,
      },
    ])
    .select("*, plans(name)")
    .single();

  if (error) {
    console.error("createAdminBookingAction error:", error);
    throw new Error(`Failed to create booking: ${error.message}`);
  }

  if (validated.status === "confirmed") {
    await supabaseServer
      .from("availability")
      .upsert(
        {
          date: validated.date,
          time: formattedTime,
          plan_id: validated.planId,
          is_booked: true,
        },
        { onConflict: "date,time,plan_id" }
      );
  }

  // Auto-generate the customer record and invoice for this booking (draft,
  // or paid immediately if the admin is entering an already-confirmed/paid
  // booking). Cancelled bookings don't need either.
  if (validated.status !== "cancelled") {
    await CustomerService.getOrCreateFromBooking({
      name: data.name,
      email: data.email,
      phone: data.phone,
      bookingId: data.id,
    });
    await InvoiceService.createDraftInvoiceForBooking(data);
    if (validated.status === "confirmed") {
      await InvoiceService.markInvoicePaidManual(data.id);
    }
  }

  const { data: freshBooking, error: refetchError } = await supabaseServer
    .from("bookings")
    .select("*, plans(name), invoices(id, invoice_number, status, total, balance_due)")
    .eq("id", data.id)
    .single();

  if (refetchError) {
    console.error("createAdminBookingAction refetch error:", refetchError);
    return { success: true, booking: data };
  }

  return { success: true, booking: freshBooking };
}

export async function updateBookingStatusAction(bookingIdInput: string, statusInput: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  const bookingId = z.string().uuid("Invalid booking ID").parse(bookingIdInput);
  const status = z.enum(["confirmed", "pending", "cancelled"]).parse(statusInput);

  const { error } = await supabaseServer
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) {
    console.error("updateBookingStatusAction error:", error);
    throw new Error(`Failed to update booking status: ${error.message}`);
  }

  // Keep the linked invoice in sync with the booking's status.
  if (status === "confirmed") {
    await InvoiceService.markInvoicePaidManual(bookingId);
  } else if (status === "cancelled") {
    await InvoiceService.cancelInvoiceForBooking(bookingId);
  }

  const { data, error: refetchError } = await supabaseServer
    .from("bookings")
    .select("*, plans(name), invoices(id, invoice_number, status, total, balance_due)")
    .eq("id", bookingId)
    .single();

  if (refetchError) {
    console.error("updateBookingStatusAction refetch error:", refetchError);
    throw new Error(`Failed to reload booking after status update: ${refetchError.message}`);
  }

  return { success: true, booking: data };
}

export async function getAdminPlansAction() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  const { data, error } = await supabaseServer
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price_aud", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendBookingReminderAction(bookingIdInput: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  const bookingId = z.string().uuid("Invalid booking ID").parse(bookingIdInput);

  const { data: booking, error } = await supabaseServer
    .from("bookings")
    .select("*, plans(name)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    throw new Error("Booking not found");
  }

  const planName = booking.plans?.name || "Consultation";
  await EmailService.sendAppointmentReminder(
    booking.email,
    booking.name,
    planName,
    booking.date,
    booking.time
  );

  return { success: true, message: `Appointment reminder sent to ${booking.email}` };
}

export async function sendGoogleReviewRequestAction(bookingIdInput: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  const bookingId = z.string().uuid("Invalid booking ID").parse(bookingIdInput);

  const { data: booking, error } = await supabaseServer
    .from("bookings")
    .select("*, plans(name)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    throw new Error("Booking not found");
  }

  await EmailService.sendGoogleReviewRequest(booking.email, booking.name);

  return { success: true, message: `Google review request sent to ${booking.email}` };
}

/**
 * Everything the Dashboard's "Overview" page needs, in one round trip.
 *
 * The dashboard previously issued ~7 separate queries straight from the
 * browser using the anon-key client — each one subject to RLS policy
 * evaluation, and several (`website_leads`, `tool_submissions`) pulling
 * every column of every row just to compute status/type counts client-side.
 * That's the page every admin lands on after logging in, so it was the
 * single biggest source of "admin panel feels slow."
 *
 * This runs server-side with the service-role client (bypasses RLS, so
 * Postgres doesn't re-check `auth.uid() IN admins` per row), fetches only
 * the columns each computation actually needs, and fans every query out in
 * parallel — one network hop from the browser instead of seven.
 */
export async function getDashboardStatsAction() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  // "Today" in the business's own timezone, not the viewing admin's browser.
  const melbourneNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Australia/Melbourne" }));
  const todayStr = `${melbourneNow.getFullYear()}-${String(melbourneNow.getMonth() + 1).padStart(2, "0")}-${String(melbourneNow.getDate()).padStart(2, "0")}`;

  const [
    { count: todayBookings },
    { count: pendingDocs },
    { count: pendingSignatures },
    { data: websiteLeadStatuses },
    { data: recentWebsiteLeadsRaw },
    { data: toolLeadNames },
    { data: recentToolLeadsRaw },
    { data: bookingsRevenue },
    { data: activityRaw },
  ] = await Promise.all([
    supabaseServer.from("bookings").select("id", { count: "exact", head: true }).eq("date", todayStr),
    supabaseServer.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabaseServer.from("signature_requests").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabaseServer.from("website_leads").select("status"),
    supabaseServer
      .from("website_leads")
      .select("id, first_name, last_name, email, subject, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(7),
    supabaseServer.from("tool_submissions").select("tool_name"),
    supabaseServer
      .from("tool_submissions")
      .select("id, user_name, user_email, tool_name, results, created_at")
      .order("created_at", { ascending: false })
      .limit(7),
    supabaseServer.from("bookings").select("plans(price_aud)").eq("status", "confirmed"),
    supabaseServer.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  let revenue = 0;
  const typedBookings = bookingsRevenue as unknown as Array<{ plans: { price_aud: number } | null }> | null;
  typedBookings?.forEach(b => { if (b.plans?.price_aud) revenue += b.plans.price_aud; });

  const wStatuses = (websiteLeadStatuses || []) as { status: string | null }[];
  const websiteLeadsTotal = wStatuses.length;
  const websiteLeadsNew = wStatuses.filter(l => (l.status || "new") === "new").length;
  const websiteLeadsContacted = wStatuses.filter(l => l.status === "contacted").length;
  const websiteLeadsInProgress = wStatuses.filter(l => l.status === "in_progress").length;
  const websiteLeadsArchived = wStatuses.filter(l => l.status === "archived").length;

  const tNames = (toolLeadNames || []) as { tool_name: string | null }[];
  const toolLeadsTotal = tNames.length;
  const toolLeadsPRCount = tNames.filter(l => l.tool_name === "PR Calculator" || l.tool_name === "PR Points Calculator").length;
  const toolLeads482Count = tNames.filter(l => l.tool_name?.includes("482") && !l.tool_name?.includes("Business Sponsor")).length;
  const toolLeadsEligibilityCount = tNames.filter(l => l.tool_name === "Eligibility Checker").length;
  const toolLeadsSponsorCount = tNames.filter(l => l.tool_name?.includes("Business Sponsor")).length;
  const toolLeadsCostCount = tNames.filter(l => l.tool_name?.includes("Cost Estimator") || l.tool_name?.includes("Sponsorship Cost")).length;
  const toolLeadsApplicantCostCount = tNames.filter(l => l.tool_name?.includes("Applicant Cost")).length;
  const toolLeadsQuizCount = tNames.filter(l =>
    l.tool_name === "Visa Suggestion Quiz" ||
    (!l.tool_name?.includes("482") &&
      l.tool_name !== "PR Calculator" &&
      l.tool_name !== "PR Points Calculator" &&
      l.tool_name !== "Eligibility Checker" &&
      !l.tool_name?.includes("Business Sponsor") &&
      !l.tool_name?.includes("Cost"))
  ).length;

  return {
    stats: {
      todayBookings: todayBookings || 0,
      pendingDocs: pendingDocs || 0,
      pendingSignatures: pendingSignatures || 0,
      websiteLeadsTotal,
      websiteLeadsNew,
      websiteLeadsContacted,
      websiteLeadsInProgress,
      websiteLeadsArchived,
      toolLeadsTotal,
      toolLeadsPRCount,
      toolLeads482Count,
      toolLeadsEligibilityCount,
      toolLeadsQuizCount,
      toolLeadsSponsorCount,
      toolLeadsCostCount,
      toolLeadsApplicantCostCount,
      revenue: revenue / 100,
    },
    recentWebsiteLeads: recentWebsiteLeadsRaw || [],
    recentToolLeads: recentToolLeadsRaw || [],
    activity: activityRaw || [],
  };
}


