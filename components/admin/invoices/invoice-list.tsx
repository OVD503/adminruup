"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Download, ExternalLink, FilePlus2, Home, Loader2, Search, Send, Settings, Trash2 } from "lucide-react";
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

function formatInvoiceDate(value: string | Date) {
  if (!value) return "-";
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function InvoiceList({ role }: { role: "SUPER_ADMIN" | "ADMIN" }) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // WhatsApp modal state
  const [waInvoice, setWaInvoice] = useState<Invoice | null>(null);
  const [waMobile, setWaMobile] = useState("");
  const [waMobileError, setWaMobileError] = useState("");

  async function loadInvoices() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);

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

  function openWaModal(invoice: Invoice) {
    setWaInvoice(invoice);
    setWaMobile("");
    setWaMobileError("");
  }

  function sendViaWhatsApp() {
    if (!waMobile || waMobile.length !== 10) {
      setWaMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }
    const msg = `Dear Customer, please find your invoice ${waInvoice?.invoiceNumber} from Vishwakarma Services attached below.\n\n📄 Invoice: ${waInvoice?.pdfUrl}\n\nThank you for choosing our services. For any queries or assistance, please feel free to contact us.`;
    const waUrl = `https://wa.me/91${waMobile}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
    setWaInvoice(null);
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
              <p className="text-xs sm:text-sm text-slate-500">{isSuperAdmin ? "All invoices and their generating Admin." : "Search, open, download, send or delete your invoices."}</p>
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
        {/* Search — invoice number only */}
        <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 shadow-soft">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Invoice number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadInvoices()}
            />
          </div>
          <Button onClick={loadInvoices} className="shrink-0">Search</Button>
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
                  <td className="px-4 py-3 text-slate-500">{formatInvoiceDate(invoice.invoiceDate)}</td>
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
                      {/* Send to Customer via WhatsApp */}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Send to Customer"
                        className="text-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => openWaModal(invoice)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
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

      {/* WhatsApp Send Modal */}
      {waInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Send Invoice to Customer</h2>
                <p className="text-xs text-slate-500">via WhatsApp — {waInvoice.invoiceNumber}</p>
              </div>
              <button
                className="ml-auto text-slate-400 hover:text-slate-700 text-xl font-bold leading-none"
                onClick={() => setWaInvoice(null)}
              >✕</button>
            </div>

            {/* Invoice info */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700 space-y-1">
              <p><span className="font-semibold">Invoice:</span> {waInvoice.invoiceNumber}</p>
              <p><span className="font-semibold">Client:</span> {waInvoice.clientCompanyNameSnapshot || waInvoice.clientNameSnapshot}</p>
              {waInvoice.pdfUrl
                ? <p className="truncate text-xs text-slate-400">{waInvoice.pdfUrl}</p>
                : <p className="text-xs text-red-500">No PDF generated for this invoice yet.</p>}
            </div>

            {/* Mobile input */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Customer WhatsApp Number</label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-600 font-medium">+91</span>
                <Input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={waMobile}
                  onChange={(e) => {
                    setWaMobile(e.target.value.replace(/\D/g, ""));
                    setWaMobileError("");
                  }}
                  className="flex-1"
                />
              </div>
              {waMobileError && <p className="text-xs text-red-600">{waMobileError}</p>}
            </div>

            {/* Message preview */}
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-xs text-slate-700 space-y-1 leading-relaxed">
              <p className="font-semibold text-green-800 mb-1">Message Preview:</p>
              <p>Dear Customer, please find your invoice {waInvoice.invoiceNumber} from Vishwakarma Services attached below.</p>
              <p>📄 Invoice: <span className="break-all text-slate-500">{waInvoice.pdfUrl}</span></p>
              <p>Thank you for choosing our services. For any queries or assistance, please feel free to contact us.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setWaInvoice(null)}>Cancel</Button>
              <Button
                type="button"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={!waInvoice.pdfUrl}
                onClick={sendViaWhatsApp}
              >Send via WhatsApp</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
