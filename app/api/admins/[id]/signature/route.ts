import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";

// GET /api/admins/[id]/signature — get signature for an admin
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  // Admin can view their own signature; SuperAdmin can view any admin's signature
  if (session.role === "ADMIN" && session.id !== id) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const [setting, adminUser] = await Promise.all([
    prisma.signatureSetting.findUnique({ where: { adminUserId: id } }),
    prisma.adminUser.findUnique({ where: { id }, select: { displayName: true } }),
  ]);

  return NextResponse.json({
    signatoryName: setting?.signatoryName || adminUser?.displayName || "",
    signatureImageUrl: setting?.signatureImageUrl || null,
  });
}

// POST /api/admins/[id]/signature — SuperAdmin uploads signature PNG for an admin
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const { id } = await params;

  // Verify the admin exists
  const admin = await prisma.adminUser.findFirst({ where: { id, role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });

  try {
    const formData = await request.formData();
    const file = formData.get("signature") as File | null;
    const signatoryName = (formData.get("signatoryName") as string)?.trim() || admin.displayName;

    if (!file || !file.size) {
      return NextResponse.json({ error: "Signature image file is required." }, { status: 400 });
    }

    // Validate file type
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      return NextResponse.json({ error: "Only PNG or JPEG images are allowed." }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 2MB." }, { status: 400 });
    }

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.type === "image/png" ? "png" : "jpg";
    const r2Key = `signatures/${admin.userId}-${Date.now()}.${extension}`;
    const signatureImageUrl = await uploadToR2(buffer, r2Key, file.type);

    // Delete old signature from R2 if exists
    const existing = await prisma.signatureSetting.findUnique({ where: { adminUserId: id } });
    if (existing?.signatureImageUrl) {
      try {
        const oldKey = new URL(existing.signatureImageUrl).pathname.slice(1);
        await deleteFromR2(oldKey);
      } catch {
        // Ignore R2 deletion errors for old files
      }
    }

    // Upsert signature setting
    const setting = await prisma.signatureSetting.upsert({
      where: { adminUserId: id },
      create: {
        adminUserId: id,
        signatoryName,
        signatureImageUrl,
      },
      update: {
        signatoryName,
        signatureImageUrl,
      },
    });

    return NextResponse.json({
      signatoryName: setting.signatoryName,
      signatureImageUrl: setting.signatureImageUrl,
    });
  } catch (error) {
    console.error("Signature upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload signature." },
      { status: 500 },
    );
  }
}

// PATCH /api/admins/[id]/signature — SuperAdmin updates only the signatory name
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const { id } = await params;

  const admin = await prisma.adminUser.findFirst({ where: { id, role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });

  try {
    const body = await request.json() as { signatoryName?: string };
    const signatoryName = body.signatoryName?.trim();
    if (!signatoryName) return NextResponse.json({ error: "signatoryName is required." }, { status: 400 });

    const setting = await prisma.signatureSetting.upsert({
      where: { adminUserId: id },
      create: { adminUserId: id, signatoryName, signatureImageUrl: null },
      update: { signatoryName },
    });

    return NextResponse.json({
      signatoryName: setting.signatoryName,
      signatureImageUrl: setting.signatureImageUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update name." },
      { status: 500 },
    );
  }
}


export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const { id } = await params;

  const setting = await prisma.signatureSetting.findUnique({ where: { adminUserId: id } });
  if (!setting) return NextResponse.json({ ok: true });

  // Delete from R2
  if (setting.signatureImageUrl) {
    try {
      const r2Key = new URL(setting.signatureImageUrl).pathname.slice(1);
      await deleteFromR2(r2Key);
    } catch {
      // Ignore R2 deletion errors
    }
  }

  await prisma.signatureSetting.delete({ where: { adminUserId: id } });

  return NextResponse.json({ ok: true });
}
