import { InvoicePdfService } from "./invoicePdf.service.test.ts";
import { writeFileSync } from "node:fs";
const settings = { business_name: "Migration Republic", tagline: "Registered Migration Agents", marn_number: "2518961", office_address: "470 St Kilda Road, Melbourne, VIC 3004", contact_phone: "+61 435 321 219", contact_email: "info@migrationrepublic.com.au", website_url: "https://migrationrepublic.com.au" };
const invoice = {
  invoice_number: "INV-000007", bill_to_name: "Dalia Pop", bill_to_email: "dcdahlia44@gmail.com", bill_to_phone: "+353877065695", bill_to_address: null,
  status: "paid", invoice_date: "2026-10-02", due_date: "2026-10-02", terms: "Due on Receipt",
  subtotal: 115, discount_total: 10, tax_total: 10.5, total: 115.5, amount_paid: 115.5, balance_due: 0,
  notes: "Bank Details:\nName: Migration Republic | BSB: 063-620 | ACC No.: 1123-5022",
  line_items: [{ item_name: "Phone Consultation", description: "Consultation booked for 2026-10-02 at 09:00:00", quantity: 1, rate: 115, discount_percent: 10, tax_percent: 10, amount: 103.5 }],
};
writeFileSync("./check-invoice.pdf", await InvoicePdfService.generate(invoice, settings));
console.log("ok");
