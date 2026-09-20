"use server";

import { z } from "zod";
import { CustomerService } from "@/lib/services/customer.service";
import { CustomerInput } from "@/lib/types";
import { checkIsAdminAction } from "./admin";

async function verifyAdmin() {
  return (await checkIsAdminAction()).isAdmin;
}

const CustomerInputSchema = z.object({
  customer_type: z.enum(["business", "individual"]),
  salutation: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  display_name: z.string().min(1, "Display name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  work_phone: z.string().optional(),
  mobile: z.string().optional(),
  language: z.string().optional(),
});

export async function getCustomersAction() {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  return CustomerService.listCustomers();
}

export async function getCustomerAction(id: string) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  return CustomerService.getCustomerById(parsedId);
}

export async function createCustomerAction(input: CustomerInput) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const validated = CustomerInputSchema.parse(input);
  const customer = await CustomerService.createCustomer(validated);
  return { success: true, customer };
}

export async function updateCustomerAction(id: string, input: CustomerInput) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  const validated = CustomerInputSchema.parse(input);
  const customer = await CustomerService.updateCustomer(parsedId, validated);
  return { success: true, customer };
}

export async function deleteCustomerAction(id: string) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  await CustomerService.deleteCustomer(parsedId);
  return { success: true };
}
