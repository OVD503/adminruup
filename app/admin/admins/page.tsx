import { AdminUserManagement } from "@/components/admin/admins/admin-user-management";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireSuperAdmin();
  return <AdminUserManagement />;
}
