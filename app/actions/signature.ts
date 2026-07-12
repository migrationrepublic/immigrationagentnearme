"use server";

import { SignatureService } from "@/lib/services/signature.service";
import { supabaseServer } from "@/lib/supabase-server";
import { headers } from "next/headers";
import { z } from "zod";

// ── Input Schemas ─────────────────────────────────────────────────────────────

const CreateSignatureRequestSchema = z.object({
  document_id: z.string().uuid("Invalid document ID"),
  signer_email: z.string().email("Invalid signer email address"),
  signer_name: z.string().min(2, "Signer name is required"),
  expires_at: z.string().optional(),
  fields: z.array(z.any()).optional(),
  signing_order: z.number().int().optional(),
  signing_message: z.string().optional(),
  status: z.string().optional(),
});

const UpdateSignatureStatusSchema = z.object({
  request_id: z.string().uuid("Invalid signature request ID"),
  status: z.enum(["signed", "declined"]),
  signature_image_base64: z.string().optional(),
  fields: z.array(z.any()).optional(),
});

export type CreateSignatureRequestInput = z.infer<typeof CreateSignatureRequestSchema>;
export type UpdateSignatureStatusInput = z.infer<typeof UpdateSignatureStatusSchema>;

// ── Admin Actions ─────────────────────────────────────────────────────────────

/**
 * Creates a new signature request + generates a secure token + sends invitation email.
 */
export async function createSignatureRequestAction(input: CreateSignatureRequestInput) {
  try {
    const validated = CreateSignatureRequestSchema.parse(input);
    const sigReq = await SignatureService.createSignatureRequest(validated);
    return { success: true, requestId: sigReq.id, token: sigReq.token };
  } catch (err) {
    console.error("[createSignatureRequestAction] error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

/**
 * Sends a reminder email for a pending signature request.
 * Replaces the old ghost Supabase Edge Function call.
 */
export async function sendSignatureReminderAction(requestIdInput: string) {
  try {
    const requestId = z.string().uuid("Invalid request ID").parse(requestIdInput);
    const sent = await SignatureService.sendReminder(requestId);
    return { success: sent };
  } catch (err) {
    console.error("[sendSignatureReminderAction] error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

// ── Public Client Actions (no auth required — token-gated) ────────────────────

/**
 * Looks up a signature request by its public URL token.
 * Returns only the data needed by the /sign/[token] page — no sensitive info exposed.
 */
export async function getSignatureRequestByTokenAction(tokenInput: string) {
  try {
    const token = z
      .string()
      .min(16, "Invalid token")
      .regex(/^[a-f0-9]+$/, "Malformed token")
      .parse(tokenInput);

    const result = await SignatureService.getRequestByToken(token);

    if (!result) {
      return { success: false, error: "Signature request not found or invalid link." };
    }

    return {
      success: true,
      requestId: result.request.id,
      signerName: result.request.signer_name,
      signerEmail: result.request.signer_email,
      status: result.request.status,
      documentName: result.documentName,
      documentPath: result.documentPath,
      documentBucket: result.documentBucket,
      expiresAt: result.request.expires_at ?? null,
      isExpired: result.isExpired,
      signedAt: result.request.signed_at ?? null,
      fields: result.request.fields ?? [],
    };
  } catch (err) {
    console.error("[getSignatureRequestByTokenAction] error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

/**
 * Submits a drawn signature for a signature request (sign or decline).
 * Reads IP + User-Agent from request headers for the audit trail.
 */
export async function updateSignatureStatusAction(input: UpdateSignatureStatusInput) {
  try {
    const validated = UpdateSignatureStatusSchema.parse(input);

    // Capture client metadata for the security audit trail
    const reqHeaders = await headers();
    const ipAddress =
      reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      reqHeaders.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "Unknown Browser";

    let success = false;

    if (validated.status === "signed") {
      if (!validated.signature_image_base64) {
        throw new Error("A drawn signature image is required to sign this document.");
      }
      success = await SignatureService.signDocument(
        validated.request_id,
        validated.signature_image_base64,
        { ipAddress, userAgent },
        validated.fields
      );
    } else if (validated.status === "declined") {
      success = await SignatureService.declineSignatureRequest(validated.request_id);
    }

    return { success };
  } catch (err) {
    console.error("[updateSignatureStatusAction] error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

const SendSignatureRequestsSchema = z.object({
  document_id: z.string().uuid("Invalid document ID"),
  requests: z.array(
    z.object({
      id: z.string().uuid("Invalid request ID"),
      fields: z.array(z.any()),
    })
  ),
});

export async function getSignatureRequestsByDocumentAction(documentIdInput: string) {
  try {
    const documentId = z.string().uuid("Invalid document ID").parse(documentIdInput);
    const { data, error } = await supabaseServer
      .from("signature_requests")
      .select("*")
      .eq("document_id", documentId)
      .order("signing_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { success: true, requests: data || [] };
  } catch (err) {
    console.error("[getSignatureRequestsByDocumentAction] error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

export type SendSignatureRequestsInput = z.infer<typeof SendSignatureRequestsSchema>

export async function sendSignatureRequestsAction(input: SendSignatureRequestsInput) {
  try {
    const validated = SendSignatureRequestsSchema.parse(input);
    const success = await SignatureService.activateRequests(validated.document_id, validated.requests);
    return { success };
  } catch (err) {
    console.error("[sendSignatureRequestsAction] error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}
