/**
 * Service Test Runner
 * Run this script to test all core service functions:
 * npx tsx scripts/test_services.ts
 */

import fs from 'fs';
import path from 'path';

// 1. Setup Mock Environment Variables BEFORE importing any modules (to pass Zod validation)
// Load actual keys from .env.local securely if they exist (since .env.local is gitignored)
try {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envConfig = fs.readFileSync(envLocalPath, 'utf8');
    for (const line of envConfig.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const index = trimmed.indexOf('=');
        if (index > 0) {
          const key = trimmed.substring(0, index).trim();
          const value = trimmed.substring(index + 1).trim();
          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
} catch (err) {
  console.warn("Warning loading .env.local file:", err);
}

// Resilient fake mock keys fallback for Zod schema validation (no real secrets committed to repository)
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project-id.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-anon-key-payload.fake-sig";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-service-key-payload.fake-sig";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_secret_key_mock_value";
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder_webhook_secret_mock_value";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_placeholder_resend_api_key_mock_value";
process.env.EMAIL_FROM = process.env.EMAIL_FROM || "noreply@placeholder.com";
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@placeholder.com";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyPlaceholderGeminiApiKeyMockValue";
process.env.WORDPRESS_WEBHOOK_SECRET = process.env.WORDPRESS_WEBHOOK_SECRET || "placeholder_wordpress_webhook_secret_mock_value";

// Mock WordPress API requests
global.fetch = (() => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      {
        id: 101,
        date: "2026-07-09T00:00:00",
        slug: "australian-skilled-visas-guide",
        link: "https://example.com/blog/skilled-visas-guide",
        title: { rendered: "Guide to Australian Skilled Visas" },
        content: { rendered: "<p>Skilled visas information...</p>" },
        excerpt: { rendered: "<p>Read more...</p>" },
        featured_media: 0
      }
    ])
  });
}) as any;

// Mock pdf-lib methods BEFORE imports run
import { PDFDocument, PDFTextField } from "pdf-lib";

Object.defineProperty(PDFDocument, "load", {
  value: () => Promise.resolve({
    getForm: () => ({
      getFields: () => [
        Object.create(PDFTextField.prototype, {
          getName: { value: () => "Given Names" },
          constructor: { value: PDFTextField }
        }),
        Object.create(PDFTextField.prototype, {
          getName: { value: () => "Family Name" },
          constructor: { value: PDFTextField }
        })
      ],
      getField: (name: string) => {
        const field = Object.create(PDFTextField.prototype);
        Object.defineProperties(field, {
          setText: { value: () => {} },
          check: { value: () => {} },
          uncheck: { value: () => {} },
          select: { value: () => {} }
        });
        return field;
      }
    }),
    save: () => Promise.resolve(new Uint8Array([1, 2, 3]))
  })
});

// Mock Supabase Server Client queries before importing services
import { supabaseServer } from "../lib/supabase-server";

// Mock Supabase Server Client Database Queries
const mockData: Record<string, any> = {
  plans: [
    { id: "11111111-1111-1111-1111-111111111111", name: "Phone Consultation", slug: "phone-consultation", price_aud: 10000, duration_minutes: 30, is_active: true },
    { id: "22222222-2222-2222-2222-222222222222", name: "Video Consultation", slug: "online-video-consultation", price_aud: 15000, duration_minutes: 45, is_active: true }
  ],
  availability: [
    { date: "2026-07-10", time: "09:00:00", is_booked: true }
  ],
  bookings: {
    id: "33333333-3333-3333-3333-333333333333",
    name: "John Doe",
    email: "john@example.com",
    phone: "0400000000",
    plan_id: "11111111-1111-1111-1111-111111111111",
    date: "2026-07-10",
    time: "10:00:00",
    notes: "Test consultation",
    status: "confirmed",
    stripe_session_id: "cs_test_session"
  },
  document_templates: [
    { id: "44444444-4444-4444-4444-444444444444", name: "Passport Copy", description: "Identity proof", visa_subclass: "189", is_active: true, file_path: "templates/189_passport.pdf" }
  ],
  document_fields: [
    { id: "55555555-5555-5555-5555-555555555555", template_id: "44444444-4444-4444-4444-444444444444", field_name: "passport_no", field_label: "Passport Number", field_type: "text", pdf_field_name: "passport_number", is_required: true, sort_order: 1 }
  ],
  documents: {
    id: "66666666-6666-6666-6666-666666666666",
    client_id: "00000000-0000-0000-0000-000000000000",
    template_id: "44444444-4444-4444-4444-444444444444",
    name: "Passport.pdf",
    file_path: "uploads/passport.pdf",
    status: "pending_review",
    field_values: { passport_no: "N12345678" }
  },
  signature_requests: {
    id: "77777777-7777-7777-7777-777777777777",
    document_id: "66666666-6666-6666-6666-666666666666",
    signer_email: "john@example.com",
    signer_name: "John Doe",
    token: "mock-token-abc-123",
    ip_address: "127.0.0.1",
    user_agent: "Mozilla/5.0",
    status: "sent"
  },
  website_leads: {
    id: "88888888-8888-8888-8888-888888888888",
    first_name: "Alice",
    last_name: "Smith",
    email: "alice@example.com",
    status: "new"
  }
};

