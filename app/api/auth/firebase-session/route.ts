import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/auth";
import { resolveFirebaseRole, verifyFirebaseIdToken } from "@/lib/firebase-token";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Firebase ID token is required." }, { status: 401 });

  try {
    const firebaseUser = await verifyFirebaseIdToken(token);
    const role = resolveFirebaseRole(firebaseUser);
    const email = firebaseUser.email || "";
    const userId = email.includes("@") ? email.split("@")[0] : firebaseUser.user_id;
    await setAdminSession({
      id: firebaseUser.user_id,
      userId,
      displayName: email || userId,
      role,
      provider: "firebase",
    });
    return NextResponse.json({ ok: true, role });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Firebase token verification failed." }, { status: 401 });
  }
}
