import * as React from "react";
import EmailShell from "./EmailShell";
import { AppSettings } from "@/lib/types";

interface BookingEmailProps {
  settings: AppSettings;
  clientName: string;
  planName: string;
  date: string;
  time: string;
  meetLink?: string;
  phone?: string;
}

export default function BookingEmail({
  settings,
  clientName,
  planName,
  date,
  time,
  meetLink,
  phone,
}: BookingEmailProps) {
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
        Booking Confirmed
      </h2>
      <p style={{ margin: "0 0 16px 0" }}>Dear <strong>{clientName}</strong>,</p>
      <p style={{ margin: "0 0 16px 0" }}>
        Your booking for a <strong>{planName}</strong> has been successfully confirmed. Below are your booking details:
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
            <tr>
              <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px", width: "120px" }}><strong>Plan Selected:</strong></td>
              <td style={{ padding: "6px 0", color: "#06276C", fontSize: "14px", fontWeight: 600 }}>{planName}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px" }}><strong>Date:</strong></td>
              <td style={{ padding: "6px 0", color: "#06276C", fontSize: "14px", fontWeight: 600 }}>{date}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px" }}><strong>Time:</strong></td>
              <td style={{ padding: "6px 0", color: "#06276C", fontSize: "14px", fontWeight: 600 }}>{time}</td>
            </tr>
            {phone && (
              <tr>
                <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px" }}><strong>Phone:</strong></td>
                <td style={{ padding: "6px 0", color: "#06276C", fontSize: "14px", fontWeight: 600 }}>{phone}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meetLink ? (
        <div style={{
          backgroundColor: "#f0f4ff",
          borderLeft: "4px solid #06276C",
          padding: "15px",
          borderRadius: "6px",
          margin: "20px 0",
        }}>
          <p style={{ margin: "0", color: "#06276C", fontWeight: "bold" }}>Microsoft Teams Video Meeting Link:</p>
          <p style={{ margin: "5px 0 15px 0", fontSize: "14px", color: "#4b5563" }}>
            You can join your scheduled online consultation directly by clicking the button below:
          </p>
          <div style={{ textAlign: "center" }}>
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: "#e40229",
                color: "#ffffff",
                padding: "12px 24px",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                display: "inline-block",
                fontSize: "14px",
                boxShadow: "0 4px 6px rgba(228, 2, 41, 0.15)",
              }}
            >
              Join Microsoft Teams Meeting
            </a>
          </div>
        </div>
      ) : (
        <p style={{
          color: "#64748b",
          fontSize: "14px",
          backgroundColor: "#f8fafc",
          borderLeft: "4px solid #D4AF37",
          padding: "12px",
          borderRadius: "4px",
          margin: "20px 0",
        }}>
          📞 We will call you at your scheduled time on the phone number provided: <strong>{phone || 'N/A'}</strong>. Please ensure you are available.
        </p>
      )}

      <p style={{ marginTop: "24px", marginBottom: "0" }}>
        Thank you for choosing {settings.business_name}. We look forward to assisting you.
      </p>
    </EmailShell>
  );
}
