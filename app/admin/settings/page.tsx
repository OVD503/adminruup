import { SignatureSettings } from "@/components/admin/invoices/signature-settings";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  return <SignatureSettings />;
}

