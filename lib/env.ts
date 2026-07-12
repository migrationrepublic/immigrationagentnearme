import { z } from "zod";

const isServer = typeof window === "undefined";

const envSchema = z.object({
  // Client & Server accessible variables
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase Anon Key is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Server-only variables (strictly validated only on server execution context)
  SUPABASE_SERVICE_ROLE_KEY: isServer
    ? z.string().min(1, "Supabase Service Role Key is required")
    : z.string().optional(),
  STRIPE_SECRET_KEY: isServer
    ? z.string().min(1, "Stripe Secret Key is required")
    : z.string().optional(),
  STRIPE_WEBHOOK_SECRET: isServer
    ? z.string().min(1, "Stripe Webhook Secret is required")
    : z.string().optional(),
  RESEND_API_KEY: isServer
    ? z.string().min(1, "Resend API Key is required")
    : z.string().optional(),
  EMAIL_FROM: isServer
    ? z.string().min(1, "EMAIL_FROM address is required")
    : z.string().optional(),
  ADMIN_EMAIL: isServer
    ? z.string().email("Invalid ADMIN_EMAIL address")
    : z.string().optional(),
  GEMINI_API_KEY: isServer
    ? z.string().min(1, "Gemini API Key is required")
    : z.string().optional(),
  MICROSOFT_MEET_LINK: isServer
    ? z.string().url().optional()
    : z.string().optional(),
  WORDPRESS_WEBHOOK_SECRET: isServer
    ? z.string().min(1, "WordPress Webhook Secret is required")
    : z.string().optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  MICROSOFT_MEET_LINK: process.env.MICROSOFT_MEET_LINK,
  WORDPRESS_WEBHOOK_SECRET: process.env.WORDPRESS_WEBHOOK_SECRET,
});

if (!parsed.success) {
  console.error("❌ Invalid environment variables configuration:", parsed.error.format());
  throw new Error("Invalid environment variables configuration.");
}

const validated = parsed.data;

export const env = {
  // Mapping to user requested specific key names
  SUPABASE_URL: validated.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_KEY: validated.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  RESEND_KEY: validated.RESEND_API_KEY!,
  STRIPE_KEY: validated.STRIPE_SECRET_KEY!,
  GOOGLE_API_KEY: validated.GEMINI_API_KEY!,

  // Internal keys
  SUPABASE_SERVICE_ROLE_KEY: validated.SUPABASE_SERVICE_ROLE_KEY!,
  STRIPE_WEBHOOK_SECRET: validated.STRIPE_WEBHOOK_SECRET!,
  EMAIL_FROM: validated.EMAIL_FROM!,
  ADMIN_EMAIL: validated.ADMIN_EMAIL!,
  MICROSOFT_MEET_LINK: validated.MICROSOFT_MEET_LINK || "https://teams.live.com/meet/939983663000?p=pxeipOrwss1489LTOJ",
  APP_URL: validated.NEXT_PUBLIC_APP_URL || "https://immigrationagentnearme.com",
  WORDPRESS_WEBHOOK_SECRET: validated.WORDPRESS_WEBHOOK_SECRET!,
};
