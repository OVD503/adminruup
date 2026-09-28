import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const scope = session.role === "ADMIN" ? { createdById: session.id } : {};
  const [totalInvoices, generatedInvoices, amountAgg] = await Promise.all([
    prisma.invoice.count({ where: scope }),
    prisma.invoice.count({ where: { ...scope, status: "GENERATED" } }),
    prisma.invoice.aggregate({ where: scope, _sum: { totalAmount: true } }),
  ]);

  return NextResponse.json({
    totalInvoices,
    generatedInvoices,
    totalAmount: amountAgg._sum.totalAmount ?? 0,
  });
}
