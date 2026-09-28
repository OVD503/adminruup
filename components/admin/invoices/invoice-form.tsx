"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ArrowLeft, FileCheck2, Home, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/admin/invoices/signature-pad";
import { calculateInvoiceTotals } from "@/lib/invoice/calculations";
import { invoiceInputSchema, type InvoiceInput } from "@/lib/invoice/validation";

type ProductService = {
  id: string;
  type: string;
  name: string;
  description: string;
  hsnCode: string | null;
  basePrice: string | number;
  taxRate: string | number;
  unit: string;
};

interface FeeCalculationRow {
  id: string;
  type: string;
  subType: string;
  extraInputs: string;
  make?: string;
  noOfMachines?: string;
  maxValue?: string;
  minValue?: string;
  eValue?: string;
  model?: string;
  machineCategory?: string;
  accuracyClass?: string;
  denomination: string;
  quantity: number;
  isNewArticle: string;
  intimationForDismantling: string;
  permissionToSell: string;
  verificationFee: number;
  feePreset?: string;
  cgst?: number;
  sgst?: number;
  serviceFee?: number;
  situ: number;
  dueFee: number;
  cc: number;
  additionalFee: number;
}

const MAX_TO_MIN_MAP: Record<string, { min: string; e: string }[]> = {
  "10": [
    { min: "20", e: "1" },
    { min: "40", e: "2" }
  ],
  "20": [
    { min: "20", e: "1" },
    { min: "40", e: "2" },
    { min: "100", e: "5" }
  ],
  "30": [
    { min: "100", e: "5" }
  ],
  "50": [
    { min: "100", e: "5" },
    { min: "200", e: "10" }
  ],
  "100": [
    { min: "200", e: "10" },
    { min: "300", e: "15" },
    { min: "400", e: "20" }
  ],
  "150": [
    { min: "400", e: "20" }
  ]
};

const emptyItem = {
  description: "",
  hsnCode: "",
  quantity: 1,
  unit: "Nos",
  rate: 0,
  taxRate: 18
};

function todayDate() {
  return new Date(new Date().toISOString().slice(0, 10));
}

