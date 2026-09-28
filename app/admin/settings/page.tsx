import { SignatureSettings } from "@/components/admin/invoices/signature-settings";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireRole("ADMIN");
  return <SignatureSettings adminId={session.id} />;
}
