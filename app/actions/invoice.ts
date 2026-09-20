"use server";

import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";
import { InvoiceService } from "@/lib/services/invoice.service";
import { SettingsService } from "@/lib/services/settings.service";
import { InvoiceInput, InvoiceStatus } from "@/lib/types";
import { checkIsAdminAction } from "./admin";

async function verifyAdmin() {
  return (await checkIsAdminAction()).isAdmin;
}

const LineItemSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  rate: z.number().min(0),
  discount_percent: z.number().min(0).max(100).default(0),
  tax_percent: z.number().min(0).max(100).default(0),
});

const InvoiceInputSchema = z.object({
  bill_to_name: z.string().min(1, "Customer name is required"),
  bill_to_email: z.string().email("Invalid email address"),
  bill_to_phone: z.string().optional(),
  bill_to_address: z.string().optional(),
  booking_id: z.string().uuid().nullable().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  invoice_date: z.string().min(1),
  due_date: z.string().min(1),
  terms: z.string().optional(),
  notes: z.string().optional(),
  line_items: z.array(LineItemSchema).min(1, "At least one line item is required"),
});

export async function getInvoicesAction() {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  return InvoiceService.listInvoices();
}

export async function getInvoiceAction(id: string) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  return InvoiceService.getInvoiceById(parsedId);
}

export async function getInvoiceCatalogItemsAction() {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  return InvoiceService.getCatalogItems();
}

/**
 * Everything the invoice editor page needs, in one round trip: catalog
 * items, customer suggestions, business settings, and (when editing an
 * existing invoice) the invoice itself. Replaces 3-4 separate action calls
 * — each of which paid its own admin-check + network round trip — with one.
 */
export async function getInvoiceEditorDataAction(id?: string) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");

  const [catalogItems, customerSuggestions, settings, invoice] = await Promise.all([
    InvoiceService.getCatalogItems(),
    InvoiceService.getCustomerSuggestions(),
    SettingsService.getSettings(),
    id ? InvoiceService.getInvoiceById(z.string().uuid().parse(id)) : Promise.resolve(null),
  ]);

  return { catalogItems, customerSuggestions, settings, invoice };
}

const CatalogItemInputSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  default_rate: z.number().min(0),
});

export async function getAllCatalogItemsAction() {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  return InvoiceService.getAllCatalogItems();
}

export async function createCatalogItemAction(input: z.infer<typeof CatalogItemInputSchema>) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const validated = CatalogItemInputSchema.parse(input);
  const item = await InvoiceService.createCatalogItem(validated);
  return { success: true, item };
}

export async function updateCatalogItemAction(
  id: string,
  input: z.infer<typeof CatalogItemInputSchema> & { is_active: boolean }
) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  const validated = CatalogItemInputSchema.extend({ is_active: z.boolean() }).parse(input);
  const item = await InvoiceService.updateCatalogItem(parsedId, validated);
  return { success: true, item };
}

export async function deleteCatalogItemAction(id: string) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  await InvoiceService.deleteCatalogItem(parsedId);
  return { success: true };
}

export async function getInvoiceCustomerSuggestionsAction() {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  return InvoiceService.getCustomerSuggestions();
}

export async function createInvoiceAction(input: InvoiceInput) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const validated = InvoiceInputSchema.parse(input);
  const invoice = await InvoiceService.createInvoice(validated);
  return { success: true, invoice };
}

export async function updateInvoiceAction(id: string, input: InvoiceInput) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  const validated = InvoiceInputSchema.parse(input);
  const invoice = await InvoiceService.updateInvoice(parsedId, validated);
  return { success: true, invoice };
}

export async function deleteInvoiceAction(id: string) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  await InvoiceService.deleteInvoice(parsedId);
  return { success: true };
}

export async function updateInvoiceStatusAction(id: string, status: InvoiceStatus) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  const parsedStatus = z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).parse(status);
  const invoice = await InvoiceService.updateStatus(parsedId, parsedStatus);
  return { success: true, invoice };
}

const PaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than 0"),
  payment_date: z.string().min(1),
  mode: z.string().min(1),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

export async function recordInvoicePaymentAction(id: string, payment: z.infer<typeof PaymentSchema>) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  const validated = PaymentSchema.parse(payment);
  const invoice = await InvoiceService.recordPayment(parsedId, validated);
  return { success: true, invoice };
}

export async function sendInvoiceEmailAction(id: string) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(id);
  const sent = await InvoiceService.sendInvoiceEmail(parsedId);
  if (!sent) throw new Error("Failed to send invoice email. Please check your email configuration.");
  return { success: true, message: "Invoice emailed to client." };
}

/**
 * Manual fallback: regenerates a draft invoice for a booking that doesn't
 * already have one (e.g. a booking created before this feature shipped).
 */
export async function generateInvoiceForBookingAction(bookingId: string) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(bookingId);

  const { data: booking, error } = await supabaseServer
    .from("bookings")
    .select("*, plans(name)")
    .eq("id", parsedId)
    .single();

  if (error || !booking) throw new Error("Booking not found");

  const invoice = await InvoiceService.createDraftInvoiceForBooking(booking);
  if (!invoice) throw new Error("Failed to generate invoice for this booking.");
  return { success: true, invoice };
}

export async function getInvoiceByBookingIdAction(bookingId: string) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const parsedId = z.string().uuid().parse(bookingId);
  return InvoiceService.getInvoiceByBookingId(parsedId);
}
