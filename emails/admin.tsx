import * as React from "react";
import EmailShell from "./EmailShell";
import { AppSettings } from "@/lib/types";

interface AdminEmailProps {
  settings: AppSettings;
  type: "signature" | "booking";

  // Signature props
  signerName?: string;
  documentName?: string;
  downloadLink?: string;

  // Booking props
  clientName?: string;
  planName?: string;
  date?: string;
  time?: string;
  phone?: string;
  notes?: string;
  meetLink?: string;
}

export default function AdminEmail({
  settings,
  type,
  signerName,
  documentName,
  downloadLink,
  clientName,
  planName,
  date,
  time,
  phone,
  notes,
  meetLink,
}: AdminEmailProps) {
  return (
    <EmailShell settings={settings} headerTitle="MR Admin Alerts" headerSubtitle="Internal Registry Copy">
      {type === "signature" ? (
        <div>
          <h2 style={{
            color: "#06276C",
            marginTop: "0",
            fontSize: "18px",
            fontWeight: "bold",
            borderBottom: "2px solid #D4AF37",
            paddingBottom: "8px",
          }}>
            New Signed Document Registry
          </h2>
          <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "14px" }}>
            This is an administrative notification copy. The client has successfully completed executing the compliance file:
          </p>

          <div style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            padding: "16px",
            margin: "20px 0",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Signer:</strong></td>
                  <td style={{ padding: "8px 0", color: "#06276C", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{signerName}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Document Name:</strong></td>
                  <td style={{ padding: "8px 0", color: "#06276C", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{documentName}</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Timestamp (UTC):</strong></td>
                  <td style={{ padding: "8px 0", color: "#06276C", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{new Date().toUTCString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {downloadLink && (
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
                View Signed PDF Copy
              </a>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 style={{
            color: "#06276C",
            marginTop: "0",
            fontSize: "18px",
            fontWeight: "bold",
            borderBottom: "2px solid #D4AF37",
            paddingBottom: "8px",
          }}>
            New Consultation Booking Received
          </h2>
          <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "14px" }}>
            A client has scheduled a visa consultation. Booking details are outlined below:
          </p>

          <div style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            padding: "16px",
            margin: "20px 0",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px", width: "120px" }}><strong>Client Name:</strong></td>
                  <td style={{ padding: "8px 0", color: "#06276C", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{clientName}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Plan Selected:</strong></td>
                  <td style={{ padding: "8px 0", color: "#06276C", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{planName}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Date & Time:</strong></td>
                  <td style={{ padding: "8px 0", color: "#06276C", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{date} at {time}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Phone Number:</strong></td>
                  <td style={{ padding: "8px 0", color: "#06276C", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{phone || "N/A"}</td>
                </tr>
                {notes && (
                  <tr>
                    <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px", verticalAlign: "top" }}><strong>Notes:</strong></td>
                    <td style={{ padding: "8px 0", color: "#1e293b", fontSize: "14px", fontWeight: "bold", textAlign: "right", whiteSpace: "pre-wrap" }}>{notes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {meetLink && (
            <div style={{ textAlign: "center", margin: "25px 0" }}>
              <a
                href={meetLink}
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
                Join Meeting Link
              </a>
            </div>
          )}
        </div>
      )}
    </EmailShell>
  );
}
