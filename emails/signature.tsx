import * as React from "react";
import EmailShell from "./EmailShell";
import { AppSettings } from "@/lib/types";

interface SignatureEmailProps {
  settings: AppSettings;
  signerName: string;
  documentName: string;
  signLink: string;
  isReminder?: boolean;
}

export default function SignatureEmail({
  settings,
  signerName,
  documentName,
  signLink,
  isReminder = false,
}: SignatureEmailProps) {
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
    </EmailShell>
  );
}
