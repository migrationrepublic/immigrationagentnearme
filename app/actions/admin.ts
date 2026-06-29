"use server";

import { supabaseServer, createClientForAction } from "@/lib/supabase-server";

export async function checkIsAdminAction() {
  try {
    const supabase = await createClientForAction();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return { isAdmin: false };
      return await processUser(authUser);
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

export async function getAvailabilityForDateAction(date: string) {
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

export async function updateAvailabilityAction(date: string, blockedTimes: string[]) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: You are not an admin.");
  }

  // 1. Delete existing manual blocks for this date (where is_booked = true)
  // Wait, if it's an actual booking, we don't want to delete it.
  // Actually, how do we distinguish manual admin blocks from actual client bookings?
  // Currently, `is_booked` just means it's booked. 
  // If an admin manually blocks, it sets `is_booked = true`.
  // If a client books, it also sets `is_booked = true`.
  // Wait, if a client books, there is a record in `bookings` table.
  // We can just query `bookings` to see which slots have real bookings.
  // Then we delete from `availability` where date = date and time is NOT in the real bookings list.
  // Then we insert the new blockedTimes.
  
  // Actually, to make it bulletproof, we can just fetch real bookings for the date
  const { data: realBookings, error: bookingsError } = await supabaseServer
    .from("bookings")
    .select("time")
    .eq("date", date)
    .not("status", "eq", "cancelled");
    
  if (bookingsError) throw bookingsError;
  const bookedTimes = new Set(realBookings.map(b => b.time));

  // Remove any blocked times that are actually booked by clients, to prevent admins from un-blocking them by accident
  // Or rather, we should just let the client bookings be preserved.
  // First, delete ALL availability records for this date
  const { error: deleteError } = await supabaseServer
    .from("availability")
    .delete()
    .eq("date", date);

  if (deleteError) throw deleteError;

  // Now, we need to insert real bookings AND the new blockedTimes
  const timesToInsert = new Set([...bookedTimes, ...blockedTimes]);
  
  if (timesToInsert.size > 0) {
    const insertData = Array.from(timesToInsert).map((time) => ({
      date,
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
