"use server";

import { supabaseServer, createClientForAction } from "@/lib/supabase-server";
import { cookies } from "next/headers";

// Helper to verify if the user is an admin
async function verifyAdmin() {
  const supabase = await createClientForAction();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data: admin } = await supabaseServer
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .single();

  return !!admin;
}

export async function getBookingsAction() {
  // We use supabaseServer to bypass RLS, but we MUST check if the user is an admin first
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
