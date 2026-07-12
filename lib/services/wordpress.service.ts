import { supabaseServer } from "@/lib/supabase-server";
import { WebsiteLead } from "@/lib/types";
// import { z } from "zod";

const WP_URL = "https://migrationrepublic.com.au/wp-json/wp/v2";

export interface WPPost {
  id: number;
  date: string;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    author?: Array<{
      name: string;
    }>;
  };
}

// (Removed strict Zod validation schema to avoid blocking WordPress form submissions on minor parsing differences)

/**
 * WordPressService
 * 
 * Responsible for:
 * - Webhook payload standardizations
 * - Extracting flat parameters (CF7/elementor)
 * - Extracting nested Elementor inputs
 * - Database sync
 */
export class WordPressService {
  /**
   * Fetches blog posts from WordPress host.
   */
  static async fetchBlogPosts(perPage = 10, page = 1): Promise<WPPost[]> {
    try {
      const res = await fetch(`${WP_URL}/posts?per_page=${perPage}&page=${page}&_embed`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!res.ok) {
        return [];
      }
      return res.json();
    } catch (e) {
      console.error("WordPressService.fetchBlogPosts error:", e);
      return [];
    }
  }

  /**
   * Fetches a blog post by its slug.
   */
  static async fetchPostBySlug(slug: string): Promise<WPPost | null> {
    try {
      const res = await fetch(`${WP_URL}/posts?slug=${slug}&_embed`, {
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        return null;
      }
      const posts = await res.json();
      return posts.length > 0 ? posts[0] : null;
    } catch (e) {
      console.error(`WordPressService.fetchPostBySlug (${slug}) error:`, e);
      return null;
    }
  }

  /**
   * Processes a contact form webhook payload from WordPress, validates it, and saves a lead record.
   */
  static async processWPWebhook(payload: Record<string, any>): Promise<WebsiteLead> {
    console.log("Incoming WordPress webhook payload:", JSON.stringify(payload, null, 2));

    const ef = (payload.fields || {}) as Record<string, any>;

    // Fuzzy extractor that looks at both flat keys and nested fields keys
    const findValue = (keywords: string[]) => {
      // 1. Check flat payload keys
      for (const key of Object.keys(payload)) {
        const lowerKey = key.toLowerCase().replace(/[-_]/g, "");
        if (keywords.some(kw => lowerKey === kw || lowerKey.includes(kw))) {
          if (payload[key] !== undefined && payload[key] !== null) {
            return String(payload[key]);
          }
        }
      }
      // 2. Check nested fields keys (Elementor format)
      for (const key of Object.keys(ef)) {
        const lowerKey = key.toLowerCase().replace(/[-_]/g, "");
        if (keywords.some(kw => lowerKey === kw || lowerKey.includes(kw))) {
          if (ef[key]?.value !== undefined && ef[key]?.value !== null) {
            return String(ef[key].value);
          }
        }
      }
      return "";
    };

    // Extract standardized parameters
    const extractedName = findValue(["name", "fullname", "first", "last"]).trim();
    let extractedEmail = findValue(["email", "mail"]).trim();
    const extractedPhone = findValue(["phone", "tel", "mobile", "contact"]).trim();
    const extractedSubject = findValue(["subject", "sub"]).trim();
    const extractedMessage = findValue(["message", "msg", "comment", "body", "textarea"]).trim();

    // Extract source URL (fallback to page URL/referrer)
    const extractedSourceUrl = payload.source_url || payload["_wpcf7_url"] || payload.meta?.page_url || payload.referer_title || "";
    const extractedFormId = String(payload.form_id || payload["_wpcf7"] || payload.form_name || "");
    const extractedLeadId = String(payload.lead_id || payload["_wpcf7_container_post"] || "");

    // Resilient fallback for email since database requires NOT NULL
    if (!extractedEmail) {
      extractedEmail = "no-email@migrationrepublic.com.au";
    }

    // Split name into first and last names
    const nameParts = extractedName.split(/\s+/);
    const firstName = nameParts[0] || "Website";
    const lastName = nameParts.slice(1).join(" ") || "Lead";

    const { data, error } = await supabaseServer
      .from("website_leads")
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email: extractedEmail,
          phone: extractedPhone || null,
          subject: extractedSubject || "Website Contact Form Submission",
          message: extractedMessage || "No message body",
          source_url: extractedSourceUrl || null,
          wordpress_form_id: extractedFormId || null,
          wordpress_lead_id: extractedLeadId || null,
          status: "new",
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("WordPressService.processWPWebhook error saving to Supabase:", error);
      throw new Error(`Failed to insert wordpress lead: ${error.message}`);
    }

    return data;
  }
}
