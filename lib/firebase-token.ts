import { createVerify } from "node:crypto";
import type { AdminRole } from "@/lib/auth";

type TokenHeader = { alg?: string; kid?: string };
type FirebaseToken = {
  aud?: string;
  iss?: string;
  sub?: string;
  user_id?: string;
  email?: string;
  exp?: number;
  iat?: number;
  role?: unknown;
};

let certificateCache: { certificates: Record<string, string>; expiresAt: number } | null = null;

function decodePart<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

async function signingCertificates() {
  if (certificateCache && certificateCache.expiresAt > Date.now()) return certificateCache.certificates;

  const response = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not retrieve Firebase token signing certificates.");
  const certificates = await response.json() as Record<string, string>;
  const maxAge = Number(response.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1] || 3600);
  certificateCache = { certificates, expiresAt: Date.now() + maxAge * 1000 };
  return certificates;
}

export async function verifyFirebaseIdToken(token: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw new Error("Malformed Firebase ID token.");

  const header = decodePart<TokenHeader>(encodedHeader);
  const payload = decodePart<FirebaseToken>(encodedPayload);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Invalid Firebase ID token header.");

  const certificates = await signingCertificates();
  const certificate = certificates[header.kid];
  if (!certificate) throw new Error("Firebase ID token signing key is unavailable.");

  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();
  if (!verifier.verify(certificate, Buffer.from(encodedSignature, "base64url"))) throw new Error("Invalid Firebase ID token signature.");

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const now = Math.floor(Date.now() / 1000);
  if (!projectId || projectId === "your-project-id") throw new Error("Firebase project is not configured.");
  if (payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("Firebase ID token belongs to a different project.");
  if (!payload.sub || payload.sub !== payload.user_id || payload.exp === undefined || payload.iat === undefined || payload.exp <= now || payload.iat > now) throw new Error("Firebase ID token is invalid or expired.");

  return payload as Required<Pick<FirebaseToken, "sub" | "user_id" | "exp" | "iat">> & FirebaseToken;
}

export function resolveFirebaseRole(token: FirebaseToken): AdminRole {
  if (token.role === "SUPER_ADMIN" || token.role === "ADMIN") return token.role;

  const superAdminUid = process.env.FIREBASE_SUPER_ADMIN_UID;
  const superAdminEmail = process.env.FIREBASE_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if ((superAdminUid && token.user_id === superAdminUid) || (superAdminEmail && token.email?.toLowerCase() === superAdminEmail)) return "SUPER_ADMIN";

  throw new Error("This Firebase account has no application role. Set a Firebase custom claim or configure the initial Super Admin UID/email.");
}
