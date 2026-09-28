import { z } from "zod";

const nullableString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const invoiceItemInputSchema = z.object({
  description: z.string().trim().min(1, "Description is required."),
  hsnCode: nullableString,
  quantity: z.coerce.number().positive("Quantity must be greater than zero."),
  unit: z.string().trim().min(1, "Unit is required.").default("Nos"),
  rate: z.coerce.number().nonnegative("Rate cannot be negative."),
  taxRate: z.coerce.number().min(0, "Tax cannot be negative.").max(100, "Tax cannot exceed 100%.")
});

export const invoiceInputSchema = z.object({
  mode: z.enum(["AUTO", "MANUAL"]).default("AUTO").optional(),
  status: z.enum(["DRAFT", "GENERATED"]).default("GENERATED"),
  invoiceDate: z.coerce.date(),
  firmType: nullableString,
  firmName: nullableString,
  doorNo: nullableString,
  street: nullableString,
  locality: nullableString,
  pinCode: nullableString,
  contactPersonName: nullableString,
  contactPersonNumber: nullableString,
  personUniqueNumberType: nullableString,
  personUniqueNumber: nullableString,
  proprietorSalutation: nullableString,
  proprietorName: nullableString,
  relationType: nullableString,
  relativeSalutation: nullableString,
  relativeName: nullableString,
  proprietorContactNumber: nullableString,
  proprietorEmail: nullableString,
  clientName: nullableString,
  clientCompanyName: nullableString,
  clientAddress: nullableString,
  clientGSTIN: nullableString,
  clientMobile: nullableString,
  typeOfInstrument: nullableString,
  capacity: nullableString,
  make: nullableString,
  model: nullableString,
  serialNumber: nullableString,
  accuracyClass: nullableString,
  modelApprovalNumber: nullableString,
  categoryOfWM: nullableString,
  certificateValidityYears: nullableString,
  customerSignature: nullableString,
  items: z.array(invoiceItemInputSchema).optional().default([])
});

export const signatureSettingInputSchema = z.object({
  signatoryName: nullableString,
  signatureDataUrl: nullableString
});

export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;
export type SignatureSettingInput = z.infer<typeof signatureSettingInputSchema>;
