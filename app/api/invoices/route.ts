import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createGeneratedInvoice } from "@/lib/invoice/service";
import { checklistPhotoInputSchema, invoiceInputSchema } from "@/lib/invoice/validation";

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
    const parts = date.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [year, month, day] = parts;
      const start = new Date(year, month - 1, day, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      where.invoiceDate = { gte: start, lte: end };
    }
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

    const parsedChecklistPhotos = checklistPhotos === undefined
      ? undefined
      : checklistPhotoInputSchema.array().safeParse(checklistPhotos);
    if (parsedChecklistPhotos && !parsedChecklistPhotos.success) {
      return NextResponse.json({ error: "Invalid checklist photo data." }, { status: 400 });
    }

    const invoice = await createGeneratedInvoice(parsed.data, session, parsedChecklistPhotos?.data);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create invoice." }, { status: 500 });
  }
}
