# Prompt: Build a Zoho-Sign-style E-Signature Module in this Admin Panel

> Copy everything below the line into Claude Code (or any AI coding agent) opened in the **other** website's project.
> Before pasting, fill in the `[[...]]` placeholders. If you also copied the reference files (see the last section), keep that section; otherwise delete it.

---

I want you to add a complete **Zoho-Sign / DocuSign-style e-signature module** to this project's admin panel. It must work exactly like the spec below. First, explore this codebase to learn its stack (framework, DB, auth, file storage, admin layout, styling, email provider) and **adapt the spec to it**: reuse the existing admin layout, sidebar, admin-auth check, UI components, CSS tokens, DB client, storage client and email service. Match the surrounding code style.

## Business details
- Business name (used in emails and the audit stamp): [[BUSINESS NAME]]
- Admin email that receives a copy of every signed document: [[ADMIN EMAIL]]
- Public site URL used to build signing links: [[https://example.com]] (read it from an env var such as `NEXT_PUBLIC_SITE_URL`)
- Date format shown to signers: [[DD/MM/YYYY]]
- Brand colours: primary [[#012269]], accent/button [[#e40229]]

## 1. Database (write a migration / SQL file; tell me if I must run it manually)

**`documents`** (create it if this project has none): `id uuid pk`, `client_id` (nullable FK to users), `template_id` (nullable), `name text not null`, `file_path text not null`, `file_size int`, `mime_type text`, `status text default 'pending_review'` (`pending_review | approved | rejected`), `created_at`, `updated_at`.

**`document_templates`** (optional; enables the "From Template" source): `id`, `name`, `description`, `file_path`, `is_active bool default true`, timestamps.

**`signature_requests`**: one row **per signer**
- `id uuid pk`, `document_id` FK → documents `ON DELETE CASCADE`
- `signer_name text not null`, `signer_email text not null`
- `token text unique not null`: `randomBytes(32).toString('hex')`, indexed (this is the public link key)
- `status text default 'draft'`: `draft | sent | signed | declined | expired`
- `fields jsonb not null default '[]'`: the placed fields for this signer (shape below)
- `signing_order int not null default 1`, `signing_message text` (private note for this signer)
- `signature_url text` (storage path of the signature PNG), `ip_address`, `user_agent`, `signed_at`, `expires_at`
- `created_at`, `updated_at` (with an updated_at trigger)

**`audit_logs`**: `id`, `user_id` (nullable), `action text`, `entity_type text`, `entity_id uuid`, `details jsonb`, `created_at`. Log `signature_requested`, `signature_signed` (with IP + user agent) and `signature_declined`.

**Storage buckets (all PRIVATE):** `documents` (originals), `templates`, `signatures` (signature PNGs), `signed` (final signed PDFs). Files are only ever served through short-lived signed URLs generated on the server.

**Field JSON shape** (all coordinates are **percentages of the page**, top-left origin, so they are independent of zoom and screen size):
```ts
{ id: string; type: 'signature'|'initial'|'sign_date'|'full_name'|'first_name'|'last_name'|'email'|'checkbox'|'text';
  page: number /* 1-based */; x: number; y: number; w: number; h: number;
  value?: string | boolean | null; label?: string /* admin caption shown to signer, e.g. "Business Address" */ }
```

## 2. Security rules (non-negotiable)
- **Every admin action/endpoint checks that the user is an admin on the server**, including create request, send/activate, remind, list requests, the field editor's save, file upload, signed-URL generation and delete.
- The public signing page is gated **only by the token**. Validate it (hex, length 64) before querying.
- The public "get request" response returns only what the signer needs: signer name/email, document name, status, expiry, this signer's fields and a **short-lived signed URL (≤1h) for this request's PDF only**, generated on the server. **Never** expose a generic "give me a signed URL for any bucket/path" action to unauthenticated users.
- **Sign and decline take the token, not the request id.** The server re-checks before signing: the request exists, `status === 'sent'` (not draft, signed, declined or expired) and it is not past `expires_at`. Otherwise reject.
- Re-validate the submitted fields on the server: only accept the `value`s for field ids that already exist on that request (ignore any client-sent coordinates/types), and require every required field to be filled.
- Limit the signature image size (e.g. ≤ 2MB, PNG data URL only) and the PDF uploads (PDF only, ≤ 20MB each).
- Capture the IP from `x-forwarded-for` (first entry) / `x-real-ip`, plus the user agent, for the audit trail.

## 3. Server service (`SignatureService` or this project's equivalent)
- `createSignatureRequest({document_id, signer_name, signer_email, expires_at, signing_order, signing_message, status='draft'})` generates the token, inserts the row and audit-logs it. It only emails the signer if the status is `sent`.
- `getRequestByToken(token)` returns the request + document (name, file_path, bucket) + `isExpired`.
- `activateRequests(documentId, [{id, fields}])` is called by the field editor's **Send** button. It saves each signer's `fields`, then sets **only the lowest `signing_order` group** to `sent` and emails them the invitation. Later groups stay `draft`.
- `signDocument(token, signaturePngBase64, {ip, userAgent}, fieldValues)`:
  1. Run the security checks above, then upload the PNG to `signatures/<requestId>_sig.png`.
  2. Download the current PDF. If another signer already signed, use the latest signed version so that **all signatures accumulate on one PDF**.
  3. With **pdf-lib**, draw each field on its page. Convert % → PDF points: `pdfX = x/100*W`, `pdfW = w/100*W`, `pdfH = h/100*H`, `pdfY = (100 - y - h)/100*H` (PDF origin is bottom-left).
     - `signature` / `initial`: draw the PNG image in the box.
     - `sign_date`: the value, or today's date in [[DD/MM/YYYY]].
     - `full_name`, `first_name`, `last_name` and `email`: the value, or a default derived from the signer's name/email (first name = first word, last name = the rest).
     - `checkbox`: a small bordered square, with an "X" if checked.
     - `text`: the value.
     - Text is Helvetica, size `max(8, pdfH*0.5)`, vertically centred, dark navy.
  4. **If the request has no placed fields**, fall back to a stamped "DIGITALLY SIGNED" audit block on the last page. This is a light box containing the signature image on the left and on the right: Signed by, Email, Signed At (UTC), IP Address, Document ID, Request ID and "Verified by [[BUSINESS NAME]] Digital Signature System".
  5. Save to `signed/<client_id or 'admin'>/<documentId>_signed.pdf`, then update the document's `file_path`, `file_size` and `status = 'approved'`.
  6. Update the request: `status = 'signed'`, `signature_url`, `signed_at`, `ip_address`, `user_agent`, `fields` (with their values).
  7. Create a 7-day signed download URL, then send the emails (don't block on them): **to the signer** "Your document is signed" + download link, and **to the admin** "Signed copy from <signer>" + link.
  8. **Sequential signing**: if no `sent` requests are left in this `signing_order` group, move the next-lowest `draft` group to `sent` and email them.
  9. Audit-log it.
- `declineSignatureRequest(token)` sets the status to `declined` and audit-logs it.
- `sendReminder(requestId)` only works when the status is `sent`. It re-sends the invitation styled as a reminder.
- `mergePdfs(base64[])` uses pdf-lib to copy all pages into one PDF (used when the admin uploads several files).

## 4. Emails (use the project's email provider + its shared email layout)
- **Invitation / Reminder**: heading "Signature Requested" (or "Urgent Signature Reminder"), "Dear <name>", the document name, the optional custom message, a big **"Review and Sign Document"** button → `<SITE_URL>/sign/<token>`, and a small red note: "This link will expire in <N> days."
- **Completed (to signer)** and **Admin copy**: the document name + a "Download Signed Document" button.

## 5. Admin UI

### Sidebar
Add "Signature Requests" → `/admin/signature-requests` (and "Documents" / "Templates" if you create them).

### `/admin/signature-requests`: 3 views in one page
**A. Landing:** two big cards: **Send for Signatures** (others sign) and **Sign Yourself** (the admin is the only signer, pre-filled with their own name/email, with the name/email/role inputs locked).

**B. Setup form ("Create Sign Workflow" / "Self Sign Document Setup"):**
1. **Document source** tabs: `Upload PDF` (drag & drop zone, "Drag files here or click to browse", "Accepts multiple PDF files up to 20MB each", shows a file list with remove buttons; multiple files are merged into one PDF on the server) · `Client File` (pick an existing approved document) · `From Template` (pick an active template).
2. **Document Name (Sender-Facing)**: auto-filled from the file name, editable, required.
3. **Recipients** list: each row has Full Name, Email Address, **Action / Role** (`Needs to sign` / `Receives copy`) and an expandable "Private message to this recipient (Optional)". There are "+ Add Recipient" and "Add Me" buttons and a remove button per row. A **"Send in order"** toggle shows order numbers and ↑/↓ buttons to reorder (this sets `signing_order` 1, 2, 3…; with the toggle off, everyone gets order 1).
4. **Email Subject** and **Custom Message / Invitation Note**.
5. **Workflow parameters**: **Link Expiration Period** (e.g. 7 / 15 / 30 / 60 days → `expires_at`) and **Email Reminder Interval** (Do Not Remind / Every 3 / 5 (default) / 7 / 10 days; store it per request and have a cron/scheduled job send reminders, or tell me if this stack can't schedule).
6. Validation with toasts: a document is required, the name is required, there must be at least one recipient with a valid name + email (regex check).
7. **Continue** uploads the PDF to `documents`, creates the `documents` row and one `draft` signature request per signer, then redirects to `/admin/pdf-editor?documentId=<id>`.

**C. History:** "Signature Requests History" with tabs **Pending / Active** and **Completed (Executed)**, and search. The table columns are Signer Info (name + email), Document Details (name + created date), Order Status (status pill + "Order #n") and Actions:
`Edit Layout` (drafts → editor) · `Copy Link` (copies `<SITE_URL>/sign/<token>`) · `Remind` (when status is sent) · `View Signed` (opens a 2-minute signed URL of the signed PDF). There is an empty state "No Signature Requests Found".

### `/admin/pdf-editor?documentId=…`: visual field placement (the core of the tool)
- Render the PDF with **pdf.js** (`pdfjs-dist`, or the CDN build `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js` + worker). Render each page to a canvas, with page thumbnails / page navigation and **zoom in/out**.
- A **left palette** of draggable field types: Signature, Initial, Sign Date, First Name, Last Name, Email, Checkbox, Text. You **drag a field onto the page** (HTML5 drag & drop), and the drop position is converted to % of the page. Default sizes in %: signature 24×4, initial 8×3, sign_date 15×2, name fields 28×2, email 30×2, checkbox 3×2, text 20×2.
- A **signer selector** at the top: each signer gets a colour, and new fields are assigned to the active signer.
- Placed fields can be **moved by dragging**, **resized** with a corner handle and **deleted** (×). Clicking one selects it.
- A **right properties panel** for the selected field: Field ID, Field Type, **Assigned Signer** (dropdown), **Field Label (shown to signer)**, X / Y offset (numeric, %) and a "Required" toggle.
- The **Send** button validates that every signer has at least one signature/initial field, then calls `activateRequests` with each signer's fields (rounded to 2 decimals). It shows a success toast and returns to the history view. A **Save draft** button stores the fields without sending.

### `/sign/[token]`: public signing page (no login, mobile-friendly)
- **States**: loading · error ("Portal Error") · expired ("Signing Link Expired") · already signed ("Document Signed") · declined ("Workflow Declined") · ready · submitting ("Please do not close this window.") · success.
- **Header**: the document name, "Pending your signature", zoom in/out, Download/Print of the original, and **Decline**, which asks for confirmation in an in-page modal (not `window.confirm`).
- **Electronic Record and Signature Disclosure**: a consent box the signer must accept before they can submit. The document stays viewable before that.
- The PDF is rendered with pdf.js, with **this signer's fields overlaid** at their % positions as inputs:
  - **signature/initial**: a clickable box that says "Sign here".
  - **sign_date**: a date input, displayed and stored as DD/MM/YYYY. **name/email** fields are prefilled from the request but editable.
  - **checkbox**: optional. **text**: an input with the admin's `label` as its placeholder.
  - Filled fields turn green; unfilled ones are teal/highlighted.
- **Guided navigation**: a "Start" / **Next** / **Previous** bar that scrolls to the next unfilled required field, with a small callout next to it ("Sign here." / "Enter date." / …). Also show a progress counter ("3 of 5 fields completed").
- **Signature modal** with 3 tabs:
  - **TYPE**: "Signature Name" + "Initial" inputs, plus 5 script-font options (Google Fonts: Great Vibes, Caveat, Mrs Saint Delafield, Sacramento, Alex Brush) previewed live. The chosen one is rendered to a canvas → PNG.
  - **DRAW**: a Signature Pad + an Initial Pad (canvas; mouse **and touch**; a Clear button for each).
  - **UPLOAD**: a PNG/JPG/JPEG signature scan.
  - **Ink colour**: Black / Blue / Red. The note "Fills the signature in all places" means one confirm fills every signature (and initial) field.
- **Finish / Submit** is enabled only when all required fields are filled and the disclosure is accepted. It sends `{token, signaturePng, fieldValues}` to the server, then shows the success screen.

## 6. Done criteria
- Run the type-check/lint and fix every error.
- End-to-end test with 2 signers in order. Upload a 2-page PDF, place a signature + date + text for signer 1 and a signature for signer 2 on page 2, then send. Only signer 1 gets an email. Sign as signer 1; now signer 2 gets an email. Sign as signer 2. The final PDF contains **both** signatures in the correct positions (check it at a different zoom level too), and both completion emails and the admin copy are sent.
- Security tests (each must fail):
  - open the sign link after it's already signed or expired;
  - sign with a made-up token;
  - call any admin action while logged out;
  - request a signed URL for an arbitrary bucket/path from the public page.
- Tell me exactly which SQL/migrations, storage buckets and env vars (email API key, site URL) I need to set up.

## Reference files (optional — delete this section if you didn't copy them)
I've copied the original implementation into `./_signature_reference/` (Next.js + Supabase Storage + pdf-lib + pdf.js + Resend). Treat it as the **source of truth for the UI and behaviour**, but **do not copy its security model**: it is missing admin checks on several actions, exposes an unauthenticated signed-URL action and signs by request id instead of token. Follow Section 2 instead. Adapt the imports, auth, storage and styling to this project, and delete the folder when you're done.
