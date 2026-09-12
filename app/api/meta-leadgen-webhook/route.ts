import { NextResponse } from "next/server";
import crypto from "crypto";
import { MetaLeadService, MetaWebhookPayload } from "@/lib/services/metaLead.service";
import { env } from "@/lib/env";

/**
 * GET handles Meta's one-time webhook verification handshake.
 * Configure this URL in Meta App Dashboard > Webhooks > Page/Instagram > "leadgen" field.
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && env.META_VERIFY_TOKEN && token === env.META_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }

  return new Response("Forbidden: verify token mismatch", { status: 403 });
}

/**
 * POST receives real-time "leadgen" events from Facebook/Instagram Lead Ads.
 * The payload only contains a leadgen_id reference — MetaLeadService fetches
 * the actual submitted answers from the Graph API and stores them.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // Verify the request actually came from Meta using the app secret, when configured.
    if (env.META_APP_SECRET) {
      const signature = request.headers.get("x-hub-signature-256") || "";
      const expected =
        "sha256=" + crypto.createHmac("sha256", env.META_APP_SECRET).update(rawBody).digest("hex");

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expected);
      const isValid =
        sigBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, expectedBuffer);

      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody) as MetaWebhookPayload;

    // Meta expects a fast 200 response; process leads then acknowledge.
    const leads = await MetaLeadService.processWebhookPayload(payload);

    return NextResponse.json({ success: true, processed: leads.length });
  } catch (err) {
    console.error("Meta leadgen webhook error:", err);
    // Still return 200-ish behavior Meta tolerates, but surface the error for logs.
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
