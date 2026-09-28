import type { InvoiceItemInput } from "@/lib/invoice/validation";

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateInvoiceTotals(items: InvoiceItemInput[]) {
  const calculatedItems = items.map((item) => {
    const amount = roundMoney(Number(item.quantity || 0) * Number(item.rate || 0));
    const taxAmount = roundMoney((amount * Number(item.taxRate || 0)) / 100);
    return { ...item, amount, taxAmount };
  });

  const subtotal = roundMoney(calculatedItems.reduce((sum, item) => sum + item.amount, 0));
  const taxAmount = roundMoney(calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0));
  const cgstAmount = roundMoney(taxAmount / 2);
  const sgstAmount = roundMoney(taxAmount - cgstAmount);
  const totalAmount = roundMoney(subtotal + taxAmount);

  return { items: calculatedItems, subtotal, cgstAmount, sgstAmount, taxAmount, totalAmount };
}

export function buildInvoiceStorageKey(invoiceNumber: string, invoiceDate = new Date()) {
  const year = invoiceDate.getFullYear();
  const safeInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `invoices/${year}/${safeInvoiceNumber}.pdf`;
}
