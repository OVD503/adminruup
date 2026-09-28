"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Download, ExternalLink, FilePlus2, Home, Loader2, Search, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Invoice = {
  id: string;
  invoiceNumber: string;
  clientNameSnapshot: string;
  clientCompanyNameSnapshot: string | null;
  invoiceDate: string;
  totalAmount: string | number;
  mode: "AUTO" | "MANUAL";
  status: "DRAFT" | "GENERATED" | "CANCELLED";
  pdfUrl: string | null;
  createdBy?: { displayName: string; userId: string };
};

function money(value: string | number) {
  return Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

export function InvoiceList({ role }: { role: "SUPER_ADMIN" | "ADMIN" }) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");

  async function loadInvoices() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (date) params.set("date", date);

    try {
      const response = await fetch(`/api/invoices?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load invoices.");
      setInvoices(data.items || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInvoices();
  }, []);

  async function copyUrl(url: string | null) {
    if (!url) return toast.error("This invoice does not have a PDF URL yet.");
    await navigator.clipboard.writeText(url);
    toast.success("PDF link copied.");
  }

  async function deleteInvoice(id: string, invoiceNumber: string) {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) return;
    try {
      const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete invoice.");
      toast.success(`Invoice ${invoiceNumber} deleted.`);
      setInvoices((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete invoice.");
    }
  }

  return (
    <main className="erp-shell min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5 font-medium text-slate-700">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950">Invoice Register</h1>
              <p className="text-xs sm:text-sm text-slate-500">{isSuperAdmin ? "All invoices and their generating Admin." : "Search, filter, open, download, copy PDF links, or delete your invoices."}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            {!isSuperAdmin ? <Link href="/admin/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Signature
              </Button>
            </Link> : null}
            {!isSuperAdmin ? <Link href="/admin/invoices/new">
              <Button size="sm">
                <FilePlus2 className="h-4 w-4" />
                Create New Invoice
              </Button>
            </Link> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] space-y-4 sm:space-y-5 px-4 py-5 sm:px-6 sm:py-8">
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 shadow-soft grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_160px_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Invoice number or client" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="GENERATED">Generated</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Button onClick={loadInvoices} className="w-full sm:w-auto">Search</Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice No.</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                {isSuperAdmin ? <th className="px-4 py-3">Generated by</th> : null}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={isSuperAdmin ? 7 : 6} className="px-4 py-12 text-center text-slate-500"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={isSuperAdmin ? 7 : 6} className="px-4 py-12 text-center text-slate-500">No invoices found.</td></tr>
              ) : invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{invoice.clientCompanyNameSnapshot || invoice.clientNameSnapshot}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{money(invoice.totalAmount)}</td>
                  <td className="px-4 py-3"><Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{invoice.status}</Badge></td>
                  {isSuperAdmin ? <td className="px-4 py-3 text-slate-700"><p>{invoice.createdBy?.displayName || "Legacy invoice"}</p><p className="font-mono text-xs text-slate-400">{invoice.createdBy?.userId || "Unassigned"}</p></td> : null}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {invoice.pdfUrl ? (
                        <>
                          <a href={invoice.pdfUrl} target="_blank" rel="noreferrer"><Button size="icon" variant="ghost" title="Open PDF"><ExternalLink className="h-4 w-4" /></Button></a>
                          <a href={invoice.pdfUrl} download><Button size="icon" variant="ghost" title="Download PDF"><Download className="h-4 w-4" /></Button></a>
                        </>
                      ) : null}
                      <Button size="icon" variant="ghost" title="Copy PDF URL" onClick={() => copyUrl(invoice.pdfUrl)}><Copy className="h-4 w-4" /></Button>
                      {!isSuperAdmin ? <Button size="icon" variant="ghost" title="Delete Invoice" className="text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => deleteInvoice(invoice.id, invoice.invoiceNumber)}>
                        <Trash2 className="h-4 w-4" />
                      </Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
