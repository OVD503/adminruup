"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SignatureData = {
  signatoryName: string;
  signatureImageUrl: string | null;
};

export function SignatureSettings({ adminId }: { adminId: string }) {
  const [data, setData] = useState<SignatureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admins/${adminId}/signature`);
        if (res.ok) setData(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [adminId]);

  return (
    <main className="erp-shell min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[800px] items-center gap-3 px-6 py-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-950">My Signature</h1>
            <p className="text-sm text-slate-500">
              Authorized signature for your invoices
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[800px] px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
              Authorized Signatory
            </CardTitle>
            <CardDescription>
              This signature is automatically printed on every invoice you
              generate. Only the Super Admin can upload or change your signature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : data?.signatureImageUrl ? (
              <div className="space-y-4">
                {/* Signatory Name */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    Signatory Name
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {data.signatoryName || "Vishwakarma Services"}
                  </p>
                </div>

                {/* Signature Image */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Signature Image
                  </p>
                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <img
                      src={data.signatureImageUrl}
                      alt="Your authorized signature"
                      className="mx-auto h-24 object-contain"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <p className="text-xs text-blue-700">
                    This signature will appear on all invoices you generate.
                    Contact your Super Admin to update it.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ImageOff className="mb-3 h-12 w-12 text-slate-200" />
                <p className="font-medium text-slate-700">
                  No signature assigned
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Ask your Super Admin to upload your authorized signature.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
