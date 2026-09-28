"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithFirebaseUserId } from "@/lib/firebase-auth-client";

export function LoginForm() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const firebaseSession = await signInWithFirebaseUserId(userId, password);
      const response = await fetch("/api/auth/firebase-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${firebaseSession.idToken}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Firebase session could not be verified.");
      toast.success("Signed in successfully.");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="erp-shell flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1 border border-slate-200">
            <img src="/images/logo.png" alt="Vishwakarma Services Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">Vishwakarma Services Admin</h1>
            <p className="text-sm text-slate-500">Invoice generator control panel</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>User ID</Label>
            <Input autoComplete="username" value={userId} onChange={(event) => setUserId(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <Button className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            Sign in
          </Button>
        </div>
      </form>
    </main>
  );
}
