import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/admins/with-signatures — returns all admin users with signature data
// Accessible by both ADMIN and SUPER_ADMIN so the invoice form can populate the engineer dropdown.
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admins = await prisma.adminUser.findMany({
    where: { 
      role: "ADMIN", 
      isActive: true,
      signatureSettings: { some: { isCalibrationEngineer: true } }
    },
    select: {
      id: true,
      userId: true,
      displayName: true,
      signatureSettings: {
        select: {
          signatoryName: true,
          signatureImageUrl: true,
          designation: true,
        },
      },
    },
    orderBy: { displayName: "asc" },
  });

  const items = admins.map((admin) => {
    const sig = admin.signatureSettings[0] ?? null;
    return {
      id: admin.id,
      userId: admin.userId,
      displayName: admin.displayName,
      signatoryName: sig?.signatoryName || admin.displayName,
      signatureImageUrl: sig?.signatureImageUrl || null,
      designation: sig?.designation || "Calibration & Testing Engineer",
    };
  });

  return NextResponse.json({ items });
}
