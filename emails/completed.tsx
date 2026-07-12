// import * as React from "react";

interface CompletedEmailProps {
  signerName: string;
  documentName: string;
  downloadLink: string;
}

export default function CompletedEmail({
  signerName,
  documentName,
  downloadLink,
}: CompletedEmailProps) {
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
          Signing Complete
        </p>
      </div>

      <div style={{ backgroundColor: "#07162c", padding: "24px", borderRadius: "12px", border: "1px solid #0c1e35" }}>
        <p style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Dear <strong>{signerName}</strong>,</p>
        <p style={{ margin: "0 0 20px 0", color: "#a0aec0", fontSize: "14px", lineHeight: "1.5" }}>
          Thank you. The digital execution workflow for the document <strong>&quot;{documentName}&quot;</strong> is now fully signed, stamped, and verified.
        </p>
        <p style={{ margin: "0 0 25px 0", color: "#a0aec0", fontSize: "14px", lineHeight: "1.5" }}>
          You can download a copy of the fully executed PDF document including the electronic signature stamp and UTC audit trail by clicking the link below:
        </p>

        <div style={{ textAlign: "center", margin: "25px 0" }}>
          <a
            href={downloadLink}
            style={{
              backgroundColor: "#48bb78",
              color: "#ffffff",
              padding: "12px 28px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "14px",
              display: "inline-block",
            }}
          >
            Download Signed PDF
          </a>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "30px", fontSize: "11px", color: "#718096" }}>
        <p style={{ margin: "0" }}>Migration Republic © 2026. All rights reserved.</p>
      </div>
    </div>
  );
}
