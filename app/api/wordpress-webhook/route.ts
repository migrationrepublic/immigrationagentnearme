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

    // 2. Safe JSON Body parse
    const payload = await request.json().catch(() => null);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Empty request payload received" },
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
