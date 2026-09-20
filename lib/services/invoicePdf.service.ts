import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { AppSettings, Invoice } from "@/lib/types";

const NAVY = rgb(0.004, 0.133, 0.412); // #012269
const RED = rgb(0.894, 0.008, 0.161); // #e40229
const GRAY = rgb(0.42, 0.45, 0.5);
const LIGHT_GRAY = rgb(0.94, 0.95, 0.96);
const BORDER = rgb(0.85, 0.86, 0.88);
const BLACK = rgb(0.1, 0.1, 0.12);
const WHITE = rgb(1, 1, 1);

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;

function money(n: number): string {
  return `$${(n ?? 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d?: string | null): string {
  if (!d) return "";
  const date = new Date(d + (d.length === 10 ? "T00:00:00" : ""));
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
  draft: "DRAFT",
  sent: "SENT",
  paid: "PAID",
  overdue: "OVERDUE",
  cancelled: "CANCELLED",
};

const STATUS_COLOR: Record<string, ReturnType<typeof rgb>> = {
  draft: GRAY,
  sent: rgb(0.12, 0.4, 0.85),
  paid: rgb(0.086, 0.46, 0.196),
  overdue: RED,
  cancelled: rgb(0.55, 0.09, 0.22),
};

/**
 * InvoicePdfService
 *
 * Renders a real, vector-drawn PDF (via pdf-lib) for an invoice, laid out to
 * mirror a Zoho Invoice template: branded header, bill-to + invoice meta
 * block, an item table (Qty / Rate / Discount / Tax / Amount), totals, and
 * bank-detail notes. Business name/address/contact/MARN come from
 * Admin > Settings, so the header stays in sync without a code change.
 */
export class InvoicePdfService {
  static async generate(invoice: Invoice, settings: AppSettings): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    const newPageIfNeeded = (needed: number) => {
      if (y - needed < MARGIN + 60) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
    };

    // ---------------------------------------------------------------
    // Header: company + invoice title
    // ---------------------------------------------------------------
    page.drawText(settings.business_name, { x: MARGIN, y: y - 4, size: 20, font: bold, color: NAVY });
    page.drawText(`${settings.tagline}  |  MARN: ${settings.marn_number}`, {
      x: MARGIN,
      y: y - 20,
      size: 8.5,
      font,
      color: GRAY,
    });
    page.drawText(settings.office_address, {
      x: MARGIN,
      y: y - 32,
      size: 8.5,
      font,
      color: GRAY,
    });
    page.drawText(`${settings.contact_email}  |  ${settings.contact_phone}`, {
      x: MARGIN,
      y: y - 44,
      size: 8.5,
      font,
      color: GRAY,
    });

    const invoiceTitleWidth = bold.widthOfTextAtSize("INVOICE", 26);
    page.drawText("INVOICE", {
      x: PAGE_WIDTH - MARGIN - invoiceTitleWidth,
      y: y - 6,
      size: 26,
      font: bold,
      color: NAVY,
    });

    const statusText = STATUS_LABEL[invoice.status] || invoice.status.toUpperCase();
    const statusColor = STATUS_COLOR[invoice.status] || GRAY;
    const statusWidth = bold.widthOfTextAtSize(statusText, 11);
    const badgeX = PAGE_WIDTH - MARGIN - statusWidth - 16;
    const badgeY = y - 30;
    page.drawRectangle({
      x: badgeX,
      y: badgeY - 4,
      width: statusWidth + 16,
      height: 18,
      color: statusColor,
    });
    page.drawText(statusText, { x: badgeX + 8, y: badgeY, size: 11, font: bold, color: WHITE });

    y -= 68;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 1.5,
      color: NAVY,
    });
    y -= 26;

    // ---------------------------------------------------------------
    // Bill To  /  Invoice meta (two columns)
    // ---------------------------------------------------------------
    const colGap = 20;
    const leftColW = 300;
    const rightColX = MARGIN + leftColW + colGap;

    page.drawText("BILL TO", { x: MARGIN, y, size: 9, font: bold, color: GRAY });
    let leftY = y - 16;
    page.drawText(invoice.bill_to_name, { x: MARGIN, y: leftY, size: 12, font: bold, color: BLACK });
    leftY -= 15;
    page.drawText(invoice.bill_to_email, { x: MARGIN, y: leftY, size: 9.5, font, color: GRAY });
    if (invoice.bill_to_phone) {
      leftY -= 13;
      page.drawText(invoice.bill_to_phone, { x: MARGIN, y: leftY, size: 9.5, font, color: GRAY });
    }
    if (invoice.bill_to_address) {
      leftY -= 13;
      page.drawText(invoice.bill_to_address, { x: MARGIN, y: leftY, size: 9.5, font, color: GRAY });
    }

    const metaRows: [string, string][] = [
      ["Invoice #", invoice.invoice_number],
      ["Invoice Date", formatDate(invoice.invoice_date)],
      ["Terms", invoice.terms || "Due on Receipt"],
      ["Due Date", formatDate(invoice.due_date)],
    ];
    let rightY = y - 4;
    for (const [label, value] of metaRows) {
      page.drawText(label, { x: rightColX, y: rightY, size: 9.5, font, color: GRAY });
      const valW = bold.widthOfTextAtSize(value, 10);
      page.drawText(value, {
        x: PAGE_WIDTH - MARGIN - valW,
        y: rightY,
        size: 10,
        font: bold,
        color: BLACK,
      });
      rightY -= 16;
    }

    y = Math.min(leftY, rightY) - 24;

    // ---------------------------------------------------------------
    // Item table
    // ---------------------------------------------------------------
    const tableX = MARGIN;
    const tableW = PAGE_WIDTH - MARGIN * 2;
    const cols = [
      { key: "item", label: "ITEM & DESCRIPTION", w: tableW * 0.36, align: "left" as const },
      { key: "qty", label: "QTY", w: tableW * 0.09, align: "right" as const },
      { key: "rate", label: "RATE", w: tableW * 0.15, align: "right" as const },
      { key: "disc", label: "DISCOUNT", w: tableW * 0.12, align: "right" as const },
      { key: "tax", label: "TAX", w: tableW * 0.1, align: "right" as const },
      { key: "amount", label: "AMOUNT", w: tableW * 0.18, align: "right" as const },
    ];

    const drawTableHeader = () => {
      page.drawRectangle({ x: tableX, y: y - 22, width: tableW, height: 22, color: NAVY });
      let cx = tableX;
      for (const col of cols) {
        const textW = bold.widthOfTextAtSize(col.label, 8);
        const tx = col.align === "left" ? cx + 8 : cx + col.w - textW - 8;
        page.drawText(col.label, { x: tx, y: y - 15, size: 8, font: bold, color: WHITE });
        cx += col.w;
      }
      y -= 22;
    };

    drawTableHeader();

    const lineItems = invoice.line_items || [];
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      newPageIfNeeded(60);
      if (y === PAGE_HEIGHT - MARGIN) drawTableHeader(); // re-draw header on new page

      const rowLines = [item.item_name];
      if (item.description) rowLines.push(item.description);
      const rowH = 14 + (rowLines.length - 1) * 11 + 10;

      if (i % 2 === 1) {
        page.drawRectangle({ x: tableX, y: y - rowH, width: tableW, height: rowH, color: LIGHT_GRAY });
      }

      let cx = tableX;
      // Item name + description (left column)
      page.drawText(item.item_name, { x: cx + 8, y: y - 15, size: 9.5, font: bold, color: BLACK });
      if (item.description) {
        page.drawText(item.description, { x: cx + 8, y: y - 27, size: 8, font, color: GRAY });
      }
      cx += cols[0].w;

      const values = [
        item.quantity.toFixed(2),
        money(item.rate),
        item.discount_percent ? `${item.discount_percent}%` : "-",
        item.tax_percent ? `${item.tax_percent}%` : "-",
        money(item.amount),
      ];
      for (let c = 1; c < cols.length; c++) {
        const col = cols[c];
        const val = values[c - 1];
        const textW = font.widthOfTextAtSize(val, 9.5);
        page.drawText(val, {
          x: cx + col.w - textW - 8,
          y: y - 15,
          size: 9.5,
          font: c === cols.length - 1 ? bold : font,
          color: BLACK,
        });
        cx += col.w;
      }

      page.drawLine({
        start: { x: tableX, y: y - rowH },
        end: { x: tableX + tableW, y: y - rowH },
        thickness: 0.5,
        color: BORDER,
      });

      y -= rowH;
    }

    y -= 14;
    newPageIfNeeded(140);

    // ---------------------------------------------------------------
    // Totals block (right aligned)
    // ---------------------------------------------------------------
    const totalsW = 220;
    const totalsX = PAGE_WIDTH - MARGIN - totalsW;
    const totalsRows: [string, string, boolean][] = [
      ["Subtotal", money(invoice.subtotal), false],
      ...(invoice.discount_total ? ([["Discount", `- ${money(invoice.discount_total)}`, false]] as [string, string, boolean][]) : []),
      ...(invoice.tax_total ? ([["Tax", money(invoice.tax_total), false]] as [string, string, boolean][]) : []),
      ["Total", money(invoice.total), true],
      ["Amount Paid", money(invoice.amount_paid), false],
      ["Balance Due", money(invoice.balance_due), true],
    ];

    for (const [label, value, emphasize] of totalsRows) {
      if (emphasize) {
        page.drawLine({
          start: { x: totalsX, y: y + 4 },
          end: { x: PAGE_WIDTH - MARGIN, y: y + 4 },
          thickness: 0.75,
          color: BORDER,
        });
      }
      const f = emphasize ? bold : font;
      const size = emphasize ? 11.5 : 10;
      page.drawText(label, { x: totalsX, y, size, font: f, color: emphasize ? NAVY : GRAY });
      const valW = f.widthOfTextAtSize(value, size);
      page.drawText(value, {
        x: PAGE_WIDTH - MARGIN - valW,
        y,
        size,
        font: f,
        color: emphasize ? NAVY : BLACK,
      });
      y -= emphasize ? 22 : 17;
    }

    y -= 20;
    newPageIfNeeded(100);

    // ---------------------------------------------------------------
    // Notes / bank details
    // ---------------------------------------------------------------
    if (invoice.notes) {
      page.drawText("NOTES", { x: MARGIN, y, size: 9, font: bold, color: GRAY });
      y -= 15;
      const noteLines = invoice.notes.split("\n");
      for (const line of noteLines) {
        page.drawText(line, { x: MARGIN, y, size: 9.5, font, color: BLACK });
        y -= 13;
      }
    }

    // ---------------------------------------------------------------
    // Footer
    // ---------------------------------------------------------------
    const footerY = MARGIN - 10 + 20;
    page.drawLine({
      start: { x: MARGIN, y: footerY + 14 },
      end: { x: PAGE_WIDTH - MARGIN, y: footerY + 14 },
      thickness: 0.5,
      color: BORDER,
    });
    const websiteLabel = settings.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const footerText = `Thank you for choosing ${settings.business_name}  |  ${websiteLabel}`;
    const footerW = font.widthOfTextAtSize(footerText, 8.5);
    page.drawText(footerText, {
      x: (PAGE_WIDTH - footerW) / 2,
      y: footerY,
      size: 8.5,
      font,
      color: GRAY,
    });

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }
}
