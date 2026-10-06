import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const number = url.searchParams.get("number")?.trim();

  if (!number) {
    return NextResponse.json({ exists: false });
  }

  const existing = await prisma.invoice.findUnique({
    where: { invoiceNumber: number },
    select: { id: true },
  });

  return NextResponse.json({ exists: !!existing });
}
