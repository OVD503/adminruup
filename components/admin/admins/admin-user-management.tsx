"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Admin = { id: string; userId: string; displayName: string; email: string | null; isActive: boolean; createdAt: string; _count: { invoices: number } };
type FormState = { userId: string; displayName: string; email: string; password: string; isActive: boolean };
const emptyForm: FormState = { userId: "", displayName: "", email: "", password: "", isActive: true };

export function AdminUserManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadAdmins() {
    setLoading(true);
    try {
      const response = await fetch("/api/admins");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load Admin accounts.");
      setAdmins(data.items || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Admin accounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAdmins(); }, []);

  function beginCreate() { setEditing(null); setForm(emptyForm); }
  function beginEdit(admin: Admin) {
    setEditing(admin);
    setForm({ userId: admin.userId, displayName: admin.displayName, email: admin.email || "", password: "", isActive: admin.isActive });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/admins/${editing.id}` : "/api/admins", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { displayName: form.displayName, email: form.email, password: form.password || undefined, isActive: form.isActive } : form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save Admin account.");
      toast.success(editing ? "Admin account updated." : "Admin account created.");
      beginCreate();
      await loadAdmins();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save Admin account.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(admin: Admin) {
    if (!confirm(`Delete ${admin.displayName}'s account?`)) return;
    try {
      const response = await fetch(`/api/admins/${admin.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete Admin account.");
      toast.success("Admin account deleted.");
      await loadAdmins();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete Admin account.");
    }
  }

  return (
    <main className="erp-shell min-h-screen px-6 py-8">
      <div className="mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div><p className="text-sm font-semibold text-slate-500">Super Admin</p><h1 className="text-2xl font-black text-slate-950">Admin Accounts</h1><p className="mt-1 text-sm text-slate-500">Create and maintain the people allowed to generate invoices.</p></div>
            <Button onClick={beginCreate}><Plus className="h-4 w-4" /> New Admin</Button>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Admin</th><th className="px-4 py-3">User ID</th><th className="px-4 py-3">Invoices</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" /></td></tr> : admins.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No Admin accounts created yet.</td></tr> : admins.map((admin) => <tr key={admin.id} className="hover:bg-slate-50"><td className="px-4 py-3"><p className="font-semibold text-slate-900">{admin.displayName}</p><p className="text-xs text-slate-500">{admin.email || "No email"}</p></td><td className="px-4 py-3 font-mono text-slate-700">{admin.userId}</td><td className="px-4 py-3 text-slate-700">{admin._count.invoices}</td><td className="px-4 py-3"><Badge className={admin.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>{admin.isActive ? "Active" : "Inactive"}</Badge></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" title="Edit Admin" onClick={() => beginEdit(admin)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Delete Admin" className="text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => remove(admin)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-slate-700" /><h2 className="font-bold text-slate-950">{editing ? "Edit Admin" : "Create Admin"}</h2></div>
          <form className="space-y-4" noValidate onSubmit={save}>
            <div className="space-y-2"><Label>Admin Name</Label><Input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></div>
            <div className="space-y-2"><Label>User ID</Label><Input disabled={Boolean(editing)} value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value.toLowerCase() })} placeholder="e.g. arjun.patel" /></div>
            <div className="space-y-2"><Label>Email (optional)</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div className="space-y-2"><Label>{editing ? "New Password (optional)" : "Password"}</Label><Input type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div>
            {editing ? <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active account</label> : null}
            <div className="flex gap-2"><Button className="flex-1" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? "Save changes" : "Create Admin"}</Button>{editing ? <Button type="button" variant="outline" onClick={beginCreate}>Cancel</Button> : null}</div>
          </form>
        </aside>
      </div>
    </main>
  );
}
