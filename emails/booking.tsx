import * as React from "react";

interface BookingEmailProps {
  clientName: string;
  planName: string;
  date: string;
  time: string;
  meetLink?: string;
  phone?: string;
}

export default function BookingEmail({
  clientName,
  planName,
  date,
  time,
  meetLink,
  phone,
}: BookingEmailProps) {
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
              border: "2px solid #D4AF37",
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
                  <td style={{ padding: "6px 0", color: "#030E1E", fontSize: "14px", fontWeight: 600 }}>{planName}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px" }}><strong>Date:</strong></td>
                  <td style={{ padding: "6px 0", color: "#030E1E", fontSize: "14px", fontWeight: 600 }}>{date}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px" }}><strong>Time:</strong></td>
                  <td style={{ padding: "6px 0", color: "#030E1E", fontSize: "14px", fontWeight: 600 }}>{time}</td>
                </tr>
                {phone && (
                  <tr>
                    <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px" }}><strong>Phone:</strong></td>
                    <td style={{ padding: "6px 0", color: "#030E1E", fontSize: "14px", fontWeight: 600 }}>{phone}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {meetLink ? (
            <div style={{
              backgroundColor: "#f0f4ff",
              borderLeft: "4px solid #030E1E",
              padding: "15px",
              borderRadius: "6px",
              margin: "20px 0",
            }}>
              <p style={{ margin: "0", color: "#030E1E", fontWeight: "bold" }}>Microsoft Teams Video Meeting Link:</p>
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
            Thank you for choosing Migration Republic. We look forward to assisting you.
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
