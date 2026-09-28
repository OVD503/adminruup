import { InvoiceForm } from "@/components/admin/invoices/invoice-form";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  await requireRole("ADMIN");
  return <InvoiceForm />;
}

