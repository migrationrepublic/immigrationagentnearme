# Prompt: Build a Zoho-style Invoicing Module in this Admin Panel

> Copy everything below the line into Claude Code (or any AI coding agent) opened in the **other** website's project.
> Before pasting, fill in the `[[...]]` placeholders. If you also copied the reference files (see "Reference files" section), keep that section; otherwise delete it.

---

I want you to add a complete **Zoho-Invoice-style invoicing module** to this project's admin panel. It must work exactly like the spec below. First, explore this codebase to learn its stack (framework, DB, auth, admin layout, styling, email provider) and **adapt the spec to it** — reuse the existing admin layout, sidebar, auth/admin check, UI components, CSS classes/tokens, DB client and email service instead of inventing new ones. Match the surrounding code style.

## Business details (use these for defaults)
- Business name: [[BUSINESS NAME]]
- Tagline / registration line: [[e.g. "Registered Migration Agent | MARN: 1234567" or ABN]]
- Address: [[ADDRESS]]
- Email / phone / website: [[EMAIL]] / [[PHONE]] / [[WEBSITE]]
- Currency: [[AUD]] (format money as `$1,234.56`)
- Invoice number prefix: [[INV-]] → numbers look like `INV-000001`
- Default terms: `Due on Receipt`; default due days: `0`
- Default customer notes (bank details): [[Bank Details: Name: ... | BSB: ... | ACC No.: ...]]
- Brand colours for the PDF: primary [[#012269 navy]], accent [[#e40229 red]]

## 1. Database (write a migration / SQL file; tell me if I must run it manually)

**Enum** `invoice_status`: `draft | sent | paid | overdue | cancelled`.

**Invoice numbering:** a DB sequence + function `next_invoice_number()` returning the zero-padded number (`LPAD(nextval(...)::text, 6, '0')`). The prefix is added in app code from settings. If the RPC fails, fall back to `prefix + Date.now()` so invoice creation never hard-fails.

**Table `invoice_catalog_items`** (reusable items list): `id uuid pk`, `name text not null`, `description text`, `default_rate numeric(12,2) default 0`, `is_active bool default true`, `created_at`. Seed with: [[list your common services + prices, e.g. "Consultation Fee – 100.00", "Professional Service Fee – 600.00"]].

**Table `invoices`:**
- `id uuid pk`, `invoice_number text unique not null`
- Bill-to (denormalized on the invoice): `bill_to_name not null`, `bill_to_email not null`, `bill_to_phone`, `bill_to_address`
- `booking_id uuid` → FK to bookings/orders table, `ON DELETE SET NULL` (optional link; skip if this site has no bookings/orders)
- `status invoice_status default 'draft'`
- `invoice_date date default current_date`, `due_date date default current_date`, `terms text default 'Due on Receipt'`
- Money, all `numeric(12,2) default 0`: `subtotal`, `discount_total`, `tax_total`, `total`, `amount_paid`, `balance_due`
- `notes text` (default = bank details), `stripe_session_id text` (if payments exist)
- `sent_at`, `paid_at`, `created_at`, `updated_at` timestamptz
- Indexes on `booking_id`, `status`, `bill_to_email`

**Table `invoice_line_items`:** `id`, `invoice_id` FK `ON DELETE CASCADE`, `item_name not null`, `description`, `quantity numeric(12,2) default 1`, `rate numeric(12,2)`, `discount_percent numeric(5,2) default 0`, `tax_percent numeric(5,2) default 0`, `amount numeric(12,2)`, `sort_order int`. Index on `invoice_id`.

**Table `invoice_payments`:** `id`, `invoice_id` FK cascade, `amount numeric(12,2) not null`, `payment_date date default current_date`, `mode text default 'Cash'`, `reference_number`, `notes`, `created_at`. Index on `invoice_id`.

**Security:** only admins can read/write these tables (RLS policies against the admins table if Supabase; otherwise server-side admin checks). Server code uses the service/admin DB client.

**Settings (singleton row, id = 1)** — if the project has no settings table, create `app_settings` with: business_name, tagline, registration_number, office_address, contact_phone, contact_email, website_url, logo_url, invoice_prefix, invoice_default_terms, invoice_due_days, invoice_notes. Add a `getSettings()` service with a hardcoded FALLBACK object so nothing crashes if the migration hasn't been run yet.

## 2. Totals math (must be exact — one shared function used everywhere)
```
round2(n) = Math.round((n + Number.EPSILON) * 100) / 100
per line:  gross = qty * rate
           discount = gross * discount_percent/100
           amount   = round2(gross - discount)          // stored on the line
           tax      = round2(amount * tax_percent/100)
invoice:   subtotal = Σ amount ; discount_total = Σ discount ; tax_total = Σ tax
           total = round2(subtotal + tax_total)
           balance_due = round2(total - amount_paid)
```
Always recompute totals on the server on save — never trust totals from the client.

## 3. Server service (`InvoiceService` or this project's equivalent)
- `generateInvoiceNumber()`
- `listInvoices()` — newest first (join booking info if relevant)
- `getInvoiceById(id)` — with line_items (sorted by sort_order) + payments
- `getInvoiceByBookingId(bookingId)`
- Catalog: `getCatalogItems()` (active only), `getAllCatalogItems()`, `createCatalogItem`, `updateCatalogItem`, `deleteCatalogItem`
- `getCustomerSuggestions()` — distinct-by-email list of `{name, email, phone}` from the customers table (if one exists) then past invoices' bill-to contacts (limit ~500/200)
- `createInvoice(input)` — generate number, compute totals, default terms/notes from settings; if status = `paid`, set `amount_paid = total` and `paid_at = now`; insert, then insert line items
- `updateInvoice(id, input)` — recompute totals, **fully replace** line items (delete + insert with sort_order = index). Preserve existing `amount_paid` from recorded payments; only auto-fill `amount_paid = total` when marking paid with nothing paid yet. Keep the original `paid_at`.
- `updateStatus(id, status)` — set `sent_at` when sent, `paid_at` when paid
- `deleteInvoice(id)`
- `recordPayment(invoiceId, {amount, payment_date, mode, reference_number?, notes?})` — insert payment, then `amount_paid = Σ payments`, `balance_due = max(total - paid, 0)`, status → `paid` if balance ≤ 0
- `generatePdf(id)` → Buffer
- `sendInvoiceEmail(id)` — email the client with the PDF attached; if it was `draft`, mark it `sent`

All server actions / API endpoints must check that the user is an admin first, and validate input (zod or this project's validator).

## 4. PDF (A4, real vector PDF — use `pdf-lib`, not HTML screenshots)
Layout top → bottom:
1. **Header left:** business name (bold 20pt, primary colour), under it the tagline + registration line, the address, then email | phone (8.5pt grey). **Header right:** big "INVOICE" (26pt) on the same baseline as the business name, invoice number under it, and a coloured **status badge** (PAID green, DRAFT grey, SENT blue, OVERDUE red, CANCELLED grey).
2. **Two columns:** left "BILL TO" → name (bold), email, phone, address. Right: label/value rows — Invoice Date, Due Date, Terms, and **Balance Due** (emphasised).
3. **Item table:** a header row with a primary-colour background and white labels: `# | Item & Description | Qty | Rate | Discount | Tax | Amount` (item column ~36%). Each row shows the item name in bold plus the description below in small grey text; numbers right-aligned; light-grey zebra rows and borders. **Add a new page when space runs out, and repeat the table header on it.**
4. **Totals block (right-aligned):** Sub Total, Discount (if > 0), Tax (if > 0), **Total** (bold, with a rule above that doesn't cut through the text), Payment Made, **Balance Due**.
5. **NOTES:** multi-line notes / bank details.
6. **Footer:** centred "Thank you for your business | website" text.

Dates are formatted like `20 Oct 2026`. The filename is `<invoice_number>.pdf`.

**PDF route:** `GET /api/invoices/[id]/pdf` — admins only (401/403 otherwise), `?download=1` → `attachment`, otherwise `inline`; `Cache-Control: no-store`.

## 5. Email
A branded email ("Invoice INV-000001 from [[BUSINESS]]") showing the amount, due date and status, with the PDF attached. Use the project's existing email provider (Resend etc.) and the existing email layout/shell if one exists.

## 6. Admin UI

### Sidebar
Add an "Invoices" item (under a Finance group if there are groups) → `/admin/invoices`.

### List page `/admin/invoices`
- Title "Invoices" and a **+ New Invoice** button.
- **5 summary cards** (ignore cancelled invoices): **Outstanding** (Σ balance_due), **Due Today**, **Due in 30 Days**, **Overdue** (red; due_date < today and balance > 0), **Avg. Days to Get Paid** (mean of paid_at − invoice_date for paid invoices).
- Search box ("Search customer or invoice #...") matching name, email and invoice number.
- Status filter: All / Draft / Sent / Paid / Overdue / Cancelled.
- Table columns: Date, Invoice #, Customer (name + email), Status (coloured pill), Due Date, Amount, Balance Due. Click a row to open it.
- Empty state "No Invoices Found", plus loading and error states.

### Detail / editor page `/admin/invoices/[id]` (`id === "new"` = create mode)
**View mode** = an on-screen replica of the PDF ("Tax Invoice" heading, Balance Due, Bill To, item table, totals incl. Payment Made, Notes), with a toolbar:
`Edit` · `Send Email` · `Download PDF` (link to the PDF route with `?download=1`) · `Record Payment` (hidden when paid) · `Delete` (with confirm). It also lists the payments received.

**Edit / create mode** form:
- **Customer Name \*** — autocomplete "Select or type a customer name..." from `getCustomerSuggestions()`; picking one fills in email + phone.
- **Email \***, Phone, Status (select), Billing Address (textarea)
- **Invoice Date \***, **Due Date \***, Terms. Show Amount Paid / Balance Due read-only when editing.
- **Item Table:** each row has an item name with a catalog dropdown ("Type or select an item..." — picking one fills in name, description and default_rate), a "Description (optional)" field, then Qty, Rate, Discount %, Tax %, a live-calculated Amount and a remove (×) button. Below the table: "+ Add New Row".
- **Customer Notes** textarea (pre-filled with the default notes from settings).
- A live totals box: Subtotal, Discount, Tax, **Total** (same math as the server).
- Buttons: **Save as Draft**, **Save and Send** (save, then email, then refresh), Cancel.
- Validation: name and email are required; at least one line item with a name.

**Record Payment modal:** Amount \* (pre-filled with balance_due), Payment Date, Mode (Cash / Bank Transfer / Card / Stripe / Other), Reference Number, Notes → `recordPayment`.

### Settings page (if not present) `/admin/settings`
Tabs: **Business & Branding** (the business fields above), **Invoice Defaults** (prefix, default terms, due days, notes), **Item Catalog** (add / edit / deactivate / delete catalog items). The PDF, emails and invoice defaults must all read from these settings — no hardcoded business info.

## 7. Booking / order integration (only if this site has bookings, orders or payments)
- When a booking/order is created → `createDraftInvoiceForBooking(booking)`: **idempotent** (return the existing invoice if there already is one for this booking); one line item = the plan/product name, rate = its price (convert cents → dollars if prices are stored in cents), description "Booked for {date} at {time}", invoice_date = the booking date, due_date = + settings.invoice_due_days. Wrap it in try/catch so a failure never breaks the booking.
- When payment really completes (Stripe webhook / success page / free checkout) → `markInvoicePaidAndSend(bookingId, {mode, referenceNumber, amount})`: **skip if already paid** (so no duplicate emails), insert a payment row, mark it paid, then email the PDF.
- When an admin manually confirms a booking → `markInvoicePaidManual` (records the payment with mode "Manual (Admin)", **no email**). When an admin cancels a booking → `cancelInvoiceForBooking` (only if not paid).

## 8. Done criteria
- Run the type-check/lint and fix every error.
- Create a test invoice with 2 items (one with 10% discount, one with 10% tax) and check that the totals on screen, in the DB and in the PDF all match.
- Open the PDF, check the layout, and check that a long invoice (25+ items) flows onto page 2 with the header repeated.
- Tell me exactly which SQL/migration I need to run and which env vars (email API key etc.) are needed.

## Reference files (optional — delete this section if you didn't copy them)
I've copied the original working implementation into `./_invoice_reference/` (from a Next.js + Supabase + pdf-lib + Resend project). Treat it as the **source of truth for behaviour and layout**, but adapt imports, auth, DB client and styling to this project. Delete the folder when done.
