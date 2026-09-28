import { InvoiceList } from "@/components/admin/invoices/invoice-list";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const session = await requireAdmin();
  return <InvoiceList role={session.role} />;
}

