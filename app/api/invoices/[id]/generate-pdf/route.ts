import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { generatePdfForInvoice } from "@/lib/invoice/service";
import { prisma } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Only Admin accounts can generate invoices." }, { status: 403 });

  try {
    const { id } = await params;
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing || existing.createdById !== session.id) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    const invoice = await generatePdfForInvoice(id);
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice PDF generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate invoice PDF." },
      { status: 500 }
    );
  }
}
