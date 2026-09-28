import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signatureSettingInputSchema } from "@/lib/invoice/validation";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (session.role !== "ADMIN") return NextResponse.json({ error: "Only Admin accounts can manage invoice signatures." }, { status: 403 });
  const setting = await prisma.signatureSetting.findUnique({ where: { adminUserId: session.id } });

  return NextResponse.json(setting ?? { signatoryName: "Vishwakarma Services", signatureDataUrl: "" });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Only Admin accounts can manage invoice signatures." }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = signatureSettingInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid signature settings.", details: parsed.error.flatten() }, { status: 400 });
    }

    const setting = await prisma.signatureSetting.upsert({
      where: { adminUserId: session.id },
      create: {
        adminUserId: session.id,
        signatoryName: parsed.data.signatoryName,
        signatureDataUrl: parsed.data.signatureDataUrl,
      },
      update: {
        signatoryName: parsed.data.signatoryName,
        signatureDataUrl: parsed.data.signatureDataUrl,
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Signature save error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save signature." }, { status: 500 });
  }
}
