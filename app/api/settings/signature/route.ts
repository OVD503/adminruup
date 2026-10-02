import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET — Admin views their own signature (read-only)
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (session.role !== "ADMIN") return NextResponse.json({ error: "Only Admin accounts can view invoice signatures." }, { status: 403 });
  const [setting, adminUser] = await Promise.all([
    prisma.signatureSetting.findUnique({ where: { adminUserId: session.id } }),
    prisma.adminUser.findUnique({ where: { id: session.id }, select: { displayName: true } }),
  ]);

  return NextResponse.json({
    signatoryName: setting?.signatoryName || adminUser?.displayName || "",
    signatureImageUrl: setting?.signatureImageUrl || null,
  });
}

// POST — Disabled. Signatures are now managed by SuperAdmin only.
export async function POST() {
  return NextResponse.json(
    { error: "Signature uploads are managed by the Super Admin. Contact your Super Admin to update your signature." },
    { status: 403 },
  );
}
