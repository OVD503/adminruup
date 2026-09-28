import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const userIdPattern = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const admins = await prisma.adminUser.findMany({
    where: { role: "ADMIN" },
    select: { id: true, userId: true, displayName: true, email: true, isActive: true, createdAt: true, updatedAt: true, _count: { select: { invoices: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: admins });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const body = await request.json().catch(() => ({})) as { userId?: string; displayName?: string; email?: string; password?: string };
  const userId = body.userId?.trim().toLowerCase() || "";
  const displayName = body.displayName?.trim() || "";
  const email = body.email?.trim().toLowerCase() || null;
  if (!userIdPattern.test(userId)) return NextResponse.json({ error: "User ID must be 3-32 characters and use lowercase letters, numbers, dots, hyphens, or underscores." }, { status: 400 });
  if (!displayName) return NextResponse.json({ error: "Admin name is required." }, { status: 400 });
  if (!body.password || body.password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  try {
    const admin = await prisma.adminUser.create({
      data: { userId, displayName, email, passwordHash: await hashPassword(body.password), role: "ADMIN" },
      select: { id: true, userId: true, displayName: true, email: true, isActive: true, createdAt: true },
    });
    return NextResponse.json(admin, { status: 201 });
  } catch {
    return NextResponse.json({ error: "That User ID or email is already in use." }, { status: 409 });
  }
}
