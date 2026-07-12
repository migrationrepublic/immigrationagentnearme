import * as React from "react";

interface AdminEmailProps {
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
        <h1 style={{ color: "#D4AF37", fontSize: "20px", margin: "0", fontWeight: "bold" }}>
          MR Admin Alerts
        </h1>
        <p style={{ color: "#a0aec0", fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", margin: "5px 0 0 0" }}>
          Internal Registry Copy
        </p>
      </div>

      {type === "signature" ? (
        <div style={{ backgroundColor: "#07162c", padding: "24px", borderRadius: "12px", border: "1px solid #0c1e35" }}>
          <p style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#D4AF37" }}><strong>New Signed Document Registry</strong></p>
          <p style={{ margin: "0 0 20px 0", color: "#a0aec0", fontSize: "13px", lineHeight: "1.5" }}>
            This is an administrative notification copy. The client has successfully completed executing the compliance file:
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "6px 0", fontSize: "12px", color: "#a0aec0" }}>Signer:</td>
                <td style={{ padding: "6px 0", fontSize: "13px", fontWeight: "bold", textAlign: "right" }}>{signerName}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", fontSize: "12px", color: "#a0aec0" }}>Document Name:</td>
                <td style={{ padding: "6px 0", fontSize: "13px", fontWeight: "bold", textAlign: "right" }}>{documentName}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", fontSize: "12px", color: "#a0aec0" }}>Timestamp (UTC):</td>
                <td style={{ padding: "6px 0", fontSize: "13px", fontWeight: "bold", textAlign: "right" }}>{new Date().toUTCString()}</td>
              </tr>
            </tbody>
          </table>

          {downloadLink && (
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              <a 
                href={downloadLink} 
                style={{
                  backgroundColor: "#D4AF37",
                  color: "#030E1E",
                  padding: "10px 24px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "13px",
                  display: "inline-block",
                }}
              >
                View Signed PDF Copy
              </a>
            </div>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: "#07162c", padding: "24px", borderRadius: "12px", border: "1px solid #0c1e35" }}>
          <p style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#D4AF37" }}><strong>New Consultation Booking Received</strong></p>
          <p style={{ margin: "0 0 20px 0", color: "#a0aec0", fontSize: "13px", lineHeight: "1.5" }}>
            A client has scheduled a visa consultation. Booking details are outlined below:
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "6px 0", fontSize: "12px", color: "#a0aec0" }}>Client Name:</td>
                <td style={{ padding: "6px 0", fontSize: "13px", fontWeight: "bold", textAlign: "right" }}>{clientName}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", fontSize: "12px", color: "#a0aec0" }}>Plan Selected:</td>
                <td style={{ padding: "6px 0", fontSize: "13px", fontWeight: "bold", textAlign: "right" }}>{planName}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", fontSize: "12px", color: "#a0aec0" }}>Date & Time:</td>
                <td style={{ padding: "6px 0", fontSize: "13px", fontWeight: "bold", textAlign: "right" }}>{date} at {time}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", fontSize: "12px", color: "#a0aec0" }}>Phone Number:</td>
                <td style={{ padding: "6px 0", fontSize: "13px", fontWeight: "bold", textAlign: "right" }}>{phone || "N/A"}</td>
              </tr>
              {notes && (
                <tr>
                  <td style={{ padding: "6px 0", fontSize: "12px", color: "#a0aec0", verticalAlign: "top" }}>Notes:</td>
                  <td style={{ padding: "6px 0", fontSize: "13px", fontWeight: "bold", textAlign: "right", whiteSpace: "pre-wrap" }}>{notes}</td>
                </tr>
              )}
            </tbody>
          </table>

          {meetLink && (
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              <a 
                href={meetLink} 
                style={{
                  backgroundColor: "#D4AF37",
                  color: "#030E1E",
                  padding: "10px 24px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "13px",
                  display: "inline-block",
                }}
              >
                Join Meeting Link
              </a>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "30px", fontSize: "10px", color: "#718096" }}>
        <p style={{ margin: "0" }}>Migration Republic Admin Panel © 2026.</p>
      </div>
    </div>
  );
}
