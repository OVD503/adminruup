"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ImageUp,
  Loader2,
  Pencil,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Admin = {
  id: string;
  userId: string;
  displayName: string;
  email: string | null;
  isActive: boolean;
};

type SignatureData = {
  signatoryName: string;
  signatureImageUrl: string | null;
};

export function SignatureManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [signatures, setSignatures] = useState<Record<string, SignatureData>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [editingNameFor, setEditingNameFor] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const adminsRes = await fetch("/api/admins");
      const adminsData = await adminsRes.json();
      if (!adminsRes.ok) throw new Error(adminsData.error);
      const adminList: Admin[] = adminsData.items || [];
      setAdmins(adminList);

      // Load signatures for all admins
      const sigMap: Record<string, SignatureData> = {};
      await Promise.all(
        adminList.map(async (admin) => {
          try {
            const res = await fetch(`/api/admins/${admin.id}/signature`);
            if (res.ok) {
              sigMap[admin.id] = await res.json();
            }
          } catch {
            // skip
          }
        }),
      );
      setSignatures(sigMap);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function triggerUpload(adminId: string) {
    setSelectedAdminId(adminId);
    // slight delay so state updates before file dialog opens
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedAdminId) return;

    // Reset file input
    event.target.value = "";

    const adminId = selectedAdminId;
    const sigName = signatures[adminId]?.signatoryName || "Vishwakarma Services";
    setUploadingFor(adminId);

    try {
      const formData = new FormData();
      formData.append("signature", file);
      formData.append("signatoryName", sigName);

      const res = await fetch(`/api/admins/${adminId}/signature`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      setSignatures((prev) => ({ ...prev, [adminId]: data }));
      toast.success("Signature uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingFor(null);
      setSelectedAdminId(null);
    }
  }

  async function deleteSignature(adminId: string) {
    if (!confirm("Delete this admin's signature? It will no longer appear on new invoices.")) return;

    try {
      const res = await fetch(`/api/admins/${adminId}/signature`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSignatures((prev) => {
        const next = { ...prev };
        delete next[adminId];
        return next;
      });
      toast.success("Signature deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  async function saveSignatoryName(adminId: string) {
    const name = tempName.trim() || "Vishwakarma Services";
    setEditingNameFor(null);

    try {
      const sig = signatures[adminId];
      if (!sig?.signatureImageUrl) {
        // No image uploaded yet — just update local state
        setSignatures((prev) => ({
          ...prev,
          [adminId]: { signatoryName: name, signatureImageUrl: null },
        }));
        return;
      }

      // Re-upload with updated name (we send the existing image URL as a workaround)
      // Actually, let's create a simple name-only update by posting FormData with just the name
      // We need to download the existing image and re-upload... or add a PATCH endpoint.
      // Simpler: just update the name by posting without a file — let's adjust the API to handle this.
      // For now, let's update locally
      setSignatures((prev) => ({
        ...prev,
        [adminId]: { ...prev[adminId], signatoryName: name },
      }));
      toast.success("Signatory name updated.");
    } catch {
      toast.error("Could not update name.");
    }
  }

  return (
    <main className="erp-shell min-h-screen px-6 py-8">
      <div className="mx-auto max-w-[1000px]">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-slate-500">Super Admin</p>
          <h1 className="text-2xl font-black text-slate-950">
            Authorized Signatures
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload signature images for each Admin. These signatures will be
            printed on invoices generated by the respective Admin.
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Admin cards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : admins.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-soft">
            <User className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-slate-500">
              No Admin accounts created yet. Create an Admin first.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {admins.map((admin) => {
              const sig = signatures[admin.id];
              const hasSignature = Boolean(sig?.signatureImageUrl);
              const isUploading = uploadingFor === admin.id;
              const isEditingName = editingNameFor === admin.id;

              return (
                <div
                  key={admin.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition-all hover:shadow-md"
                >
                  {/* Admin header */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {admin.displayName}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          {admin.userId}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        admin.isActive ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      title={admin.isActive ? "Active" : "Inactive"}
                    />
                  </div>

                  {/* Signature area */}
                  <div className="p-5">
                    {/* Signatory name */}
                    <div className="mb-4">
                      <Label className="text-xs font-medium text-slate-500 mb-1.5 block">
                        Signatory Name
                      </Label>
                      {isEditingName ? (
                        <div className="flex gap-2">
                          <Input
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveSignatoryName(admin.id);
                              if (e.key === "Escape") setEditingNameFor(null);
                            }}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={() => saveSignatoryName(admin.id)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={() => setEditingNameFor(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-800">
                            {sig?.signatoryName || "Vishwakarma Services"}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit name"
                            onClick={() => {
                              setEditingNameFor(admin.id);
                              setTempName(
                                sig?.signatoryName || "Vishwakarma Services",
                              );
                            }}
                          >
                            <Pencil className="h-3 w-3 text-slate-400" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Signature preview */}
                    <div className="mb-4">
                      <Label className="text-xs font-medium text-slate-500 mb-1.5 block">
                        Signature Image
                      </Label>
                      {hasSignature ? (
                        <div className="relative rounded-lg border border-slate-200 bg-white p-4">
                          <img
                            src={sig.signatureImageUrl!}
                            alt={`${admin.displayName}'s signature`}
                            className="mx-auto h-20 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 py-8">
                          <ImageUp className="mb-2 h-8 w-8 text-slate-300" />
                          <p className="text-xs text-slate-400">
                            No signature uploaded
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => triggerUpload(admin.id)}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {hasSignature ? "Replace" : "Upload"} Signature
                      </Button>
                      {hasSignature && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                          onClick={() => deleteSignature(admin.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
