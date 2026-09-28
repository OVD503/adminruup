import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { displayName?: string; email?: string; password?: string; isActive?: boolean };
  const displayName = body.displayName?.trim();
  if (!displayName) return NextResponse.json({ error: "Admin name is required." }, { status: 400 });
  if (body.password !== undefined && body.password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const existing = await prisma.adminUser.findFirst({ where: { id, role: "ADMIN" } });
  if (!existing) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });

  try {
    const admin = await prisma.adminUser.update({
      where: { id },
      data: {
        displayName,
        email: body.email?.trim().toLowerCase() || null,
        isActive: body.isActive ?? true,
        ...(body.password ? { passwordHash: await hashPassword(body.password) } : {}),
      },
      select: { id: true, userId: true, displayName: true, email: true, isActive: true, createdAt: true, updatedAt: true, _count: { select: { invoices: true } } },
    });
    return NextResponse.json(admin);
  } catch {
    return NextResponse.json({ error: "Admin account could not be updated." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const { id } = await params;
  const admin = await prisma.adminUser.findFirst({ where: { id, role: "ADMIN" }, include: { _count: { select: { invoices: true } } } });
  if (!admin) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
  if (admin._count.invoices > 0) return NextResponse.json({ error: "This Admin has invoices and cannot be deleted. Deactivate the account instead." }, { status: 409 });

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
