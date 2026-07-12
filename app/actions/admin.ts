"use server";

import { supabaseServer, createClientForAction } from "@/lib/supabase-server";
import { z } from "zod";

// Zod Validation Schemas
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (must be YYYY-MM-DD)");

const AvailabilityUpdateSchema = z.object({
  date: DateSchema,
  blockedTimes: z.array(z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format (must be HH:mm:ss)")),
});

export async function checkIsAdminAction() {
  try {
    const supabase = await createClientForAction();
    // Use getUser() which validates the token with the Auth server (secure)
    // getSession() reads directly from cookies and is NOT authenticated
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { isAdmin: false };
    }

    return await processUser(user);
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
    .select("*, plans(name)")
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

  const updateFields: any = { status, updated_at: new Date().toISOString() };
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

export async function getAvailabilityForDateAction(dateInput: string) {
  // Validate input
  const date = DateSchema.parse(dateInput);

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  // Fetch actual bookings for this date
  const { data: realBookings, error: bookingsError } = await supabaseServer
    .from("bookings")
    .select("time")
    .eq("date", date)
    .not("status", "eq", "cancelled");

  if (bookingsError) throw bookingsError;
  const bookedTimes = realBookings.map((b) => b.time);

  // Fetch all blocked slots in the availability table
  const { data, error } = await supabaseServer
    .from("availability")
    .select("time")
    .eq("date", date)
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

export async function updateAvailabilityAction(dateInput: string, blockedTimesInput: string[]) {
  // Validate inputs
  const validated = AvailabilityUpdateSchema.parse({
    date: dateInput,
    blockedTimes: blockedTimesInput,
  });

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  // Fetch real bookings to protect them from deletion
  const { data: realBookings, error: bookingsError } = await supabaseServer
    .from("bookings")
    .select("time")
    .eq("date", validated.date)
    .not("status", "eq", "cancelled");

  if (bookingsError) throw bookingsError;
  const bookedTimes = new Set(realBookings.map(b => b.time));

  // Delete all availability records for this date
  const { error: deleteError } = await supabaseServer
    .from("availability")
    .delete()
    .eq("date", validated.date);

  if (deleteError) throw deleteError;

  // Insert real bookings AND the new blockedTimes
  const timesToInsert = new Set([...bookedTimes, ...validated.blockedTimes]);

  if (timesToInsert.size > 0) {
    const insertData = Array.from(timesToInsert).map((time) => ({
      date: validated.date,
      time,
      is_booked: true,
    }));

    const { error: insertError } = await supabaseServer
      .from("availability")
      .insert(insertData);

    if (insertError) throw insertError;
  }

  return { success: true };
}
