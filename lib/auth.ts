import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const COOKIE_NAME = "ruup_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function sessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    return "development-session-secret-for-ruup-admin-only";
  }
  return value;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

export type AdminRole = "SUPER_ADMIN" | "ADMIN";

export type AdminSession = {
  id: string;
  userId: string;
  displayName: string;
  role: AdminRole;
  provider?: "firebase";
  exp: number;
};

function encodeSession(session: Omit<AdminSession, "exp">) {
  const payload = Buffer.from(JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
  if (data.exp < Math.floor(Date.now() / 1000)) return null;
  if (!data.id || !data.userId || !data.displayName || !["SUPER_ADMIN", "ADMIN"].includes(data.role)) return null;
  return data;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(COOKIE_NAME)?.value);
  if (!session) return null;
  if (session.provider === "firebase") return session;
  const account = await prisma.adminUser.findUnique({ where: { id: session.id } });
  if (!account || !account.isActive || account.role !== session.role) return null;
  return session;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireRole(role: AdminRole) {
  const session = await requireAdmin();
  if (session.role !== role) redirect("/admin/dashboard");
  return session;
}

export async function requireSuperAdmin() {
  return requireRole("SUPER_ADMIN");
}

export async function setAdminSession(session: Omit<AdminSession, "exp">) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/"
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function authenticateAdmin(userId: string, password: string) {
  const account = await prisma.adminUser.findUnique({ where: { userId: userId.trim().toLowerCase() } });
  if (!account || !account.isActive || !(await verifyPassword(password, account.passwordHash))) return null;
  return account;
}
