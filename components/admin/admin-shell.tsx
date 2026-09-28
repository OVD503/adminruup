"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import type { AdminSession } from "@/lib/auth";

export function AdminShell({ children, session }: { children: React.ReactNode; session: AdminSession | null }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 antialiased">
      <Sidebar session={session} />
      <div className="pl-0 md:pl-64 min-h-screen">
        {children}
      </div>
    </div>
  );
}
