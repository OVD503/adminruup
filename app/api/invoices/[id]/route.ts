import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";
import { buildInvoiceStorageKey } from "@/lib/invoice/calculations";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  if (session.role === "ADMIN" && invoice.createdById !== session.id) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

  return NextResponse.json(invoice);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    if (session.role !== "ADMIN" || existing.createdById !== session.id) return NextResponse.json({ error: "Only the generating Admin can delete this invoice." }, { status: 403 });

    if (existing.pdfUrl) {
      await deleteFromR2(buildInvoiceStorageKey(existing.invoiceNumber, existing.invoiceDate));
    }

    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Invoice deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: "Could not delete invoice." }, { status: 500 });
  }
}
