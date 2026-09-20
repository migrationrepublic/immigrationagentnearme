import { supabaseServer } from "@/lib/supabase-server";
import { Booking, Invoice, InvoiceInput, InvoiceLineItemInput, InvoiceStatus } from "@/lib/types";
import { InvoicePdfService } from "./invoicePdf.service";
import { EmailService } from "./email.service";
import { SettingsService } from "./settings.service";

const INVOICE_SELECT = "*, line_items:invoice_line_items(*), payments:invoice_payments(*), bookings(id, date, time, plans(name))";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Computes the line amount (qty * rate, less discount%) and its tax portion. */
function computeLine(item: InvoiceLineItemInput) {
  const gross = item.quantity * item.rate;
  const discountAmount = gross * ((item.discount_percent || 0) / 100);
  const amount = round2(gross - discountAmount);
  const taxAmount = round2(amount * ((item.tax_percent || 0) / 100));
  return { amount, taxAmount, discountAmount: round2(discountAmount) };
}

function computeTotals(items: InvoiceLineItemInput[]) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  for (const item of items) {
    const { amount, taxAmount, discountAmount } = computeLine(item);
    subtotal += amount;
    discountTotal += discountAmount;
    taxTotal += taxAmount;
  }

  subtotal = round2(subtotal);
  discountTotal = round2(discountTotal);
  taxTotal = round2(taxTotal);
  const total = round2(subtotal + taxTotal);

  return { subtotal, discountTotal, taxTotal, total };
}

/**
 * InvoiceService
 *
 * Responsible for:
 * - CRUD over invoices / line items / payments
 * - Auto-generating a draft invoice whenever a booking is created
 * - Marking an invoice paid + emailing the client the moment payment clears
 * - PDF generation (via InvoicePdfService)
 */
export class InvoiceService {
  /** Prefix (e.g. "INV-") is configurable in Admin > Settings; the zero-padded number always keeps incrementing via a DB sequence. */
  static async generateInvoiceNumber(): Promise<string> {
    const [{ data, error }, settings] = await Promise.all([
      supabaseServer.rpc("next_invoice_number"),
      SettingsService.getSettings(),
    ]);
    if (error || !data) {
      console.error("InvoiceService.generateInvoiceNumber error:", error);
      // Fallback: timestamp-based number so invoice creation never hard-fails.
      return `${settings.invoice_prefix}${Date.now()}`;
    }
    return `${settings.invoice_prefix}${data}`;
  }

