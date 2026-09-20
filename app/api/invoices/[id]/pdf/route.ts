import { NextRequest, NextResponse } from "next/server";
import { createClientForAction, supabaseServer } from "@/lib/supabase-server";
import { InvoiceService } from "@/lib/services/invoice.service";
import { InvoicePdfService } from "@/lib/services/invoicePdf.service";
import { SettingsService } from "@/lib/services/settings.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Admin-only: verify the requester's session against the admins table.
  // getSession() reads the signed JWT from the cookie directly (no round
  // trip to the Supabase Auth server) — the admins-table lookup right below
  // is the real authorization check.
  const supabase = await createClientForAction();
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: admin } = await supabaseServer.from("admins").select("id").eq("id", session.user.id).maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Fetch the invoice + settings once each (InvoiceService.generatePdf
    // would otherwise re-fetch the same invoice a second time).
    const [invoice, settings] = await Promise.all([
      InvoiceService.getInvoiceById(id),
      SettingsService.getSettings(),
    ]);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const pdfBuffer = await InvoicePdfService.generate(invoice, settings);
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${invoice.invoice_number}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Invoice PDF route error:", e);
    return NextResponse.json({ error: "Failed to generate invoice PDF" }, { status: 500 });
  }
}
