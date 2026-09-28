"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/admin/invoices/signature-pad";

export function SignatureSettings() {
  const [signatoryName, setSignatoryName] = useState("Vishwakarma Services");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/settings/signature");
      const data = await response.json();
      if (response.ok) {
        setSignatoryName(data.signatoryName || "Vishwakarma Services");
        setSignatureDataUrl(data.signatureDataUrl || null);
      }
    }
    void loadSettings();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatoryName, signatureDataUrl })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save signature.");
      toast.success("Invoice signature saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save signature.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="erp-shell min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1000px] items-center gap-3 px-6 py-4">
          <Link href="/admin/invoices"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Invoices</Button></Link>
          <div>
            <h1 className="text-xl font-black text-slate-950">Admin Settings</h1>
            <p className="text-sm text-slate-500">Invoice Signature</p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1000px] px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authorized Signatory</CardTitle>
            <CardDescription>This signature is automatically included on future generated invoice PDFs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Authorized Signatory Name</Label>
              <Input value={signatoryName} onChange={(event) => setSignatoryName(event.target.value)} />
            </div>
            <SignaturePad label="Authorized Signature" value={signatureDataUrl} onChange={setSignatureDataUrl} />
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Signature
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
