import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createGeneratedInvoice } from "@/lib/invoice/service";
import { invoiceInputSchema } from "@/lib/invoice/validation";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().toLowerCase();
  const mode = url.searchParams.get("mode")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const date = url.searchParams.get("date")?.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (session.role === "ADMIN") where.createdById = session.id;

  if (query) {
    where.OR = [
      { invoiceNumber: { contains: query } },
      { clientNameSnapshot: { contains: query } },
      { clientCompanyNameSnapshot: { contains: query } },
    ];
  }
  if (mode) where.mode = mode;
  if (status) where.status = status;
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    where.invoiceDate = { gte: start, lte: end };
  }

  const items = await prisma.invoice.findMany({
    where,
    include: { items: true, createdBy: { select: { displayName: true, userId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items, total: items.length });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Only Admin accounts can create invoices." }, { status: 403 });

  try {
    const body = await request.json();
    const { checklistPhotos, ...invoiceBody } = body;
    const parsed = invoiceInputSchema.safeParse(invoiceBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid invoice data.", details: parsed.error.flatten() }, { status: 400 });
    }

    const invoice = await createGeneratedInvoice(parsed.data, session, checklistPhotos);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create invoice." }, { status: 500 });
  }
}
