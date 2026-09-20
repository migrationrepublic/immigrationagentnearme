import * as React from "react";
import EmailShell from "./EmailShell";
import { AppSettings } from "@/lib/types";

interface CompletedEmailProps {
  settings: AppSettings;
  signerName: string;
  documentName: string;
  downloadLink: string;
}

export default function CompletedEmail({
  settings,
  signerName,
  documentName,
  downloadLink,
}: CompletedEmailProps) {
  return (
    <EmailShell settings={settings}>
      <h2 style={{
        color: "#06276C",
        marginTop: "0",
        fontSize: "20px",
        fontWeight: "bold",
        borderBottom: "2px solid #D4AF37",
        paddingBottom: "8px",
      }}>
        Signing Completed
      </h2>
      <p style={{ margin: "0 0 16px 0" }}>Dear <strong>{signerName}</strong>,</p>
      <p style={{ margin: "0 0 16px 0" }}>
        Thank you. The digital execution workflow for the document <strong>&quot;{documentName}&quot;</strong> is now fully signed, stamped, and verified.
      </p>
      <p style={{ margin: "0 0 24px 0" }}>
        You can download a copy of the fully executed PDF document including the electronic signature stamp and UTC audit trail by clicking the link below:
      </p>

      <div style={{ textAlign: "center", margin: "25px 0" }}>
        <a
          href={downloadLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: "#D4AF37",
            color: "#06276C",
            padding: "12px 28px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "14px",
            display: "inline-block",
            boxShadow: "0 4px 6px rgba(212, 175, 55, 0.15)",
          }}
        >
          Download Signed PDF
        </a>
      </div>
    </EmailShell>
  );
}
