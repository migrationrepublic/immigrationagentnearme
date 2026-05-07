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
  } catch (e: any) {
    console.error("Admin check error:", e);
    return { isAdmin: false };
  }
}

async function processUser(user: any) {
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
