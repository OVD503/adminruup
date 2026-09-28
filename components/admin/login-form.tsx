"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithFirebaseUserId } from "@/lib/firebase-auth-client";

export function LoginForm() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId.trim() || !password) {
      toast.error("User ID and password are required.");
      return;
    }
    setLoading(true);

    try {
      // Step 1: Try direct DB login (for Admin accounts created by SuperAdmin)
      const dbResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), password }),
      });

      if (dbResponse.ok) {
        const data = await dbResponse.json();
        toast.success("Signed in successfully.");
        router.push("/admin/dashboard");
        router.refresh();
        return;
      }

      // Step 2: If DB login failed, try Firebase auth (for SuperAdmin)
      try {
        const firebaseSession = await signInWithFirebaseUserId(userId, password);
        const fbResponse = await fetch("/api/auth/firebase-session", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${firebaseSession.idToken}` },
        });
        const fbData = await fbResponse.json().catch(() => ({}));
        if (!fbResponse.ok) throw new Error(fbData.error || "Firebase session could not be verified.");
        toast.success("Signed in successfully.");
        router.push("/admin/dashboard");
        router.refresh();
        return;
      } catch {
        // Both methods failed — show generic error
        throw new Error("Invalid User ID or password.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
      {/* Decorative background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-slate-400/5 blur-3xl" />
      </div>

      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
      >
        {/* Gradient top border accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Welcome Back
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Sign in to Vishwakarma Services Admin Panel
            </p>
          </div>

          {/* Form fields */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">User ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  autoComplete="username"
                  placeholder="Enter your user ID"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Password</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 transition-all duration-200 h-11 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="h-4 w-4" />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>

          {/* Footer hint */}
          <div className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <p className="text-center text-xs text-slate-500 leading-relaxed">
              <span className="text-slate-400 font-medium">SuperAdmin</span> — Firebase connected account
              <br />
              <span className="text-slate-400 font-medium">Admin</span> — Use ID & password provided by SuperAdmin
            </p>
          </div>
        </div>
      </form>
    </main>
  );
}
