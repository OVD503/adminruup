import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  return NextResponse.json(
    { error: "Password changes are disabled in placeholder mode. Wire this endpoint to your real admin API later." },
    { status: 501 }
  );
}
