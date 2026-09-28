import { NextResponse } from "next/server";
import { authenticateAdmin, setAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { userId, password } = (await request.json().catch(() => ({}))) as { userId?: string; password?: string };

  if (!userId || !password) {
    return NextResponse.json({ error: "User ID and password are required." }, { status: 400 });
  }

  try {
    const account = await authenticateAdmin(userId, password);
    if (!account) {
      return NextResponse.json({ error: "Invalid User ID or password." }, { status: 401 });
    }

    await setAdminSession({ id: account.id, userId: account.userId, displayName: account.displayName, role: account.role as "SUPER_ADMIN" | "ADMIN" });
    return NextResponse.json({ ok: true, role: account.role });
  } catch (error) {
    console.error("Admin login database error:", error);
    return NextResponse.json(
      { error: "The database is unavailable. Check DATABASE_URL and confirm the Neon database is active, then try again." },
      { status: 503 },
    );
  }
}
