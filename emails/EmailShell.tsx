import * as React from "react";
import { AppSettings } from "@/lib/types";

interface EmailShellProps {
  settings: AppSettings;
  /** Overrides the header title (defaults to settings.business_name) — used by internal admin-alert copies. */
  headerTitle?: string;
  /** Overrides the header subtitle (defaults to settings.tagline). */
  headerSubtitle?: string;
  children: React.ReactNode;
}

/**
 * Shared branded shell (header + footer) for every outbound email. All
 * business info — name, address, phone, email, website, social links, MARN —
 * comes from Admin > Settings, so changing it there updates every email at
 * once instead of editing each template.
 */
export default function EmailShell({ settings, headerTitle, headerSubtitle, children }: EmailShellProps) {
  const websiteLabel = settings.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const socialLinks = [
    { url: settings.facebook_url, label: "Facebook", bg: "#3b5998" },
    { url: settings.instagram_url, label: "Instagram", bg: "#e1306c" },
    { url: settings.linkedin_url, label: "LinkedIn", bg: "#0077b5" },
  ].filter(s => !!s.url);

  return (
    <div style={{
      backgroundColor: "#f3f4f6",
      padding: "30px 15px",
      fontFamily: "'Outfit', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      minHeight: "100%",
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
      }}>
        {/* Branded Header */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "28px 24px 20px 24px",
          textAlign: "center",
          borderBottom: "2px solid #D4AF37",
        }}>
          <img
            src={settings.logo_url}
            alt={settings.business_name}
            style={{
              width: "85px",
              height: "auto",
              display: "block",
              margin: "0 auto 10px auto",
              borderRadius: "50%",
              border: "none",
              boxShadow: "none",
            }}
          />
          <div style={{
            color: "#06276C",
            margin: "0",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "0.5px",
            lineHeight: "1.2",
          }}>
            {headerTitle ?? settings.business_name}
          </div>
          <div style={{
            color: "#D4AF37",
            margin: "4px 0 0 0",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
          }}>
            {headerSubtitle ?? settings.tagline}
          </div>
        </div>

        {/* Body Content */}
        <div style={{
          padding: "32px 24px",
          color: "#1e293b",
          lineHeight: "1.6",
          fontSize: "15px",
        }}>
          {children}
        </div>

        {/* Branded Footer */}
        <div style={{
          backgroundColor: "#f8fafc",
          borderTop: "1px solid #f1f5f9",
          padding: "28px 24px",
          textAlign: "center",
          color: "#64748b",
          fontSize: "13px",
        }}>
          <div style={{ fontWeight: "bold", color: "#06276C", marginBottom: "8px", fontSize: "14px" }}>
            {settings.business_name}
          </div>
          <div style={{ marginBottom: "16px", lineHeight: "1.5" }}>
            📍 {settings.office_address}<br />
            📞 <a href={`tel:${settings.contact_phone.replace(/\s+/g, "")}`} style={{ color: "#06276C", textDecoration: "none", fontWeight: 600 }}>{settings.contact_phone}</a><br />
            ✉️ <a href={`mailto:${settings.contact_email}`} style={{ color: "#06276C", textDecoration: "none", fontWeight: 600 }}>{settings.contact_email}</a><br />
            🌐 <a href={settings.website_url} target="_blank" rel="noopener noreferrer" style={{ color: "#D4AF37", textDecoration: "none", fontWeight: 600 }}>{websiteLabel}</a>
          </div>

          {socialLinks.length > 0 && (
            <div style={{ margin: "20px 0", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              <span style={{
                fontWeight: 600,
                color: "#06276C",
                display: "block",
                marginBottom: "10px",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                Follow Us
              </span>
              {socialLinks.map(s => (
                <a
                  key={s.label}
                  href={s.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", backgroundColor: s.bg, color: "#ffffff", padding: "6px 14px", borderRadius: "4px", textDecoration: "none", fontSize: "12px", fontWeight: "bold", margin: "0 4px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}

          <div style={{
            fontSize: "11px",
            color: "#94a3b8",
            marginTop: "20px",
            lineHeight: "1.5",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "16px",
          }}>
            🏛️ MARN: {settings.marn_number} | All agents MARA registered.<br />
            © {new Date().getFullYear()} {settings.business_name}. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
