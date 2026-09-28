import { SignatureManagement } from "@/components/admin/admins/signature-management";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSignaturesPage() {
  await requireSuperAdmin();
  return <SignatureManagement />;
}
