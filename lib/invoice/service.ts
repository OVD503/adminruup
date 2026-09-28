import { prisma } from "@/lib/db";
import { assertR2Configured, uploadToR2 } from "@/lib/r2";
import { renderInvoicePdf } from "@/lib/invoice/pdf";
import type { InvoiceInput } from "@/lib/invoice/validation";
import type { AdminSession } from "@/lib/auth";
import { roundMoney, calculateInvoiceTotals, buildInvoiceStorageKey } from "@/lib/invoice/calculations";

export { roundMoney, calculateInvoiceTotals, buildInvoiceStorageKey };

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const counter = await prisma.invoiceCounter.upsert({
    where: { year },
    create: { year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  return `INV-${year}-${String(counter.lastNumber).padStart(3, "0")}`;
}

export async function createGeneratedInvoice(input: InvoiceInput, admin: AdminSession) {
  if (input.status !== "DRAFT") assertR2Configured();

  const totals = calculateInvoiceTotals(input.items);

  const signatureSetting = await prisma.signatureSetting.findUnique({
    where: { adminUserId: admin.id },
  });

  const invoiceNumber = await nextInvoiceNumber();

  const clientName = input.firmName || input.clientName || "";
  const clientAddress = input.clientAddress || [input.doorNo, input.street, input.locality, input.pinCode].filter(Boolean).join(", ");
  const clientGSTIN = input.clientGSTIN || (input.personUniqueNumber ? (input.personUniqueNumberType ? `${input.personUniqueNumberType}: ${input.personUniqueNumber}` : input.personUniqueNumber) : null);
  const clientMobile = input.contactPersonNumber || input.clientMobile || null;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      mode: input.mode || "AUTO",
      status: input.status,
      invoiceDate: input.invoiceDate,
      clientNameSnapshot: clientName,
      clientCompanyNameSnapshot: input.clientCompanyName || input.contactPersonName || null,
      clientAddressSnapshot: clientAddress,
      clientGstinSnapshot: clientGSTIN,
      clientMobileSnapshot: clientMobile,
      firmType: input.firmType ?? null,
      firmName: input.firmName ?? null,
      doorNo: input.doorNo ?? null,
      street: input.street ?? null,
      locality: input.locality ?? null,
      pinCode: input.pinCode ?? null,
      contactPersonName: input.contactPersonName ?? null,
      contactPersonNumber: input.contactPersonNumber ?? null,
      personUniqueNumberType: input.personUniqueNumberType ?? null,
      personUniqueNumber: input.personUniqueNumber ?? null,
      proprietorSalutation: input.proprietorSalutation ?? null,
      proprietorName: input.proprietorName ?? null,
      relationType: input.relationType ?? null,
      relativeSalutation: input.relativeSalutation ?? null,
      relativeName: input.relativeName ?? null,
      proprietorContactNumber: input.proprietorContactNumber ?? null,
      proprietorEmail: input.proprietorEmail ?? null,
      typeOfInstrument: input.typeOfInstrument,
      capacity: input.capacity,
      make: input.make,
      model: input.model,
      serialNumber: input.serialNumber,
      accuracyClass: input.accuracyClass,
      modelApprovalNumber: input.modelApprovalNumber,
      subtotal: totals.subtotal,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      customerSignature: input.customerSignature,
      authorizedSignatoryName: signatureSetting?.signatoryName ?? "Vishwakarma Services",
      authorizedSignatureSnapshot: signatureSetting?.signatureDataUrl ?? null,
      createdById: admin.id,
      items: {
        create: totals.items.map((item) => ({
          description: item.description,
          hsnCode: item.hsnCode ?? null,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          taxRate: item.taxRate,
          amount: item.amount,
        })),
      },
    },
    include: { items: true },
  });

  if (input.status === "DRAFT") {
    return invoice;
  }

  // Generate PDF and upload to R2
  const pdf = await renderInvoicePdf(invoice);
  const pdfUrl = await uploadToR2(pdf, buildInvoiceStorageKey(invoice.invoiceNumber, invoice.invoiceDate), "application/pdf");

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfUrl, status: "GENERATED" },
    include: { items: true },
  });

  return updated;
}

export async function generatePdfForInvoice(invoiceId: string) {
  assertR2Configured();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });
  if (!invoice) throw new Error("Invoice not found.");

  const pdf = await renderInvoicePdf(invoice);
  const pdfUrl = await uploadToR2(pdf, buildInvoiceStorageKey(invoice.invoiceNumber, invoice.invoiceDate), "application/pdf");

  return prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfUrl, status: "GENERATED" },
    include: { items: true },
  });
}