// Global intercept for Supabase DB calls
let activeTable = "";
let operation = ""; // select, insert, update, delete

const chain = {
  select: () => { operation = "select"; return chain; },
  insert: () => { operation = "insert"; return chain; },
  update: () => { operation = "update"; return chain; },
  delete: () => { operation = "delete"; return chain; },
  eq: () => chain,
  not: () => chain,
  order: () => chain,
  upsert: () => { operation = "update"; return chain; },
  single: () => Promise.resolve(getResponse(true)),
  maybeSingle: () => Promise.resolve(getResponse(true)),
  then: (resolve: any) => resolve(getResponse(false))
};

function getResponse(isSingle: boolean) {
  if (operation === "insert" || operation === "update") {
    const defaultData = mockData[activeTable];
    return { data: Array.isArray(defaultData) ? defaultData[0] : defaultData, error: null };
  }
  
  if (operation === "delete") {
    return { data: null, error: null };
  }

  const tableData = mockData[activeTable];
  if (isSingle) {
    return { data: Array.isArray(tableData) ? tableData[0] : tableData, error: null };
  }
  return { data: Array.isArray(tableData) ? tableData : [tableData], error: null };
}

Object.defineProperty(supabaseServer, "from", {
  value: (table: string) => {
    activeTable = table;
    return chain;
  }
});

// Mock Supabase Storage Chain
const mockStorageChain = {
  upload: () => Promise.resolve({ data: { path: "mock_uploaded_path.pdf" }, error: null }),
  download: () => Promise.resolve({ data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)) }, error: null }),
  remove: () => Promise.resolve({ data: [{ name: "mock_deleted.pdf" }], error: null }),
  createSignedUrl: () => Promise.resolve({ data: { signedUrl: "https://example.com/mock_signed_url.pdf" }, error: null })
};

Object.defineProperty(supabaseServer, "storage", {
  value: {
    from: (bucket: string) => mockStorageChain
  }
});