function money(value: number) {
  return value.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

export function InvoiceForm() {
  const [products, setProducts] = useState<ProductService[]>([]);
  const [serviceType, setServiceType] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<{ pdfUrl?: string | null; invoiceNumber?: string } | null>(null);
  const [serviceReportStatus, setServiceReportStatus] = useState("");
  const [whatChangedDetails, setWhatChangedDetails] = useState("");
  const [calibrationPhoto, setCalibrationPhoto] = useState<string | null>(null);
  const [stampPhoto, setStampPhoto] = useState<string | null>(null);

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceInputSchema) as any,
    defaultValues: {
      mode: "AUTO",
      status: "GENERATED",
      invoiceDate: todayDate(),
      firmType: "",
      firmName: "",
      doorNo: "",
      street: "",
      locality: "",
      pinCode: "",
      contactPersonName: "",
      contactPersonNumber: "",
      personUniqueNumberType: "",
      personUniqueNumber: "",
      proprietorSalutation: "Mr.",
      proprietorName: "",
      relationType: "S/O",
      relativeSalutation: "Mr.",
      relativeName: "",
      proprietorContactNumber: "",
      proprietorEmail: "",
      clientName: "",
      clientCompanyName: "",
      clientAddress: "",
      clientGSTIN: "",
      clientMobile: "",
      typeOfInstrument: "",
      capacity: "",
      make: "",
      model: "",
      serialNumber: "",
      accuracyClass: "",
      modelApprovalNumber: "",
      categoryOfWM: "",
      certificateValidityYears: "",
      customerSignature: "",
      items: []
    }
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const totals = useMemo(() => calculateInvoiceTotals(watchedItems || []), [watchedItems]);
  const serviceTypes = useMemo(() => Array.from(new Set(products.map((product) => product.type))).sort(), [products]);

  const [feeRows, setFeeRows] = useState<FeeCalculationRow[]>([
    {
      id: "1",
      type: "Select Type",
      subType: "Select Sub Type",
      extraInputs: "",
      make: "",
      noOfMachines: "",
      maxValue: "",
      minValue: "",
      eValue: "",
      model: "",
      machineCategory: "",
      accuracyClass: "class III",
      denomination: "Select Denomination",
      quantity: 0,
      isNewArticle: "NO",
      intimationForDismantling: "NO",
      permissionToSell: "NO",
      verificationFee: 0,
      cgst: 0,
      sgst: 0,
      serviceFee: 0,
      situ: 0,
      dueFee: 0,
      cc: 100,
      additionalFee: 0
    }
  ]);

  function addFeeRow() {
    setFeeRows((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: "Select Type",
        subType: "Select Sub Type",
        extraInputs: "",
        make: "",
        noOfMachines: "",
        maxValue: "",
        minValue: "",
        eValue: "",
        model: "",
        machineCategory: "",
        accuracyClass: "class III",
        denomination: "Select Denomination",
        quantity: 0,
        isNewArticle: "NO",
        intimationForDismantling: "NO",
        permissionToSell: "NO",
        verificationFee: 0,
        cgst: 0,
        sgst: 0,
        serviceFee: 0,
        situ: 0,
        dueFee: 0,
        cc: 0,
        additionalFee: 0
      }
    ]);
  }

  function getPriceForMax(max: string): number {
    if (max === "10") return 1000;
    if (max === "20" || max === "30") return 1100;
    if (max === "50" || max === "100" || max === "150") return 1200;
    return 0;
  }

  function calculateGstBreakdown(totalInclGst: number) {
    if (!totalInclGst || totalInclGst <= 0) {
      return { serviceFee: 0, cgst: 0, sgst: 0 };
    }
    const serviceFee = Math.round((totalInclGst / 1.18) * 100) / 100;
    const remainingGst = Math.round((totalInclGst - serviceFee) * 100) / 100;
    const cgst = Math.round((remainingGst / 2) * 100) / 100;
    const sgst = Math.round((remainingGst - cgst) * 100) / 100;
    return { serviceFee, cgst, sgst };
  }

  function handleMaxChange(index: number, newMax: string) {
    const options = MAX_TO_MIN_MAP[newMax] || [];
    const defaultOption = options[0];
    const autoPrice = getPriceForMax(newMax);
    const gstBreakdown = calculateGstBreakdown(autoPrice);

    setFeeRows((prev) => {
      const copy = [...prev];
      const currentRow = copy[index];
      const matchingMin = options.find((opt) => opt.min === currentRow.minValue);
      const selectedMin = matchingMin ? matchingMin.min : (defaultOption ? defaultOption.min : "");
      const selectedE = matchingMin ? matchingMin.e : (defaultOption ? defaultOption.e : "");
      copy[index] = {
        ...currentRow,
        maxValue: newMax,
        minValue: selectedMin,
        eValue: selectedE,
        feePreset: autoPrice ? String(autoPrice) : "Other",
        serviceFee: gstBreakdown.serviceFee,
        cgst: gstBreakdown.cgst,
        sgst: gstBreakdown.sgst
      };
      return copy;
    });
  }

  function handlePresetChange(index: number, preset: string) {
    setFeeRows((prev) => {
      const copy = [...prev];
      const currentRow = copy[index];
      if (preset === "Other") {
        copy[index] = { ...currentRow, feePreset: "Other" };
      } else {
        const amount = Number(preset) || 0;
        const gstBreakdown = calculateGstBreakdown(amount);
        copy[index] = {
          ...currentRow,
          feePreset: preset,
          serviceFee: gstBreakdown.serviceFee,
          cgst: gstBreakdown.cgst,
          sgst: gstBreakdown.sgst
        };
      }
      return copy;
    });
  }

  function handleMinChange(index: number, newMin: string) {
    setFeeRows((prev) => {
      const copy = [...prev];
      const currentRow = copy[index];
      const options = MAX_TO_MIN_MAP[currentRow.maxValue || ""] || [];
      const matchingOpt = options.find((opt) => opt.min === newMin);
      const selectedE = matchingOpt ? matchingOpt.e : "";
      copy[index] = {
        ...currentRow,
        minValue: newMin,
        eValue: selectedE
      };
      return copy;
    });
  }

  function deleteFeeRow() {
    setFeeRows((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }

  function updateFeeRow(index: number, key: keyof FeeCalculationRow, value: any) {
    setFeeRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  }

  const totalVerificationFee = useMemo(
    () => feeRows.reduce((acc, row) => acc + (Number(row.verificationFee) || 0) * (Number(row.quantity) || 1), 0),
    [feeRows]
  );

  const totalCharges = useMemo(
    () =>
      feeRows.reduce(
        (acc, row) =>
          acc +
          (Number(row.cgst) || 0) +
          (Number(row.sgst) || 0) +
          (Number(row.serviceFee) || 0),
        0
      ),
    [feeRows]
  );

  const finalFeeToBePaid = useMemo(
    () => totalVerificationFee + totalCharges,
    [totalVerificationFee, totalCharges]
  );

  useEffect(() => {
    async function loadData() {
      const [productsResponse, signatureResponse] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/settings/signature")
      ]);
      const [productsData, signatureData] = await Promise.all([
        productsResponse.json(),
        signatureResponse.json()
      ]);
      if (productsResponse.ok) setProducts(productsData.items || []);
      if (signatureResponse.ok && !signatureData.signatureDataUrl) {
        toast.info("Save an authorized signature in Settings before final billing.");
      }
    }
    void loadData();
  }, []);

  function itemFromProduct(product: ProductService) {
    return {
      description: product.description,
      hsnCode: product.hsnCode || "",
      quantity: 1,
      unit: product.unit,
      rate: Number(product.basePrice || 0),
      taxRate: Number(product.taxRate || 18)
    };
  }

  function applyService(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (product) append(itemFromProduct(product));
  }

  function applyServiceType(type: string) {
    setServiceType(type);
    const matching = products.filter((product) => product.type === type);
    if (matching.length) replace(matching.map(itemFromProduct));
  }

  function onInvalid(errors: any) {
    console.error("Form validation errors:", errors);
    const keys = Object.keys(errors);
    if (keys.length > 0) {
      toast.error(`Form validation issue: ${keys.join(", ")}`);
    }
  }

  async function submit(values: InvoiceInput) {
    setSaving(true);
    setCreatedInvoice(null);
    try {
      const mappedItems = feeRows.map((row) => {
        const totalRowPrice =
          (Number(row.serviceFee) || 0) +
          (Number(row.cgst) || 0) +
          (Number(row.sgst) || 0) +
          (Number(row.verificationFee) || 0);

        const detailsList = [
          row.subType && row.subType !== "Select Sub Type" ? `Sub-Type: ${row.subType}` : "",
          row.make ? `Make: ${row.make}` : "",
          row.machineCategory ? `Model Type: ${row.machineCategory}` : "",
          row.model ? `Model: ${row.model}` : "",
          row.noOfMachines ? `No. of Machines: ${row.noOfMachines}` : "",
          row.maxValue ? `Max Value: ${row.maxValue} kg` : "",
          row.minValue ? `Min Value: ${row.minValue} g` : "",
          row.eValue ? `e-value: ${row.eValue} g` : "",
          row.accuracyClass ? `Class: ${row.accuracyClass}` : ""
        ].filter(Boolean);

        const title = row.type && row.type !== "Select Type" ? row.type : "Weighing Instrument";
        const description = detailsList.length > 0 ? `${title} — ${detailsList.join(" | ")}` : title;

        const serviceFeeAmt = Number(row.serviceFee) || 0;
        const cgstAmt = Number(row.cgst) || 0;
        const hasTax = serviceFeeAmt > 0 && cgstAmt > 0;

        return {
          description,
          hsnCode: "9986",
          quantity: Number(row.noOfMachines) || 1,
          unit: "Job",
          rate: hasTax ? serviceFeeAmt : (totalRowPrice || finalFeeToBePaid),
          taxRate: hasTax ? 18 : 0
        };
      });

      const firstRow = feeRows[0];
      const checklistPhotos: { label: string; dataUrl: string }[] = [];
      if (calibrationPhoto) checklistPhotos.push({ label: "Calibration", dataUrl: calibrationPhoto });
      if (stampPhoto) checklistPhotos.push({ label: "Stamp & Seal", dataUrl: stampPhoto });

      const payload = {
        ...values,
        typeOfInstrument: firstRow?.type && firstRow.type !== "Select Type" ? firstRow.type : values.typeOfInstrument,
        capacity: firstRow?.maxValue ? `${firstRow.maxValue} kg` : values.capacity,
        model: firstRow?.model || values.model,
        accuracyClass: firstRow?.accuracyClass || values.accuracyClass,
        items: values.items && values.items.length > 0 ? values.items : mappedItems,
        checklistPhotos
      };
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate invoice.");
      setCreatedInvoice(data);
      toast.success("Invoice Generated Successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate invoice.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="erp-shell min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="flex w-full items-center justify-between px-2 sm:px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5 font-medium text-slate-700">
                <Home className="h-4 w-4" /> Home
              </Button>
            </Link>
            <Link href="/admin/invoices"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Invoices</Button></Link>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">Create Invoice</h1>
              <p className="text-sm text-slate-500">Fill in details and generate GATC-format invoice PDF.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" form="invoice-form" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
              Generate Invoice
            </Button>
          </div>
        </div>
      </header>

      <form id="invoice-form" onSubmit={form.handleSubmit(submit, onInvalid)} className="w-full max-w-full space-y-6 px-1 sm:px-2 py-6">
        <div className="space-y-6">
          {createdInvoice ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <CardTitle className="text-emerald-800">Invoice Generated Successfully</CardTitle>
                <CardDescription>{createdInvoice.invoiceNumber}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {createdInvoice.pdfUrl ? (
                  <>
                    <a href={createdInvoice.pdfUrl} target="_blank" rel="noreferrer"><Button type="button">View PDF</Button></a>
                    <a href={createdInvoice.pdfUrl} download><Button type="button" variant="outline">Download PDF</Button></a>
                    <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(createdInvoice.pdfUrl || "")}>Copy PDF Link</Button>
                  </>
                ) : null}
                <Button type="button" variant="outline" onClick={() => window.location.reload()}>Create New Invoice</Button>
              </CardContent>
            </Card>
          ) : null}

          <Card className="overflow-hidden border-slate-200 shadow-soft">
            <div className="bg-[#fde8d7] border-b border-[#fcd5b5] py-2.5 text-center text-base font-bold text-[#d96b27]">
              Firm Details
            </div>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Field label="Firm Type:">
                  <Input placeholder="e.g. Proprietary / Pvt Ltd" {...form.register("firmType")} />
                </Field>
                <Field label="Firm Name: *" error={form.formState.errors.firmName?.message}>
                  <Input placeholder="Firm Name" {...form.register("firmName")} />
                </Field>
                <Field label="Door no: *" error={form.formState.errors.doorNo?.message}>
                  <Input placeholder="Door no" {...form.register("doorNo")} />
                </Field>
                <Field label="Street: *" error={form.formState.errors.street?.message}>
                  <Input placeholder="Street" {...form.register("street")} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Field label="Locality: *" error={form.formState.errors.locality?.message}>
                  <Input placeholder="Locality" {...form.register("locality")} />
                </Field>
                <Field label="Pin Code: *" error={form.formState.errors.pinCode?.message}>
                  <Input placeholder="Pin Code" {...form.register("pinCode")} />
                </Field>
                <Field label="Contact person Name: *" error={form.formState.errors.contactPersonName?.message}>
                  <Input placeholder="Contact person Name" {...form.register("contactPersonName")} />
                </Field>
                <Field label="Contact person Number: *" error={form.formState.errors.contactPersonNumber?.message}>
                  <Input placeholder="Contact person Number" {...form.register("contactPersonNumber")} />
                </Field>
              </div>


              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Invoice Date:</span>
                <Input
                  type="date"
                  className="w-48"
                  value={form.watch("invoiceDate") ? new Date(form.watch("invoiceDate")).toISOString().slice(0, 10) : ""}
                  onChange={(event) => form.setValue("invoiceDate", new Date(`${event.target.value}T00:00:00`))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 shadow-soft">
            <div className="bg-[#fde8d7] border-b border-[#fcd5b5] py-2.5 text-center text-base font-bold text-[#d96b27]">
              Proprietor/MD/Director Details
            </div>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-start">
                <Field label="Name: *">
                  <div className="space-y-2">
                    <select
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      {...form.register("proprietorSalutation")}
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Shri">Shri</option>
                      <option value="Smt.">Smt.</option>
                    </select>
                    <Input placeholder="Enter Name" {...form.register("proprietorName")} />
                  </div>
                </Field>


                <Field label="Contact Number: *">
                  <Input placeholder="Enter Contact Number" {...form.register("proprietorContactNumber")} />
                </Field>

                <Field label="E-Mail: *">
                  <Input type="email" placeholder="Enter E-Mail" {...form.register("proprietorEmail")} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 shadow-soft">
            <div className="bg-[#fde8d7] border-b border-[#fcd5b5] py-2.5 text-center text-base font-bold text-[#d96b27]">
              Upload CheckList
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#1e293b] text-white font-semibold">
                      <th className="py-2.5 px-4 border-b border-slate-700 text-center w-16">Sl No.</th>
                      <th className="py-2.5 px-4 border-b border-slate-700">Check List</th>
                      <th className="py-2.5 px-4 border-b border-slate-700 text-center w-36">Status</th>
                      <th className="py-2.5 px-4 border-b border-slate-700 w-80">INVOICE of New WM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr className="bg-white hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-center font-medium">1</td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">Calibration</td>
                      <td className="py-2.5 px-4 text-center">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-slate-300 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) setCalibrationPhoto(await readFileAsDataUrl(file));
                            else setCalibrationPhoto(null);
                          }}
                        />
                        {calibrationPhoto && <span className="text-[10px] text-emerald-600 font-medium">✓ Photo ready</span>}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/60 hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center font-medium">2</td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">Stamp & Seal</td>
                      <td className="py-2.5 px-4 text-center">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-slate-300 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) setStampPhoto(await readFileAsDataUrl(file));
                            else setStampPhoto(null);
                          }}
                        />
                        {stampPhoto && <span className="text-[10px] text-emerald-600 font-medium">✓ Photo ready</span>}
                      </td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-center font-medium">3</td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">Service Report(if repaired by GATC)</td>
                      <td className="py-2.5 px-4 text-center">
                        <select
                          className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                          value={serviceReportStatus}
                          onChange={(e) => setServiceReportStatus(e.target.value)}
                        >
                          <option value="">-- Select --</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Service Needed">Service Needed</option>
                          <option value="Service Not Needed">Service Not Needed</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-4">
                        {(serviceReportStatus === "Yes" || serviceReportStatus === "Service Needed") && (
                          <Input
                            type="text"
                            placeholder="What changed"
                            className="h-8 text-xs w-full bg-white border-slate-200 focus:border-slate-400"
                            value={whatChangedDetails}
                            onChange={(e) => setWhatChangedDetails(e.target.value)}
                          />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 shadow-soft">
            <CardContent className="p-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Category of WM: *</Label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    {...form.register("categoryOfWM")}
                  >
                    <option value="">--Select Category of WM--</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Ordinary">Ordinary</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Certificate Validity in Years: *</Label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    {...form.register("certificateValidityYears")}
                  >
                    <option value="">--Select Certificate Validity in Years--</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 shadow-soft">
            <div className="flex items-center justify-between bg-slate-100 px-4 py-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Verification & Fee Breakdown</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addFeeRow}
                  className="bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold px-3 py-1.5 rounded transition-colors shadow-sm cursor-pointer"
                >
                  Add Row
                </button>
                <button
                  type="button"
                  onClick={deleteFeeRow}
                  className="bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold px-3 py-1.5 rounded transition-colors shadow-sm cursor-pointer"
                >
                  Delete Row
                </button>
              </div>
            </div>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white font-semibold text-center divide-x divide-[#2b4c7e]">
                    <th className="p-2.5 w-12">SNO<br />(1)</th>
                    <th className="p-2.5 min-w-[130px]">Type<br />(2)</th>
                    <th className="p-2.5 min-w-[130px]">Sub Type<br />(3)</th>
                    <th className="p-2.5 min-w-[280px]">Extra Inputs<br />(4)</th>
                    <th className="p-2.5 w-20">Quantity<br />(5)</th>
                    <th className="p-2.5 w-24">Whether new article?<br />(6)</th>
                    <th className="p-2.5 min-w-[180px]">CGST / SGST / Service Fee / Total Rs.<br />(7)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                  {feeRows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 divide-x divide-slate-200">
                      <td className="p-2.5 text-center font-medium">{index + 1}</td>
                      <td className="p-2.5">
                        <select
                          value={row.type}
                          onChange={(e) => updateFeeRow(index, "type", e.target.value)}
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Select Type">Select Type</option>
                          <option value="Automatic Weighing Instrument (AWI)">Automatic Weighing Instrument (AWI)</option>
                          <option value="Non-Automatic weighing instruments class III & IV (NAWI)">Non-Automatic weighing instruments class III &amp; IV (NAWI)</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <select
                          value={row.subType}
                          onChange={(e) => updateFeeRow(index, "subType", e.target.value)}
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Select Sub Type">Select Sub Type</option>
                          <option value="Electronic">Electronic</option>
                          <option value="Mechanical">Mechanical</option>
                        </select>
                      </td>
                      <td className="p-2.5 min-w-[280px]">
                        <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/50 p-2 rounded border border-slate-200">

                          {/* Make */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">Make:</span>
                            <input
                              type="text"
                              value={row.make || ""}
                              onChange={(e) => updateFeeRow(index, "make", e.target.value)}
                              className="w-24 h-7 rounded border border-slate-300 px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              placeholder="Enter Make"
                            />
                          </div>

                          {/* Model Type */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">Model Type:</span>
                            <select
                              value={row.machineCategory || ""}
                              onChange={(e) => updateFeeRow(index, "machineCategory", e.target.value)}
                              className="w-24 h-7 rounded border border-slate-300 px-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                              <option value="">-- Select --</option>
                              <option value="TT">Tabletop (TT)</option>
                              <option value="PF">Platform (PF)</option>
                              <option value="CR">Crane (CR)</option>
                            </select>
                          </div>

                          {/* Model */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">Model:</span>
                            <input
                              type="text"
                              value={row.model || ""}
                              onChange={(e) => updateFeeRow(index, "model", e.target.value)}
                              className="w-24 h-7 rounded border border-slate-300 px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              placeholder="Enter Model"
                            />
                          </div>

                          {/* No. of Machines */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">No. of Machines under Verification:</span>
                            <input
                              type="text"
                              value={row.noOfMachines || ""}
                              onChange={(e) => updateFeeRow(index, "noOfMachines", e.target.value)}
                              className="w-20 h-7 rounded border border-slate-300 px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              placeholder="Qty"
                            />
                          </div>

                          {/* Max value */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">Max value:</span>
                            <div className="flex items-center gap-1">
                              <select
                                value={row.maxValue || ""}
                                onChange={(e) => handleMaxChange(index, e.target.value)}
                                className="w-20 h-7 rounded border border-slate-300 px-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              >
                                <option value="">-- Select --</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="30">30</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="150">150</option>
                              </select>
                              <span className="text-[11px] text-slate-500 font-medium">kg</span>
                            </div>
                          </div>

                          {/* Min value */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">Min value:</span>
                            <div className="flex items-center gap-1">
                              <select
                                value={row.minValue || ""}
                                onChange={(e) => handleMinChange(index, e.target.value)}
                                disabled={!row.maxValue}
                                className="w-20 h-7 rounded border border-slate-300 px-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-100"
                              >
                                <option value="">-- Select --</option>
                                {(MAX_TO_MIN_MAP[row.maxValue || ""] || []).map((opt) => (
                                  <option key={opt.min} value={opt.min}>
                                    {opt.min}
                                  </option>
                                ))}
                              </select>
                              <span className="text-[11px] text-slate-500 font-medium">g</span>
                            </div>
                          </div>

                          {/* e-value */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">e-value:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                readOnly
                                value={row.eValue || ""}
                                className="w-20 h-7 rounded border border-slate-300 px-1.5 text-xs bg-slate-100 text-slate-700 font-medium text-center"
                                placeholder="Auto"
                              />
                              <span className="text-[11px] text-slate-500 font-medium">g</span>
                            </div>
                          </div>

                          {/* Class */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                            <span className="text-[11px] font-medium text-slate-600">Class:</span>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-700">
                                <input
                                  type="radio"
                                  name={`class-${row.id}`}
                                  value="class III"
                                  checked={row.accuracyClass === "class III" || !row.accuracyClass}
                                  onChange={(e) => updateFeeRow(index, "accuracyClass", e.target.value)}
                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                class III
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-700">
                                <input
                                  type="radio"
                                  name={`class-${row.id}`}
                                  value="class IV"
                                  checked={row.accuracyClass === "class IV"}
                                  onChange={(e) => updateFeeRow(index, "accuracyClass", e.target.value)}
                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                class IV
                              </label>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="0"
                          value={row.quantity}
                          onChange={(e) => updateFeeRow(index, "quantity", Number(e.target.value))}
                          className="w-full h-8 rounded border border-slate-300 px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={row.isNewArticle}
                          onChange={(e) => updateFeeRow(index, "isNewArticle", e.target.value)}
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="NO">NO</option>
                          <option value="YES">YES</option>
                        </select>
                      </td>
                      <td className="p-2.5 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-600 font-medium">Fee Preset:</span>
                          <select
                            value={row.feePreset || ""}
                            onChange={(e) => handlePresetChange(index, e.target.value)}
                            className="w-24 h-6 rounded border border-slate-300 px-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            <option value="">-- Select --</option>
                            <option value="1000">₹1,000 (10kg)</option>
                            <option value="1100">₹1,100 (20-30kg)</option>
                            <option value="1200">₹1,200 (50-150kg)</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-600 font-medium">Service fee:</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            readOnly={row.feePreset !== "Other"}
                            value={row.serviceFee ?? 0}
                            onChange={(e) => updateFeeRow(index, "serviceFee", Number(e.target.value))}
                            className={`w-20 h-6 rounded border border-slate-300 px-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${row.feePreset !== "Other" ? "bg-slate-100 text-slate-700" : "bg-white"
                              }`}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-600 font-medium">CGST (9%):</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            readOnly={row.feePreset !== "Other"}
                            value={row.cgst ?? 0}
                            onChange={(e) => updateFeeRow(index, "cgst", Number(e.target.value))}
                            className={`w-20 h-6 rounded border border-slate-300 px-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${row.feePreset !== "Other" ? "bg-slate-100 text-slate-700" : "bg-white"
                              }`}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-600 font-medium">SGST (9%):</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            readOnly={row.feePreset !== "Other"}
                            value={row.sgst ?? 0}
                            onChange={(e) => updateFeeRow(index, "sgst", Number(e.target.value))}
                            className={`w-20 h-6 rounded border border-slate-300 px-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${row.feePreset !== "Other" ? "bg-slate-100 text-slate-700" : "bg-white"
                              }`}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200">
                          <span className="text-slate-800 font-bold">Total:</span>
                          <span className="w-20 text-right font-bold text-slate-800 text-xs">
                            {((Number(row.serviceFee) || 0) + (Number(row.cgst) || 0) + (Number(row.sgst) || 0)).toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-300 bg-slate-50">
                <div className="flex justify-end border-b border-slate-200">
                  <div className="bg-[#1e3a8a] text-white px-6 py-2 font-bold text-xs uppercase tracking-wider flex items-center">
                    TOTAL:
                  </div>
                  <div className="px-4 py-2 flex items-center gap-3">
                    <input
                      type="number"
                      readOnly
                      value={totalVerificationFee}
                      className="w-24 h-8 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-right text-slate-800"
                    />
                    <input
                      type="number"
                      readOnly
                      value={totalCharges}
                      className="w-24 h-8 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-right text-slate-800"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#1e3a8a] text-white px-6 py-2 font-bold text-xs uppercase tracking-wider flex items-center">
                    Final Fee To be paid:
                  </div>
                  <div className="px-4 py-2 flex items-center">
                    <input
                      type="number"
                      readOnly
                      value={finalFeeToBePaid}
                      className="w-24 h-8 rounded border border-slate-300 bg-white px-2 text-xs font-bold text-right text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-2 pb-2">
            <button
              type="submit"
              form="invoice-form"
              className="bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold py-2.5 px-12 rounded-md shadow-md text-base transition-colors cursor-pointer"
            >
              Submit
            </button>
          </div>



          <Card>
            <CardHeader><CardTitle>Customer Signature</CardTitle></CardHeader>
            <CardContent><SignaturePad value={form.watch("customerSignature")} onChange={(value) => form.setValue("customerSignature", value || "")} /></CardContent>
          </Card>
        </div>
      </form>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