  static async listInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabaseServer
      .from("invoices")
      .select("*, bookings(id, date, time, plans(name))")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("InvoiceService.listInvoices error:", error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }
    return (data || []) as Invoice[];
  }

  static async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabaseServer
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`InvoiceService.getInvoiceById (${id}) error:`, error);
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }
    if (!data) return null;

    const invoice = data as unknown as Invoice;
    invoice.line_items = (invoice.line_items || []).sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    );
    return invoice;
  }

  static async getInvoiceByBookingId(bookingId: string): Promise<Invoice | null> {
    const { data, error } = await supabaseServer
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (error) {
      console.error(`InvoiceService.getInvoiceByBookingId (${bookingId}) error:`, error);
      return null;
    }
    return (data as unknown as Invoice) || null;
  }

  static async getCatalogItems() {
    const { data, error } = await supabaseServer
      .from("invoice_catalog_items")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("InvoiceService.getCatalogItems error:", error);
      return [];
    }
    return data || [];
  }

  /** Every catalog item (active + inactive) — for the Settings > Item Catalog manager. */
  static async getAllCatalogItems() {
    const { data, error } = await supabaseServer
      .from("invoice_catalog_items")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("InvoiceService.getAllCatalogItems error:", error);
      throw new Error(`Failed to fetch catalog items: ${error.message}`);
    }
    return data || [];
  }

  static async createCatalogItem(input: { name: string; description?: string; default_rate: number }) {
    const { data, error } = await supabaseServer
      .from("invoice_catalog_items")
      .insert([{ name: input.name, description: input.description || null, default_rate: input.default_rate }])
      .select("*")
      .single();

    if (error || !data) {
      console.error("InvoiceService.createCatalogItem error:", error);
      throw new Error(`Failed to create catalog item: ${error?.message}`);
    }
    return data;
  }

  static async updateCatalogItem(
    id: string,
    input: { name: string; description?: string; default_rate: number; is_active: boolean }
  ) {
    const { data, error } = await supabaseServer
      .from("invoice_catalog_items")
      .update({
        name: input.name,
        description: input.description || null,
        default_rate: input.default_rate,
        is_active: input.is_active,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      console.error(`InvoiceService.updateCatalogItem (${id}) error:`, error);
      throw new Error(`Failed to update catalog item: ${error?.message}`);
    }
    return data;
  }

  static async deleteCatalogItem(id: string): Promise<void> {
    const { error } = await supabaseServer.from("invoice_catalog_items").delete().eq("id", id);
    if (error) {
      console.error(`InvoiceService.deleteCatalogItem (${id}) error:`, error);
      throw new Error(`Failed to delete catalog item: ${error.message}`);
    }
  }

  /**
   * Customers for the "Select or add a customer" autocomplete — sourced from
   * the real Customers list (manually added + auto-created from bookings),
   * falling back to past invoice bill-to contacts for anyone invoiced before
   * the Customers module existed.
   */
  static async getCustomerSuggestions(): Promise<{ name: string; email: string; phone: string | null }[]> {
    const seen = new Set<string>();
    const suggestions: { name: string; email: string; phone: string | null }[] = [];

    const [
      { data: customers, error: customersError },
      { data: invoices, error: invoicesError },
    ] = await Promise.all([
      supabaseServer
        .from("customers")
        .select("display_name, email, work_phone, mobile")
        .order("display_name", { ascending: true })
        .limit(500),
      supabaseServer
        .from("invoices")
        .select("bill_to_name, bill_to_email, bill_to_phone")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (customersError) {
      console.error("InvoiceService.getCustomerSuggestions customers error:", customersError);
    }

    for (const row of customers || []) {
      if (!row.email) continue;
      const key = row.email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({ name: row.display_name, email: row.email, phone: row.work_phone || row.mobile });
    }

    if (invoicesError) {
      console.error("InvoiceService.getCustomerSuggestions invoices error:", invoicesError);
      return suggestions;
    }

    for (const row of invoices || []) {
      const key = row.bill_to_email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({ name: row.bill_to_name, email: row.bill_to_email, phone: row.bill_to_phone });
    }
    return suggestions;
  }

  /**
   * Creates a brand-new invoice from admin-entered fields (the "New Invoice"
   * screen). Line items are inserted, and the invoice totals are computed and
   * stored alongside.
   */
  static async createInvoice(input: InvoiceInput): Promise<Invoice> {
    const [invoiceNumber, settings] = await Promise.all([
      this.generateInvoiceNumber(),
      SettingsService.getSettings(),
    ]);
    const { subtotal, discountTotal, taxTotal, total } = computeTotals(input.line_items);
    const amountPaid = input.status === "paid" ? total : 0;

    const { data: invoice, error } = await supabaseServer
      .from("invoices")
      .insert([
        {
          invoice_number: invoiceNumber,
          bill_to_name: input.bill_to_name,
          bill_to_email: input.bill_to_email,
          bill_to_phone: input.bill_to_phone || null,
          bill_to_address: input.bill_to_address || null,
          booking_id: input.booking_id || null,
          status: input.status,
          invoice_date: input.invoice_date,
          due_date: input.due_date,
          terms: input.terms || settings.invoice_default_terms,
          notes: input.notes ?? settings.invoice_notes,
          subtotal,
          discount_total: discountTotal,
          tax_total: taxTotal,
          total,
          amount_paid: amountPaid,
          balance_due: round2(total - amountPaid),
          paid_at: input.status === "paid" ? new Date().toISOString() : null,
        },
      ])
      .select("*")
      .single();

    if (error || !invoice) {
      console.error("InvoiceService.createInvoice error:", error);
      throw new Error(`Failed to create invoice: ${error?.message}`);
    }

    await this.replaceLineItems(invoice.id, input.line_items);

    return (await this.getInvoiceById(invoice.id)) as Invoice;
  }

  /** Updates invoice fields + fully replaces its line items, recomputing totals. */
  static async updateInvoice(id: string, input: InvoiceInput): Promise<Invoice> {
    const { subtotal, discountTotal, taxTotal, total } = computeTotals(input.line_items);

    const existing = await this.getInvoiceById(id);
    if (!existing) throw new Error("Invoice not found");

    // Preserve amount already paid via recorded payments; only auto-fill
    // amount_paid when marking paid directly with no payments on file yet.
    const amountPaid =
      input.status === "paid" && existing.amount_paid === 0 ? total : existing.amount_paid;

    const { error } = await supabaseServer
      .from("invoices")
      .update({
        bill_to_name: input.bill_to_name,
        bill_to_email: input.bill_to_email,
        bill_to_phone: input.bill_to_phone || null,
        bill_to_address: input.bill_to_address || null,
        status: input.status,
        invoice_date: input.invoice_date,
        due_date: input.due_date,
        terms: input.terms || "Due on Receipt",
        notes: input.notes ?? undefined,
        subtotal,
        discount_total: discountTotal,
        tax_total: taxTotal,
        total,
        amount_paid: amountPaid,
        balance_due: round2(total - amountPaid),
        paid_at: input.status === "paid" && !existing.paid_at ? new Date().toISOString() : existing.paid_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(`InvoiceService.updateInvoice (${id}) error:`, error);
      throw new Error(`Failed to update invoice: ${error.message}`);
    }

    await this.replaceLineItems(id, input.line_items);

    return (await this.getInvoiceById(id)) as Invoice;
  }

  private static async replaceLineItems(invoiceId: string, items: InvoiceLineItemInput[]) {
    await supabaseServer.from("invoice_line_items").delete().eq("invoice_id", invoiceId);

    if (items.length === 0) return;

    const rows = items.map((item, idx) => {
      const { amount } = computeLine(item);
      return {
        invoice_id: invoiceId,
        item_name: item.item_name,
        description: item.description || null,
        quantity: item.quantity,
        rate: item.rate,
        discount_percent: item.discount_percent || 0,
        tax_percent: item.tax_percent || 0,
        amount,
        sort_order: idx,
      };
    });

    const { error } = await supabaseServer.from("invoice_line_items").insert(rows);
    if (error) {
      console.error(`InvoiceService.replaceLineItems (${invoiceId}) error:`, error);
      throw new Error(`Failed to save invoice line items: ${error.message}`);
    }
  }

  static async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const updateFields: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === "sent") updateFields.sent_at = new Date().toISOString();
    if (status === "paid") updateFields.paid_at = new Date().toISOString();

    const { error } = await supabaseServer.from("invoices").update(updateFields).eq("id", id);
    if (error) {
      console.error(`InvoiceService.updateStatus (${id}) error:`, error);
      throw new Error(`Failed to update invoice status: ${error.message}`);
    }
    return (await this.getInvoiceById(id)) as Invoice;
  }

  static async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabaseServer.from("invoices").delete().eq("id", id);
    if (error) {
      console.error(`InvoiceService.deleteInvoice (${id}) error:`, error);
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }
  }

  /** Records a manual payment (cash/bank transfer/etc.), updating balance + status. */
  static async recordPayment(
    invoiceId: string,
    payment: { amount: number; payment_date: string; mode: string; reference_number?: string; notes?: string }
  ): Promise<Invoice> {
    const { error: insertError } = await supabaseServer.from("invoice_payments").insert([
      {
        invoice_id: invoiceId,
        amount: payment.amount,
        payment_date: payment.payment_date,
        mode: payment.mode,
        reference_number: payment.reference_number || null,
        notes: payment.notes || null,
      },
    ]);

    if (insertError) {
      console.error(`InvoiceService.recordPayment (${invoiceId}) error:`, insertError);
      throw new Error(`Failed to record payment: ${insertError.message}`);
    }

    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error("Invoice not found after recording payment");

    const totalPaid = round2((invoice.payments || []).reduce((sum, p) => sum + Number(p.amount), 0));
    const balanceDue = round2(invoice.total - totalPaid);
    const newStatus: InvoiceStatus = balanceDue <= 0 ? "paid" : invoice.status;

    const { error: updateError } = await supabaseServer
      .from("invoices")
      .update({
        amount_paid: totalPaid,
        balance_due: Math.max(balanceDue, 0),
        status: newStatus,
        paid_at: newStatus === "paid" ? new Date().toISOString() : invoice.paid_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error(`InvoiceService.recordPayment update (${invoiceId}) error:`, updateError);
      throw new Error(`Failed to update invoice balance: ${updateError.message}`);
    }

    return (await this.getInvoiceById(invoiceId)) as Invoice;
  }

  static async generatePdf(id: string): Promise<Buffer> {
    const [invoice, settings] = await Promise.all([this.getInvoiceById(id), SettingsService.getSettings()]);
    if (!invoice) throw new Error("Invoice not found");
    return InvoicePdfService.generate(invoice, settings);
  }

  /** Emails the invoice PDF to the client via Resend, then marks it as "sent". */
  static async sendInvoiceEmail(id: string): Promise<boolean> {
    const [invoice, settings] = await Promise.all([this.getInvoiceById(id), SettingsService.getSettings()]);
    if (!invoice) throw new Error("Invoice not found");

    const pdfBuffer = await InvoicePdfService.generate(invoice, settings);
    const sent = await EmailService.sendInvoiceEmail(
      invoice.bill_to_email,
      invoice.bill_to_name,
      invoice,
      pdfBuffer
    );

    if (sent && invoice.status === "draft") {
      await this.updateStatus(id, "sent");
    }

    return sent;
  }

  // ---------------------------------------------------------------------
  // Booking integration
  // ---------------------------------------------------------------------

  /**
   * Creates a draft invoice for a newly created booking, with a single line
   * item for the booking's consultation plan. No-ops (returns the existing
   * invoice) if one already exists for this booking — keeps every booking
   * creation path (Stripe webhook, free/bypass checkout, admin manual create)
   * safe to call idempotently.
   */
  static async createDraftInvoiceForBooking(booking: Booking): Promise<Invoice | null> {
    try {
      const existing = await this.getInvoiceByBookingId(booking.id);
      if (existing) return existing;

      const [{ data: plan }, settings] = await Promise.all([
        supabaseServer.from("plans").select("name, price_aud").eq("id", booking.plan_id).maybeSingle(),
        SettingsService.getSettings(),
      ]);

      const planName = plan?.name || booking.plans?.name || "Consultation";
      // price_aud is stored in cents (Stripe convention elsewhere in this app).
      const rate = plan?.price_aud ? round2(plan.price_aud / 100) : 0;

      const dueDate = new Date(`${booking.date}T00:00:00`);
      dueDate.setDate(dueDate.getDate() + (settings.invoice_due_days || 0));

      return await this.createInvoice({
        bill_to_name: booking.name,
        bill_to_email: booking.email,
        bill_to_phone: booking.phone,
        booking_id: booking.id,
        status: "draft",
        invoice_date: booking.date,
        due_date: dueDate.toISOString().split("T")[0],
        terms: settings.invoice_default_terms,
        line_items: [
          {
            item_name: planName,
            description: `Consultation booked for ${booking.date} at ${booking.time}`,
            quantity: 1,
            rate,
            discount_percent: 0,
            tax_percent: 0,
          },
        ],
      });
    } catch (e) {
      console.error("InvoiceService.createDraftInvoiceForBooking error:", e);
      return null;
    }
  }

  /**
   * Marks the invoice linked to a booking as fully paid and emails the client
   * the paid invoice PDF. Idempotent — safe to call from multiple booking
   * confirmation paths (Stripe webhook + backup success-page check) since it
   * skips invoices that are already marked paid.
   */
  static async markInvoicePaidAndSend(
    bookingId: string,
    opts: { mode: string; referenceNumber?: string; amount?: number }
  ): Promise<void> {
    try {
      const invoice = await this.getInvoiceByBookingId(bookingId);
      if (!invoice) return;
      if (invoice.status === "paid") return; // already processed — avoid duplicate emails

      const amount = opts.amount ?? invoice.total;

      await supabaseServer.from("invoice_payments").insert([
        {
          invoice_id: invoice.id,
          amount,
          payment_date: new Date().toISOString().split("T")[0],
          mode: opts.mode,
          reference_number: opts.referenceNumber || null,
        },
      ]);

      await supabaseServer
        .from("invoices")
        .update({
          status: "paid",
          amount_paid: amount,
          balance_due: Math.max(round2(invoice.total - amount), 0),
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

      // Invoice status is already "paid" as of the update above, so
      // sendInvoiceEmail's own "draft" -> "sent" bump is a no-op here.
      await this.sendInvoiceEmail(invoice.id);
    } catch (e) {
      console.error(`InvoiceService.markInvoicePaidAndSend (${bookingId}) error:`, e);
    }
  }

  /**
   * Marks a booking's invoice as paid without sending an email — used when an
   * admin manually records a booking as already confirmed/paid in person.
   */
  static async markInvoicePaidManual(bookingId: string): Promise<void> {
    try {
      const invoice = await this.getInvoiceByBookingId(bookingId);
      if (!invoice || invoice.status === "paid") return;
      await this.recordPayment(invoice.id, {
        amount: invoice.total,
        payment_date: new Date().toISOString().split("T")[0],
        mode: "Manual (Admin)",
      });
    } catch (e) {
      console.error(`InvoiceService.markInvoicePaidManual (${bookingId}) error:`, e);
    }
  }

  static async cancelInvoiceForBooking(bookingId: string): Promise<void> {
    try {
      const invoice = await this.getInvoiceByBookingId(bookingId);
      if (!invoice || invoice.status === "paid") return;
      await this.updateStatus(invoice.id, "cancelled");
    } catch (e) {
      console.error(`InvoiceService.cancelInvoiceForBooking (${bookingId}) error:`, e);
    }
  }
}
