import { supabaseServer } from "@/lib/supabase-server";
import { Customer, CustomerInput } from "@/lib/types";

/**
 * CustomerService
 *
 * Responsible for:
 * - CRUD over customers
 * - Auto-creating a customer record the first time someone books
 * - Computing each customer's outstanding receivables from their invoices
 */
export class CustomerService {
  static async listCustomers(): Promise<Customer[]> {
    // Receivables aren't a DB column — sum each customer's outstanding
    // invoice balance (matched by email) in JS. Run alongside the customers
    // fetch instead of after it, and only pull invoices that actually still
    // owe something (fully-paid/cancelled invoices don't affect the sum).
    const [{ data: customers, error }, { data: invoices }] = await Promise.all([
      supabaseServer.from("customers").select("*").order("display_name", { ascending: true }),
      supabaseServer.from("invoices").select("bill_to_email, balance_due").gt("balance_due", 0).neq("status", "cancelled"),
    ]);

    if (error) {
      console.error("CustomerService.listCustomers error:", error);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    const receivablesByEmail = new Map<string, number>();
    for (const inv of invoices || []) {
      if (!inv.bill_to_email) continue;
      const key = inv.bill_to_email.toLowerCase();
      receivablesByEmail.set(key, (receivablesByEmail.get(key) || 0) + Number(inv.balance_due));
    }

    return (customers || []).map(c => ({
      ...c,
      receivables: c.email ? receivablesByEmail.get(c.email.toLowerCase()) || 0 : 0,
      unused_credits: 0,
    }));
  }

  static async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await supabaseServer.from("customers").select("*").eq("id", id).maybeSingle();
    if (error) {
      console.error(`CustomerService.getCustomerById (${id}) error:`, error);
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
    if (!data) return null;

    const { data: invoices } = await supabaseServer
      .from("invoices")
      .select("balance_due, status")
      .eq("bill_to_email", data.email || "__none__")
      .neq("status", "cancelled");

    const receivables = (invoices || []).reduce((sum, i) => sum + Number(i.balance_due), 0);
    return { ...data, receivables, unused_credits: 0 };
  }

  static async findByEmail(email: string): Promise<Customer | null> {
    const { data, error } = await supabaseServer
      .from("customers")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      console.error(`CustomerService.findByEmail (${email}) error:`, error);
      return null;
    }
    return data;
  }

  static async createCustomer(input: CustomerInput): Promise<Customer> {
    const displayName = input.display_name.trim() || this.buildDisplayName(input);

    const { data, error } = await supabaseServer
      .from("customers")
      .insert([
        {
          customer_type: input.customer_type,
          salutation: input.salutation || null,
          first_name: input.first_name || null,
          last_name: input.last_name || null,
          company_name: input.company_name || null,
          display_name: displayName,
          email: input.email || null,
          work_phone: input.work_phone || null,
          mobile: input.mobile || null,
          language: input.language || "English",
          source: "manual",
        },
      ])
      .select("*")
      .single();

    if (error || !data) {
      console.error("CustomerService.createCustomer error:", error);
      throw new Error(`Failed to create customer: ${error?.message}`);
    }
    return data;
  }

  static async updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
    const displayName = input.display_name.trim() || this.buildDisplayName(input);

    const { data, error } = await supabaseServer
      .from("customers")
      .update({
        customer_type: input.customer_type,
        salutation: input.salutation || null,
        first_name: input.first_name || null,
        last_name: input.last_name || null,
        company_name: input.company_name || null,
        display_name: displayName,
        email: input.email || null,
        work_phone: input.work_phone || null,
        mobile: input.mobile || null,
        language: input.language || "English",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      console.error(`CustomerService.updateCustomer (${id}) error:`, error);
      throw new Error(`Failed to update customer: ${error?.message}`);
    }
    return data;
  }

  static async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabaseServer.from("customers").delete().eq("id", id);
    if (error) {
      console.error(`CustomerService.deleteCustomer (${id}) error:`, error);
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  private static buildDisplayName(input: Pick<CustomerInput, "customer_type" | "company_name" | "first_name" | "last_name">) {
    if (input.customer_type === "business" && input.company_name) return input.company_name;
    return [input.first_name, input.last_name].filter(Boolean).join(" ") || input.company_name || "Unnamed Customer";
  }

  /**
   * Auto-creates a customer the first time someone with this email books a
   * consultation. No-ops (returns the existing record) if a customer with
   * this email already exists, so it's safe to call from every booking
   * creation path without ever duplicating or overwriting admin edits.
   */
  static async getOrCreateFromBooking(params: {
    name: string;
    email: string;
    phone?: string;
    bookingId?: string;
  }): Promise<Customer | null> {
    try {
      if (!params.email) return null;

      const existing = await this.findByEmail(params.email);
      if (existing) return existing;

      const { data, error } = await supabaseServer
        .from("customers")
        .insert([
          {
            customer_type: "individual",
            display_name: params.name,
            email: params.email,
            mobile: params.phone || null,
            source: "booking",
            booking_id: params.bookingId || null,
          },
        ])
        .select("*")
        .single();

      if (error) {
        // A near-simultaneous booking may have just inserted the same email —
        // fall back to reading it rather than treating this as a hard failure.
        console.error("CustomerService.getOrCreateFromBooking insert error:", error);
        return this.findByEmail(params.email);
      }
      return data;
    } catch (e) {
      console.error("CustomerService.getOrCreateFromBooking error:", e);
      return null;
    }
  }
}
