import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().toLowerCase();
  const type = url.searchParams.get("type")?.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (query) {
    where.OR = [
      { name: { contains: query } },
      { description: { contains: query } },
      { hsnCode: { contains: query } },
    ];
  }
  if (type) where.type = type;

  const items = await prisma.productService.findMany({
    where,
    orderBy: { type: "asc" },
  });

  return NextResponse.json({ items });
}