// Import services dynamically after process.env configuration has been injected
async function runTests() {
  console.log("🚀 Starting Service Layer Test Suite...\n");
  
  const { BookingService } = await import("../lib/services/booking.service");
  const { DocumentService } = await import("../lib/services/document.service");
  const { PDFService } = await import("../lib/services/pdf.service");
  const { SignatureService } = await import("../lib/services/signature.service");
  const { WordPressService } = await import("../lib/services/wordpress.service");
  const { WordPressLeadService } = await import("../lib/services/wordpressLead.service");
  const { EmailService } = await import("../lib/services/email.service");
  const { StorageService } = await import("../lib/services/storage.service");

  // Mock Email Service Resend call
  Object.defineProperty((EmailService as any).resend.emails, "send", {
    value: () => Promise.resolve({ data: { id: "email_sent_id_123" }, error: null })
  });

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(` ✅ PASSED: ${testName}`);
      passedCount++;
    } else {
      console.error(` ❌ FAILED: ${testName}`);
      failedCount++;
    }
  }

  try {
    // ==========================================
    // 1. BookingService Tests
    // ==========================================
    console.log("--- Testing BookingService ---");
    const plans = await BookingService.getPlans();
    assert(plans.length > 0 && plans[0].name === "Phone Consultation", "BookingService.getPlans()");

    const planById = await BookingService.getPlanById("11111111-1111-1111-1111-111111111111");
    assert(planById !== null && planById.slug === "phone-consultation", "BookingService.getPlanById()");

    const planBySlug = await BookingService.getPlanBySlug("phone-consultation");
    assert(planBySlug !== null && planBySlug.name === "Phone Consultation", "BookingService.getPlanBySlug()");

    const slots = await BookingService.getAvailableSlots("2026-07-10");
    assert(!slots.includes("09:00:00") && slots.includes("10:00:00"), "BookingService.getAvailableSlots()");

    const newBooking = await BookingService.createBooking({
      name: "John Doe",
      email: "john@example.com",
      phone: "0400000000",
      plan_id: "11111111-1111-1111-1111-111111111111",
      date: "2026-07-10",
      time: "10:00:00",
      notes: "Test consultation",
      stripe_session_id: "cs_test_session"
    });
    assert(newBooking.name === "John Doe", "BookingService.createBooking()");

    const confirmed = await BookingService.confirmBookingPayment("cs_test_session");
    assert(confirmed === true, "BookingService.confirmBookingPayment()");

    const cancelled = await BookingService.cancelBooking("33333333-3333-3333-3333-333333333333");
    assert(cancelled === true, "BookingService.cancelBooking()");

    // ==========================================
    // 2. DocumentService Tests
    // ==========================================
    console.log("\n--- Testing DocumentService ---");
    const templates = await DocumentService.getTemplates("189");
    assert(templates.length > 0 && templates[0].visa_subclass === "189", "DocumentService.getTemplates()");

    const fields = await DocumentService.getTemplateFields("44444444-4444-4444-4444-444444444444");
    assert(fields.length > 0 && fields[0].field_name === "passport_no", "DocumentService.getTemplateFields()");

    const doc = await DocumentService.createDocument({
      client_id: "00000000-0000-0000-0000-000000000000",
      template_id: "44444444-4444-4444-4444-444444444444",
      name: "Passport.pdf",
      file_path: "uploads/passport.pdf"
    });
    assert(doc.name === "Passport.pdf" && doc.status === "pending_review", "DocumentService.createDocument()");

    const reviewed = await DocumentService.reviewDocument("66666666-6666-6666-6666-666666666666", "approved");
    assert(reviewed === true, "DocumentService.reviewDocument()");

    // ==========================================
    // 3. PDFService Tests
    // ==========================================
    console.log("\n--- Testing PDFService ---");
    const bookingSummaryBuffer = await PDFService.generateBookingSummaryPDF(mockData.bookings);
    assert(Buffer.isBuffer(bookingSummaryBuffer) && bookingSummaryBuffer.toString("utf-8").includes("BOOKING SUMMARY RECORD"), "PDFService.generateBookingSummaryPDF()");

    const agreementBuffer = await PDFService.generateAgreementPDF("John Doe", {
      visaSubclass: "189",
      agreedPriceAud: 50000
    });
    assert(Buffer.isBuffer(agreementBuffer) && agreementBuffer.toString("utf-8").includes("MIGRATION SERVICES CLIENT AGREEMENT"), "PDFService.generateAgreementPDF()");

    // AcroForm Tests
    const pdfFormBuffer = Buffer.from("dummy pdf");
    const formFields = await PDFService.readAcroForm(pdfFormBuffer);
    assert(formFields.length === 2 && formFields[0].name === "Given Names", "PDFService.readAcroForm()");

    const filledForm = await PDFService.fillAcroForm(pdfFormBuffer, { "Given Names": "John" });
    assert(Buffer.isBuffer(filledForm), "PDFService.fillAcroForm()");

    const generatedDocPath = await PDFService.generateDocument("66666666-6666-6666-6666-666666666666");
    assert(generatedDocPath === "00000000-0000-0000-0000-000000000000/66666666-6666-6666-6666-666666666666_final.pdf", "PDFService.generateDocument()");

    // ==========================================
    // 4. SignatureService Tests
    // ==========================================
    console.log("\n--- Testing SignatureService ---");
    const sigReq = await SignatureService.createSignatureRequest({
      document_id: "66666666-6666-6666-6666-666666666666",
      signer_email: "john@example.com",
      signer_name: "John Doe"
    });
    assert(sigReq.signer_email === "john@example.com" && sigReq.status === "sent", "SignatureService.createSignatureRequest()");

    const signed = await SignatureService.signDocument(
      "77777777-7777-7777-7777-777777777777",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      { ipAddress: "127.0.0.1", userAgent: "Mozilla/5.0" }
    );
    assert(signed === true, "SignatureService.signDocument()");

    const declined = await SignatureService.declineSignatureRequest("77777777-7777-7777-7777-777777777777");
    assert(declined === true, "SignatureService.declineSignatureRequest()");

    // ==========================================
    // 5. WordPressService Tests
    // ==========================================
    console.log("\n--- Testing WordPressService ---");
    const wpPosts = await WordPressService.fetchBlogPosts();
    assert(wpPosts.length > 0 && wpPosts[0].slug === "australian-skilled-visas-guide", "WordPressService.fetchBlogPosts()");

    const wpPost = await WordPressService.fetchPostBySlug("australian-skilled-visas-guide");
    assert(wpPost !== null && wpPost.title.rendered === "Guide to Australian Skilled Visas", "WordPressService.fetchPostBySlug()");

    const lead = await WordPressService.processWPWebhook({
      "your-name": "Alice Smith",
      "your-email": "alice@example.com",
      "your-phone": "0411111111",
      "your-message": "WordPress form webhook test message"
    });
    assert(lead.first_name === "Alice" && lead.email === "alice@example.com", "WordPressService.processWPWebhook()");

    // Test Elementor Form nested structure mapping
    const elementorLead = await WordPressLeadService.processWPWebhook({
      form_id: "elementor_lead_form",
      fields: {
        name: { value: "Bob Jones" },
        email: { value: "bob@example.com" },
        field_3c2ce74: { value: "0422222222" },
        message: { value: "Elementor nested test message" }
      },
      meta: {
        page_url: "https://example.com/contact"
      }
    });
    assert(elementorLead.first_name === "Bob" && elementorLead.email === "bob@example.com", "WordPressLeadService.processWPWebhook() with Elementor nested payload");

    // ==========================================
    // 6. EmailService Tests
    // ==========================================
    console.log("\n--- Testing EmailService ---");
    const confirmMail = await EmailService.sendBookingConfirmation("john@example.com", "John Doe", "Phone Consultation", "2026-07-10", "10:00:00");
    assert(confirmMail === true, "EmailService.sendBookingConfirmation()");

    const alertMail = await EmailService.sendAdminBookingAlert("John Doe", "john@example.com", "Phone Consultation", "2026-07-10", "10:00:00");
    assert(alertMail === true, "EmailService.sendAdminBookingAlert()");

    const sigMail = await EmailService.sendSignatureRequest("john@example.com", "John Doe", "Passport.pdf", "77777777-7777-7777-7777-777777777777");
    assert(sigMail === true, "EmailService.sendSignatureRequest()");

    const inviteMail = await EmailService.sendSignatureInvitation("john@example.com", "John Doe", "Passport.pdf", "77777777-7777-7777-7777-777777777777");
    assert(inviteMail === true, "EmailService.sendSignatureInvitation()");

    const remindMail = await EmailService.sendSignatureReminder("john@example.com", "John Doe", "Passport.pdf", "77777777-7777-7777-7777-777777777777", new Date().toISOString());
    assert(remindMail === true, "EmailService.sendSignatureReminder()");

    const completedMail = await EmailService.sendSignatureCompleted("john@example.com", "John Doe", "Passport.pdf", "https://example.com/signed.pdf");
    assert(completedMail === true, "EmailService.sendSignatureCompleted()");

    const adminCopyMail = await EmailService.sendSignatureAdminCopy("John Doe", "Passport.pdf", "https://example.com/signed.pdf");
    assert(adminCopyMail === true, "EmailService.sendSignatureAdminCopy()");

    // ==========================================
    // 7. StorageService Tests
    // ==========================================
    console.log("\n--- Testing StorageService ---");
    const fileBuffer = Buffer.from("mock content");
    const uploadedPath = await StorageService.upload("documents", "client1/passport.pdf", fileBuffer, "application/pdf");
    assert(uploadedPath === "mock_uploaded_path.pdf", "StorageService.upload()");

    const downloadedBuffer = await StorageService.download("documents", "client1/passport.pdf");
    assert(Buffer.isBuffer(downloadedBuffer), "StorageService.download()");

    const deleted = await StorageService.delete("documents", "client1/passport.pdf");
    assert(deleted === true, "StorageService.delete()");

    const url = await StorageService.signedUrl("documents", "client1/passport.pdf");
    assert(url === "https://example.com/mock_signed_url.pdf", "StorageService.signedUrl()");

    console.log(`\n🎉 Test Execution Finished: ${passedCount} passed, ${failedCount} failed.`);
    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (e) {
    console.error("\n❌ Test execution failed with error:", e);
    process.exit(1);
  }
}

runTests();
