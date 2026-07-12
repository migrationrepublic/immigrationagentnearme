import { NextResponse } from "next/server";
import { WordPressLeadService } from "@/lib/services/wordpressLead.service";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    // 1. Verify Secret Token parameter
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (token !== env.WORDPRESS_WEBHOOK_SECRET) {
      return new Response("Unauthorized: Invalid secret token", { status: 401 });
    }

    // 2. Safe multi-format body parser (accepts JSON, urlencoded, and multipart form data)
    const contentType = request.headers.get("content-type") || "";
    let payload: Record<string, any> | null = null;

    try {
      if (contentType.includes("application/json")) {
        payload = await request.json();
      } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        payload = {};
        formData.forEach((value, key) => {
          if (payload) {
            payload[key] = value;
          }
        });
      } else {
        // Fallback: parse request body text as query parameters or JSON
        const bodyText = await request.text();
        if (bodyText.trim().startsWith("{")) {
          payload = JSON.parse(bodyText);
        } else {
          const params = new URLSearchParams(bodyText);
          payload = {};
          params.forEach((value, key) => {
            if (payload) {
              payload[key] = value;
            }
          });
        }
      }
    } catch (parseError) {
      console.error("Failed to parse incoming webhook payload:", parseError);
    }

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json(
        { success: false, error: "Empty or unparseable request payload received" },
        { status: 400 }
      );
    }

    // 3. Process and insert the lead using the WordPressLeadService
    const lead = await WordPressLeadService.processWPWebhook(payload);

    return NextResponse.json({
      success: true,
      message: "Lead processed and inserted successfully",
      leadId: lead.id,
    });
  } catch (err) {
    console.error("WordPress Webhook API error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "An unknown error occurred during webhook processing" },
      { status: 500 }
    );
  }
}
