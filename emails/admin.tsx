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
              width: "100px",
              height: "100px",
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
            MR Admin Alerts
          </div>
          <div style={{
            color: "#D4AF37",
            margin: "4px 0 0 0",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
          }}>
            Internal Registry Copy
          </div>
        </div>

        {/* Body Content */}
        <div style={{
          padding: "32px 24px",
          color: "#1e293b",
          lineHeight: "1.6",
          fontSize: "15px",
        }}>
          {type === "signature" ? (
            <div>
              <h2 style={{
                color: "#030E1E",
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
                      <td style={{ padding: "8px 0", color: "#030E1E", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{signerName}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Document Name:</strong></td>
                      <td style={{ padding: "8px 0", color: "#030E1E", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{documentName}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Timestamp (UTC):</strong></td>
                      <td style={{ padding: "8px 0", color: "#030E1E", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{new Date().toUTCString()}</td>
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
                      color: "#030E1E",
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
                color: "#030E1E",
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
                      <td style={{ padding: "8px 0", color: "#030E1E", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{clientName}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Plan Selected:</strong></td>
                      <td style={{ padding: "8px 0", color: "#030E1E", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{planName}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Date & Time:</strong></td>
                      <td style={{ padding: "8px 0", color: "#030E1E", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{date} at {time}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 0", color: "#64748b", fontSize: "13px" }}><strong>Phone Number:</strong></td>
                      <td style={{ padding: "8px 0", color: "#030E1E", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>{phone || "N/A"}</td>
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
                      color: "#030E1E",
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
