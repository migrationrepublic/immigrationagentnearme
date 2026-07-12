import * as React from "react";

interface SignatureEmailProps {
  signerName: string;
  documentName: string;
  signLink: string;
  isReminder?: boolean;
}

export default function SignatureEmail({
  signerName,
  documentName,
  signLink,
  isReminder = false,
}: SignatureEmailProps) {
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
          backgroundColor: "#030E1E",
          padding: "24px",
          textAlign: "center",
          borderBottom: "2px solid #D4AF37",
        }}>
          <img
            src="https://immigrationagentnearme.com/images/logobgwhite.jpg"
            alt="Migration Republic"
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              border: "2px solid #FFFFFF",
              display: "block",
              margin: "0 auto 12px auto",
              objectFit: "cover",
            }}
          />
          <div style={{
            color: "#ffffff",
            margin: "0",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "0.5px",
            lineHeight: "1.2",
          }}>
            Migration Republic
          </div>
          <div style={{
            color: "#D4AF37",
            margin: "4px 0 0 0",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
          }}>
            Registered Migration Agents
          </div>
        </div>

        {/* Body Content */}
        <div style={{
          padding: "32px 24px",
          color: "#1e293b",
          lineHeight: "1.6",
          fontSize: "15px",
        }}>
          <h2 style={{
            color: "#030E1E",
            marginTop: "0",
            fontSize: "20px",
            fontWeight: "bold",
            borderBottom: "2px solid #D4AF37",
            paddingBottom: "8px",
          }}>
            {isReminder ? "Urgent Signature Reminder" : "Signature Requested"}
          </h2>
          <p style={{ margin: "0 0 16px 0" }}>Dear <strong>{signerName}</strong>,</p>
          <p style={{ margin: "0 0 16px 0" }}>
            {isReminder
              ? `This is a reminder that you have a pending visa compliance document awaiting your signature: "${documentName}".`
              : `You have been requested to digitally sign the following document for visa processing: "${documentName}".`}
          </p>
          <p style={{ margin: "0 0 24px 0" }}>
            Please click the button below to view, verify, and apply your digital signature canvas securely:
          </p>

          <div style={{ textAlign: "center", margin: "25px 0" }}>
            <a
              href={signLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: "#e40229",
                color: "#ffffff",
                padding: "12px 28px",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                display: "inline-block",
                fontSize: "14px",
                boxShadow: "0 4px 6px rgba(228, 2, 41, 0.15)",
              }}
            >
              Review and Sign Document
            </a>
          </div>

          <p style={{ margin: "24px 0 0 0", color: "#e53e3e", fontSize: "12px" }}>
            * For legal security, this invitation link will expire in 7 days.
          </p>
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
          <div style={{ fontWeight: "bold", color: "#030E1E", marginBottom: "8px", fontSize: "14px" }}>
            Migration Republic
          </div>
          <div style={{ marginBottom: "16px", lineHeight: "1.5" }}>
            📍 470 St Kilda Road, Melbourne, VIC 3004<br />
            📞 <a href="tel:+61435321219" style={{ color: "#030E1E", textDecoration: "none", fontWeight: 600 }}>+61 435 321 219</a><br />
            ✉️ <a href="mailto:info@migrationrepublic.com.au" style={{ color: "#030E1E", textDecoration: "none", fontWeight: 600 }}>info@migrationrepublic.com.au</a><br />
            🌐 <a href="https://migrationrepublic.com.au" target="_blank" rel="noopener noreferrer" style={{ color: "#D4AF37", textDecoration: "none", fontWeight: 600 }}>migrationrepublic.com.au</a>
          </div>

          <div style={{ margin: "20px 0", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            <span style={{
              fontWeight: 600,
              color: "#030E1E",
              display: "block",
              marginBottom: "10px",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              Follow Us
            </span>
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", backgroundColor: "#3b5998", color: "#ffffff", padding: "6px 14px", borderRadius: "4px", textDecoration: "none", fontSize: "12px", fontWeight: "bold", margin: "0 4px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>Facebook</a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", backgroundColor: "#e1306c", color: "#ffffff", padding: "6px 14px", borderRadius: "4px", textDecoration: "none", fontSize: "12px", fontWeight: "bold", margin: "0 4px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>Instagram</a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", backgroundColor: "#0077b5", color: "#ffffff", padding: "6px 14px", borderRadius: "4px", textDecoration: "none", fontSize: "12px", fontWeight: "bold", margin: "0 4px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>LinkedIn</a>
          </div>

          <div style={{
            fontSize: "11px",
            color: "#94a3b8",
            marginTop: "20px",
            lineHeight: "1.5",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "16px",
          }}>
            🏛️ MARN: 2518961 | All agents MARA registered.<br />
            © 2026 Migration Republic. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
