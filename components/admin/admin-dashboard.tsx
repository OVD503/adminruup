"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FilePlus2, LogOut, ReceiptText, Settings, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Stats = {
  totalInvoices: number;
  generatedInvoices: number;
  totalAmount: number;
};

export function AdminDashboard({ role, displayName }: { role: "SUPER_ADMIN" | "ADMIN"; displayName: string }) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ totalInvoices: 0, generatedInvoices: 0, totalAmount: 0 });

  useEffect(() => {
    async function loadStats() {
      const response = await fetch("/api/stats");
      if (response.ok) setStats(await response.json());
    }
    void loadStats();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out.");
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className="erp-shell min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-black tracking-tight text-slate-950 text-lg">{isSuperAdmin ? "Administration Console" : "Premium Invoice Generator"}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{isSuperAdmin ? "Super Admin" : "Admin"}: {displayName}</Badge>
            <Button variant="ghost" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] space-y-8 px-6 py-8">
        <section className="flex flex-col justify-between gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-soft md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{isSuperAdmin ? "Workspace Overview" : "Invoice Generator"}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{isSuperAdmin ? "MANAGE ADMINS" : "CREATE INVOICE"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {isSuperAdmin ? "Manage Admin accounts and monitor every invoice generated across the workspace." : "Use predefined services, capture signatures, calculate GST, and generate print-ready PDFs."}
            </p>
          </div>
          <div className="flex gap-2">
            {isSuperAdmin ? <Link href="/admin/admins">
              <Button size="lg">
                <Users className="h-4 w-4" />
                Manage Admins
              </Button>
            </Link> : <Link href="/admin/invoices/new">
              <Button size="lg"><FilePlus2 className="h-4 w-4" />New Invoice</Button>
            </Link>}
            {!isSuperAdmin ? <Link href="/admin/settings">
              <Button size="lg" variant="outline">
                <Settings className="h-4 w-4" />
                Signature
              </Button>
            </Link> : null}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Metric title="Total Invoices" value={stats.totalInvoices.toString()} />
          <Metric title="Generated PDFs" value={stats.generatedInvoices.toString()} />
          <Metric title="Billed Value" value={stats.totalAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })} />
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Link href="/admin/invoices">
            <Card className="transition hover:-translate-y-0.5 hover:border-slate-300">
              <CardHeader>
                <CardTitle>Invoice Register</CardTitle>
                <CardDescription>Search, filter, open PDFs, download files, and copy storage links.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Open invoices</Button>
              </CardContent>
            </Card>
          </Link>
          {isSuperAdmin ? <Link href="/admin/admins">
            <Card className="transition hover:-translate-y-0.5 hover:border-slate-300">
              <CardHeader>
                <CardTitle>Admin Accounts</CardTitle>
                <CardDescription>Create, edit, deactivate, or remove invoice-generating Admin accounts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Manage Admins</Button>
              </CardContent>
            </Card>
          </Link> : <Link href="/admin/invoices/new">
            <Card className="transition hover:-translate-y-0.5 hover:border-slate-300"><CardHeader><CardTitle>Generate Invoice</CardTitle><CardDescription>Create a new invoice with customer details entered directly.</CardDescription></CardHeader><CardContent><Button>Create invoice</Button></CardContent></Card>
          </Link>}
        </section>
      </div>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
        </div>
        <div className="rounded-md bg-slate-100 p-3 text-slate-700">
          <TrendingUp className="h-5 w-5" />
        </div>
      </CardHeader>
    </Card>
  );
}
