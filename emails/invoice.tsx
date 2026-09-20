import * as React from "react";
import EmailShell from "./EmailShell";
import { AppSettings } from "@/lib/types";

interface InvoiceEmailProps {
  settings: AppSettings;
  clientName: string;
  invoiceNumber: string;
  total: number;
  balanceDue: number;
  dueDate: string;
  isPaid: boolean;
}

function formatMoney(n: number): string {
  return `$${(n ?? 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoiceEmail({
  settings,
  clientName,
  invoiceNumber,
  total,
  balanceDue,
  dueDate,
  isPaid,
}: InvoiceEmailProps) {
  return (
    <EmailShell settings={settings}>
      <h2 style={{ color: "#06276C", marginTop: "0", fontSize: "20px", fontWeight: "bold", borderBottom: "2px solid #D4AF37", paddingBottom: "8px" }}>
        {isPaid ? "Payment Received — Thank You" : "Your Invoice Is Ready"}
      </h2>
      <p style={{ margin: "0 0 16px 0" }}>Dear <strong>{clientName}</strong>,</p>
      <p style={{ margin: "0 0 16px 0" }}>
        {isPaid
          ? <>We&apos;ve received your payment for invoice <strong>{invoiceNumber}</strong>. A copy marked as paid is attached to this email for your records.</>
          : <>Please find attached invoice <strong>{invoiceNumber}</strong> for your recent consultation with {settings.business_name}.</>}
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
              <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px", width: "140px" }}><strong>Invoice Number:</strong></td>
              <td style={{ padding: "6px 0", color: "#06276C", fontSize: "14px", fontWeight: 600 }}>{invoiceNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px" }}><strong>Total Amount:</strong></td>
              <td style={{ padding: "6px 0", color: "#06276C", fontSize: "14px", fontWeight: 600 }}>{formatMoney(total)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px" }}><strong>{isPaid ? "Balance:" : "Balance Due:"}</strong></td>
              <td style={{ padding: "6px 0", color: isPaid ? "#166534" : "#e40229", fontSize: "14px", fontWeight: 700 }}>
                {isPaid ? "PAID IN FULL" : formatMoney(balanceDue)}
              </td>
            </tr>
            {!isPaid && (
              <tr>
                <td style={{ padding: "6px 0", color: "#64748b", fontSize: "14px" }}><strong>Due Date:</strong></td>
                <td style={{ padding: "6px 0", color: "#06276C", fontSize: "14px", fontWeight: 600 }}>{dueDate}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: "24px", marginBottom: "0" }}>
        Thank you for choosing {settings.business_name}. If you have any questions about this invoice, simply reply to this email.
      </p>
    </EmailShell>
  );
}
