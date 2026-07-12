import * as React from "react";

interface BookingEmailProps {
  clientName: string;
  planName: string;
  date: string;
  time: string;
  meetLink?: string;
}

export default function BookingEmail({
  clientName,
  planName,
  date,
  time,
  meetLink,
}: BookingEmailProps) {
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
          Consultation Confirmed
        </p>
      </div>

      <div style={{ backgroundColor: "#07162c", padding: "24px", borderRadius: "12px", border: "1px solid #0c1e35" }}>
        <p style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Dear <strong>{clientName}</strong>,</p>
        <p style={{ margin: "0 0 20px 0", color: "#a0aec0", fontSize: "14px", lineHeight: "1.5" }}>
          Your visa consultation has been successfully booked. Please find the details of your appointment below:
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px 0", fontSize: "13px", color: "#a0aec0" }}>Consultation Type:</td>
              <td style={{ padding: "8px 0", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{planName}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0", fontSize: "13px", color: "#a0aec0" }}>Date:</td>
              <td style={{ padding: "8px 0", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{date}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0", fontSize: "13px", color: "#a0aec0" }}>Time:</td>
              <td style={{ padding: "8px 0", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{time}</td>
            </tr>
          </tbody>
        </table>

        {meetLink && (
          <div style={{ textAlign: "center", marginTop: "25px" }}>
            <a 
              href={meetLink} 
              style={{
                backgroundColor: "#D4AF37",
                color: "#030E1E",
                padding: "12px 24px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "14px",
                display: "inline-block",
              }}
            >
              Join Consultation Meeting
            </a>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "30px", fontSize: "11px", color: "#718096" }}>
        <p style={{ margin: "0" }}>Migration Republic © 2026. All rights reserved.</p>
      </div>
    </div>
  );
}
