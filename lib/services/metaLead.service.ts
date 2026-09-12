import { supabaseServer } from "@/lib/supabase-server";
import { env } from "@/lib/env";
import { WebsiteLead } from "@/lib/types";

const GRAPH_API_VERSION = "v21.0";

interface MetaLeadFieldDatum {
  name: string;
  values: string[];
}

interface MetaLeadgenChange {
  field: string;
  value: {
    leadgen_id: string;
    page_id: string;
    form_id: string;
    adgroup_id?: string;
    ad_id?: string;
    created_time?: number;
    // Not always present, but Meta sends this on some payload versions.
    platform?: "fb" | "ig" | "facebook" | "instagram";
  };
}

interface MetaWebhookEntry {
  id: string; // page id
  time: number;
  changes: MetaLeadgenChange[];
}

export interface MetaWebhookPayload {
  object: "page" | "instagram";
  entry: MetaWebhookEntry[];
}

/**
 * MetaLeadService
 *
 * Handles Facebook & Instagram Lead Ads ("leadgen") webhook events:
 * - Meta only sends an event containing a `leadgen_id` reference, not the
 *   actual answers, so we fetch the full lead from the Graph API.
 * - Normalizes the lead's `field_data` into the same shape as website_leads
 *   so it shows up in the same admin table, tagged with a `channel`.
 */
export class MetaLeadService {
  /**
   * Handles a full webhook payload (one or more page entries/changes).
   */
  static async processWebhookPayload(payload: MetaWebhookPayload): Promise<WebsiteLead[]> {
    const inserted: WebsiteLead[] = [];

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "leadgen") continue;

        try {
          const lead = await this.processLeadgenEvent(change.value, payload.object);
          if (lead) inserted.push(lead);
        } catch (err) {
          // Don't let one bad lead break the rest of the batch.
          console.error("MetaLeadService: failed to process leadgen event", change.value, err);
        }
      }
    }

    return inserted;
  }

  /**
   * Fetches the full lead data for a single leadgen_id from the Graph API
   * and inserts it into website_leads.
   */
  static async processLeadgenEvent(
    value: MetaLeadgenChange["value"],
    webhookObject: MetaWebhookPayload["object"]
  ): Promise<WebsiteLead | null> {
    const { leadgen_id, form_id, page_id } = value;

    if (!leadgen_id) {
      console.error("MetaLeadService: missing leadgen_id in webhook value", value);
      return null;
    }

    if (!env.META_PAGE_ACCESS_TOKEN) {
      throw new Error(
        "META_PAGE_ACCESS_TOKEN is not configured — cannot fetch lead details from the Graph API."
      );
    }

    // Avoid inserting the same lead twice if Meta retries the webhook delivery.
    const { data: existing } = await supabaseServer
      .from("website_leads")
      .select("id")
      .eq("wordpress_lead_id", leadgen_id)
      .maybeSingle();

    if (existing) {
      return null;
    }

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgen_id}?access_token=${env.META_PAGE_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      throw new Error(`Graph API error fetching lead ${leadgen_id}: ${json?.error?.message || res.statusText}`);
    }

    const fieldData: MetaLeadFieldDatum[] = json.field_data || [];

    const getField = (keywords: string[]) => {
      const match = fieldData.find(f =>
        keywords.some(kw => f.name.toLowerCase().replace(/[-_]/g, "").includes(kw))
      );
      return match?.values?.[0]?.trim() || "";
    };

    const fullName = getField(["fullname", "name"]);
    const email = getField(["email"]) || "no-email@migrationrepublic.com.au";
    const phone = getField(["phone", "mobile", "tel"]);

    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = getField(["firstname"]) || nameParts[0] || "Social";
    const lastName = getField(["lastname"]) || nameParts.slice(1).join(" ") || "Lead";

    // Determine Facebook vs Instagram. Meta's leadgen webhook payload doesn't
    // reliably label the platform; `json.platform` (returned by some Graph API
    // versions) and the webhook's top-level `object` are the best signals we have.
    const rawPlatform = String(json.platform || value.platform || webhookObject || "").toLowerCase();
    const channel: "facebook" | "instagram" = rawPlatform.includes("ig") || rawPlatform.includes("instagram")
      ? "instagram"
      : "facebook";

    const { data, error } = await supabaseServer
      .from("website_leads")
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          subject: `${channel === "instagram" ? "Instagram" : "Facebook"} Lead Ad Submission`,
          message: fieldData.map(f => `${f.name}: ${f.values?.[0] ?? ""}`).join("\n") || "No additional answers",
          source_url: `https://www.facebook.com/${page_id}`,
          wordpress_form_id: form_id || null,
          wordpress_lead_id: leadgen_id,
          channel,
          status: "new",
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("MetaLeadService.processLeadgenEvent error saving to Supabase:", error);
      throw new Error(`Failed to insert Meta lead: ${error.message}`);
    }

    return data;
  }
}
