"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FilePlus2, FileText, LayoutDashboard, LogOut, PenLine, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import type { AdminSession } from "@/lib/auth";

export function Sidebar({ session }: { session: AdminSession | null }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out.");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-xs">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 border border-slate-200 shadow-xs">
          <img
            src="/images/logo.png"
            alt="Vishwakarma Services Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold tracking-tight text-slate-900 text-sm truncate leading-snug">
            Vishwakarma Services
          </span>
          <span className="text-[10px] font-semibold text-slate-500">
            ERP v1.0
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        <nav className="space-y-1">
          {(session?.role === "SUPER_ADMIN" ? [
            { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
            { name: "Admin Accounts", href: "/admin/admins", icon: Users },
            { name: "Signatures", href: "/admin/signatures", icon: PenLine },
            { name: "Invoice Activity", href: "/admin/invoices", icon: FileText },
          ] : [
            { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
            { name: "My Invoices", href: "/admin/invoices", icon: FileText },
            { name: "Create Invoice", href: "/admin/invoices/new", icon: FilePlus2 },
            { name: "Signature", href: "/admin/settings", icon: Settings },
          ]).map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive
                    ? "bg-slate-900 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-700">{session?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{session?.userId}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-slate-600 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
