Admin panel audit report
I completed a read-only review of the admin pages, server actions, services, API routes, Supabase schema, and migrations. No files were changed; the worktree remains clean.
Critical — fix before production use
Several service-role actions have no authorization
The Supabase service-role client bypasses RLS, but these actions do not consistently verify an admin:
Document creation, review, PDF generation, field mapping, preview and merging: [document.ts (line 41)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/document.ts:41)
Signature creation, reminders, request listing and activation: [signature.ts (line 36)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/signature.ts:36)
File upload protects only the templates bucket. Uploads to documents, signed, signatures, or arbitrary buckets are unauthenticated: [storage.ts (line 19)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/storage.ts:19)
Signed URLs for private files require no admin session or signer token: [storage.ts (line 46)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/storage.ts:46)
Impact: unauthorized file overwrites, private-document access, document approval/rejection, signature-request creation, email abuse, and database changes.
Needed fix: one shared verified requireAdmin() helper, strict bucket/path allowlists, and separate token-authorized signer operations.
Admin authorization trusts unverified cookie session data
checkIsAdminAction() uses auth.getSession() and then trusts session.user.id: [admin.ts (line 33)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/admin.ts:33). The invoice PDF route repeats this pattern.
Supabase explicitly warns that cookie-based getSession() data may not be authentic and should not be used for authorization. Use getClaims() or getUser() instead. Supabase authentication guidance
Customers can pay for a slot that cannot be booked
Checkout validates date and time only as unrestricted strings and does not check or reserve availability before taking payment: [booking.ts (line 13)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/booking.ts:13).
The webhook checks availability only after payment, then performs separate check, booking insert, and availability update operations: [Stripe webhook (line 153)](/C:/Users/STAR/Desktop/immigarationnearme/app/api/stripe/webhook/route.ts:153).
Consequences:
Two users can pay for the same slot.
The second paid webhook can return 409 Slot already booked.
Concurrent webhooks can both pass the availability check and create duplicate bookings.
Past dates, unsupported times, and inactive plans can reach checkout.
Needed fix: atomically reserve the slot in the database before checkout, expire abandoned reservations, and finalize the reservation transactionally after payment.
Public signature submission is not bound to its token
The public signing action accepts only request_id, not the signing token: [signature.ts (line 106)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/signature.ts:106). The service fetches solely by request UUID and does not require status sent: [signature.service.ts (line 150)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/signature.service.ts:150).
It also accepts signature placements/fields directly from the browser and uses them as authoritative: [signature.service.ts (line 198)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/signature.service.ts:198).
Anyone who obtains a request UUID could sign or decline it without its token, re-sign terminal requests, or alter signature/field placement.
High-priority correctness issues
Booking status, availability, and invoices become inconsistent
Changing booking status updates the booking and invoice but never updates availability: [admin.ts (line 441)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/admin.ts:441).
Cancelling leaves the slot blocked.
Confirming a pending booking does not reserve the slot.
Admin booking creation does not first reject an occupied slot.
“Confirmed” automatically means “fully paid,” mixing appointment and payment state.
These transitions should be one database transaction.
Availability saving can reopen every booked slot after one failure
Daily availability first deletes every availability row, then reinserts them: [admin.ts (line 229)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/admin.ts:229).
If insertion fails after deletion, bookings still exist but getAvailableSlots() sees those times as available. This can produce double bookings. Use an atomic database function or update only the differences.
Invoice writes are non-transactional
Examples:
Invoice is inserted before its line items: [invoice.service.ts (line 251)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/invoice.service.ts:251)
Updating replaces line items through delete-then-insert, and the delete error is ignored: [invoice.service.ts (line 333)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/invoice.service.ts:333)
Payment insertion and invoice balance update are separate operations: [invoice.service.ts (line 381)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/invoice.service.ts:381)
Stripe payment insertion/update errors are ignored before emailing: [invoice.service.ts (line 514)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/invoice.service.ts:514)
Directly changing status to paid does not update amount_paid or balance_due.
A failure can leave an invoice with missing lines, stale totals, or a paid status with an outstanding balance. These operations need database transactions/RPC functions and invariant checks.
Approved documents can generate broken signing links
The signature service assumes every approved document is stored in the signed bucket: [signature.service.ts (line 120)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/signature.service.ts:120).
However, documents without a fillable template are marked approved while their file remains in documents: [documents page (line 114)](/C:/Users/STAR/Desktop/immigarationnearme/app/admin/documents/page.tsx:114). Generation failures also leave the document approved because approval happens first.
Store the bucket explicitly, or determine it from durable metadata rather than status.
PDF uploads will commonly exceed the Server Action limit
PDFs are converted to base64 and passed through Server Actions, sometimes twice for merge and upload: [signature requests (line 334)](/C:/Users/STAR/Desktop/immigarationnearme/app/admin/signature-requests/page.tsx:334).
The project has no body-size override in [next.config.ts (line 3)](/C:/Users/STAR/Desktop/immigarationnearme/next.config.ts:3). Next.js currently limits Server Action bodies to 1 MB by default; base64 adds roughly 33% overhead. Next.js documentation
Use authenticated direct-to-storage uploads or scoped signed upload URLs. Simply increasing the limit would retain the memory and abuse risk.
Database deployment is not reproducible
Invoices, customers, and settings schemas exist as root-level SQL files, but they are absent from supabase/migrations. A fresh migration-based deployment will not create those modules.
This can also cause duplicated invoice prefixes because the initial invoice function returns INV-..., while the settings schema later changes it to return only the numeric portion.
Move the standalone schemas into ordered migrations.
Performance issues worth fixing
All major lists load the entire table
Bookings, customers, invoices, website leads, tool leads, documents, and signature requests have no server pagination. They then search, filter, and render everything in the browser.
Examples: [admin.ts (line 74)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/admin.ts:74), [customer.service.ts (line 13)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/customer.service.ts:13), [invoice.service.ts (line 66)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/invoice.service.ts:66).
Add server-side pagination and search to these list pages. This is the most useful admin performance improvement.
Dashboard “aggregates” still download one row per record
The dashboard loads every lead status, every tool name, and every confirmed booking price, then counts them in JavaScript: [admin.ts (line 589)](/C:/Users/STAR/Desktop/immigarationnearme/app/actions/admin.ts:589).
This becomes slow and can undercount when the Supabase maximum-row setting is reached. Use SQL counts/grouping and a database revenue aggregate.
Medium issues
The booking form uses UTC for its default date, so Melbourne mornings can default to yesterday: [bookings page (line 87)](/C:/Users/STAR/Desktop/immigarationnearme/app/admin/bookings/page.tsx:87).
Document rejection displays “notice sent successfully,” but no rejection email is sent: [documents page (line 143)](/C:/Users/STAR/Desktop/immigarationnearme/app/admin/documents/page.tsx:143).
Document approval audit logs normally attribute the action to the client because the actual authenticated admin ID is not passed: [document.service.ts (line 133)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/document.service.ts:133).
Customer auto-creation checks then inserts without a unique email constraint, so concurrent bookings can create duplicates: [customer.service.ts (line 152)](/C:/Users/STAR/Desktop/immigarationnearme/lib/services/customer.service.ts:152).
The Excel export places user-submitted values directly into spreadsheet HTML, allowing spreadsheet-formula/HTML injection: [bookings page (line 267)](/C:/Users/STAR/Desktop/immigarationnearme/app/admin/bookings/page.tsx:267).
PDF.js is loaded dynamically from a third-party CDN without integrity verification or reliable failure handling: [pdf editor (line 182)](/C:/Users/STAR/Desktop/immigarationnearme/app/admin/pdf-editor/page.tsx:182).
Static-check results
TypeScript: passes.
ESLint: fails with 24 errors and 33 warnings across the repository. The admin-specific findings are currently only unused imports/types; most errors are elsewhere.
There is no automated test command for the critical payment, availability, invoice, or signature workflows.
Recommended order
Close service-role authorization gaps and replace getSession() authorization.
Make booking/payment/availability atomic.
Secure the signer action with token and server-authoritative fields.
Make invoice and document workflows transactional.
Fix PDF upload handling.
Add pagination and database-side dashboard aggregates.
Consolidate database migrations and add a few targeted integration tests.
I would not recommend a UI rewrite, global state library, broad component splitting, or speculative caching at this stage. Those changes would add work without addressing the real risks above.