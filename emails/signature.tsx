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
      fontFamily: "Outfit, Inter, sans-serif",
      backgroundColor: "#030E1E",
      color: "#ffffff",
      padding: "30px",
      borderRadius: "16px",
      maxWidth: "600px",
      margin: "0 auto",
      border: "1px solid #1a2c44",
    }}>
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#D4AF37", fontSize: "24px", margin: "0", fontWeight: "bold" }}>
          Migration Republic
        </h1>
        <p style={{ color: "#a0aec0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", margin: "5px 0 0 0" }}>
          {isReminder ? "Urgent Reminder" : "Signature Requested"}
        </p>
      </div>

      <div style={{ backgroundColor: "#07162c", padding: "24px", borderRadius: "12px", border: "1px solid #0c1e35" }}>
        <p style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Dear <strong>{signerName}</strong>,</p>
        <p style={{ margin: "0 0 20px 0", color: "#a0aec0", fontSize: "14px", lineHeight: "1.5" }}>
          {isReminder 
            ? `This is a reminder that you have a pending visa compliance document awaiting your signature: "${documentName}".`
            : `You have been requested to digitally sign the following document for visa processing: "${documentName}".`}
        </p>
        <p style={{ margin: "0 0 25px 0", color: "#a0aec0", fontSize: "14px", lineHeight: "1.5" }}>
          Please click the button below to view, verify, and apply your digital signature canvas securely:
        </p>

        <div style={{ textAlign: "center", margin: "25px 0" }}>
          <a 
            href={signLink} 
            style={{
              backgroundColor: "#D4AF37",
              color: "#030E1E",
              padding: "12px 28px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "14px",
              display: "inline-block",
            }}
          >
            Review and Sign Document
          </a>
        </div>

        <p style={{ margin: "0", color: "#e53e3e", fontSize: "12px" }}>
          * For legal security, this invitation link will expire in 7 days.
        </p>
      </div>

      <div style={{ textAlign: "center", marginTop: "30px", fontSize: "11px", color: "#718096" }}>
        <p style={{ margin: "0" }}>Migration Republic © 2026. All rights reserved.</p>
      </div>
    </div>
  );
}
