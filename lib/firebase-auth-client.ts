"use client";

type FirebaseSignInResponse = {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
  expiresIn: string;
};

type FirebaseErrorResponse = { error?: { message?: string } };

function firebaseApiKey() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || apiKey === "YOUR_FIREBASE_WEB_API_KEY") {
    throw new Error("Firebase Auth is not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY to .env.local.");
  }
  return apiKey;
}

function loginEmail(userId: string) {
  const normalizedUserId = userId.trim().toLowerCase();
  if (normalizedUserId.includes("@")) return normalizedUserId;

  const domain = process.env.NEXT_PUBLIC_FIREBASE_USER_DOMAIN;
  if (!domain || domain === "admins.example.com") {
    throw new Error("Firebase User ID mapping is not configured. Add NEXT_PUBLIC_FIREBASE_USER_DOMAIN to .env.local.");
  }
  return `${normalizedUserId}@${domain}`;
}

export async function signInWithFirebaseUserId(userId: string, password: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail(userId), password, returnSecureToken: true }),
    },
  );

  const data = await response.json().catch(() => ({})) as FirebaseSignInResponse & FirebaseErrorResponse;
  if (!response.ok || !data.idToken) {
    const messages: Record<string, string> = {
      EMAIL_NOT_FOUND: "User ID was not found.",
      INVALID_PASSWORD: "Incorrect password.",
      INVALID_LOGIN_CREDENTIALS: "Invalid User ID or password.",
      USER_DISABLED: "This account has been disabled.",
    };
    throw new Error(messages[data.error?.message || ""] || "Firebase sign-in failed.");
  }

  return data;
}
