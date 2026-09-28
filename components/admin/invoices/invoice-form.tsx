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
  denomination: string;
  quantity: number;
  isNewArticle: string;
  intimationForDismantling: string;
  permissionToSell: string;
  verificationFee: number;
  situ: number;
  dueFee: number;
  cc: number;
  additionalFee: number;
}

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
      customerSignature: "",
      items: [emptyItem]
    }
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const totals = useMemo(() => calculateInvoiceTotals(watchedItems || []), [watchedItems]);
  const serviceTypes = useMemo(() => Array.from(new Set(products.map((product) => product.type))).sort(), [products]);

  const [feeRows, setFeeRows] = useState<FeeCalculationRow[]>([
    {
      id: "1",
      type: "Non-Automatic",
      subType: "Select Sub 1",
      extraInputs: "",
      denomination: "Select Denomination",
      quantity: 0,
      isNewArticle: "NO",
      intimationForDismantling: "NO",
      permissionToSell: "NO",
      verificationFee: 0,
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
        type: "Non-Automatic",
        subType: "Select Sub 1",
        extraInputs: "",
        denomination: "Select Denomination",
        quantity: 0,
        isNewArticle: "NO",
        intimationForDismantling: "NO",
        permissionToSell: "NO",
        verificationFee: 0,
        situ: 0,
        dueFee: 0,
        cc: 0,
        additionalFee: 0
      }
    ]);
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
          (Number(row.situ) || 0) +
          (Number(row.dueFee) || 0) +
          (Number(row.cc) || 0) +
          (Number(row.additionalFee) || 0),
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

  async function submit(values: InvoiceInput) {
    setSaving(true);
    setCreatedInvoice(null);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
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

      <form id="invoice-form" onSubmit={form.handleSubmit(submit)} className="w-full max-w-full space-y-6 px-1 sm:px-2 py-6">
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

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-800">Person Unique Number: *</Label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <select
                    className="h-10 w-full sm:w-64 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    {...form.register("personUniqueNumberType")}
                  >
                    <option value="">--Select Person Unique Number--</option>
                    <option value="GSTIN">GSTIN</option>
                    <option value="Aadhaar Number">Aadhaar Number</option>
                    <option value="PAN Number">PAN Number</option>
                    <option value="Trade License No">Trade License No</option>
                    <option value="Udyam Reg No">Udyam Reg No</option>
                    <option value="Other ID">Other ID</option>
                  </select>
                  <div className="w-full sm:w-72">
                    <Input
                      placeholder="Enter Unique Number"
                      {...form.register("personUniqueNumber")}
                    />
                  </div>
                </div>
                {form.formState.errors.personUniqueNumber?.message && (
                  <p className="text-xs text-red-600">{form.formState.errors.personUniqueNumber.message}</p>
                )}
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

                <Field label="Relation Details: *">
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        {...form.register("relationType")}
                      >
                        <option value="S/O">S/O</option>
                        <option value="D/O">D/O</option>
                        <option value="W/O">W/O</option>
                        <option value="C/O">C/O</option>
                      </select>
                      <select
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        {...form.register("relativeSalutation")}
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Late">Late</option>
                        <option value="Shri">Shri</option>
                        <option value="Smt.">Smt.</option>
                      </select>
                    </div>
                    <Input placeholder="Enter Relation Name" {...form.register("relativeName")} />
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
                      <td className="py-2.5 px-4 font-medium text-slate-700">Copy of model approval(if applicable)</td>
                      <td className="py-2.5 px-4 text-center">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-slate-300 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                        />
                      </td>
                    </tr>
                    <tr className="bg-slate-50/60 hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center font-medium">2</td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">Verification certificate (if new invoice to that effect)</td>
                      <td className="py-2.5 px-4 text-center">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-slate-300 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                        />
                      </td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-center font-medium">3</td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">Service Report(if repaired by RL/ML)</td>
                      <td className="py-2.5 px-4 text-center">
                        <select className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
                          <option value="">-- Select --</option>
                          <option value="Service Needed">Service Needed</option>
                          <option value="Service Not Needed">Service Not Needed</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-slate-300 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                        />
                      </td>
                    </tr>
                    <tr className="bg-slate-50/60 hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center font-medium">4</td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">Test conducted report</td>
                      <td className="py-2.5 px-4 text-center"></td>
                      <td className="py-2.5 px-4"></td>
                    </tr>
                  </tbody>
                </table>
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
                    <th className="p-2.5 min-w-[140px]">Extra Inputs<br />(4)</th>
                    <th className="p-2.5 min-w-[140px]">Denomination<br />(5)</th>
                    <th className="p-2.5 w-20">Quantity<br />(6)</th>
                    <th className="p-2.5 w-24">Whether new article?<br />(7)</th>
                    <th className="p-2.5 min-w-[160px]">Intimation to Controller for dismantling of any weight or measures<br />(8)</th>
                    <th className="p-2.5 min-w-[160px]">Permission of Legal Metrology Officer to sell of specific goods<br />(9)</th>
                    <th className="p-2.5 min-w-[120px]">Verification Fee payable in Rs.<br />(10)</th>
                    <th className="p-2.5 min-w-[180px]">Due Fee / Situ / Conveyance Charges / Additional Charges Rs.<br />(11)</th>
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
                          <option value="Non-Automatic">Non-Automatic</option>
                          <option value="Automatic">Automatic</option>
                          <option value="Weights">Weights</option>
                          <option value="Measures">Measures</option>
                          <option value="Tank / Vessel">Tank / Vessel</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <select
                          value={row.subType}
                          onChange={(e) => updateFeeRow(index, "subType", e.target.value)}
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Select Sub 1">Select Sub 1</option>
                          <option value="Select Sub 2">Select Sub 2</option>
                          <option value="Class I">Class I</option>
                          <option value="Class II">Class II</option>
                          <option value="Class III">Class III</option>
                          <option value="Class IV">Class IV</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.extraInputs}
                          onChange={(e) => updateFeeRow(index, "extraInputs", e.target.value)}
                          className="w-full h-8 rounded border border-slate-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={row.denomination}
                          onChange={(e) => updateFeeRow(index, "denomination", e.target.value)}
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Select Denomination">Select Denomination</option>
                          <option value="50 kg">50 kg</option>
                          <option value="100 kg">100 kg</option>
                          <option value="500 kg">500 kg</option>
                          <option value="1 Ton">1 Ton</option>
                          <option value="5 Ton">5 Ton</option>
                          <option value="10 Ton">10 Ton</option>
                          <option value="50 Ton">50 Ton</option>
                        </select>
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
                      <td className="p-2.5">
                        <select
                          value={row.intimationForDismantling}
                          onChange={(e) => updateFeeRow(index, "intimationForDismantling", e.target.value)}
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="NO">NO</option>
                          <option value="YES">YES</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <select
                          value={row.permissionToSell}
                          onChange={(e) => updateFeeRow(index, "permissionToSell", e.target.value)}
                          className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="NO">NO</option>
                          <option value="YES">YES</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="0"
                          value={row.verificationFee}
                          onChange={(e) => updateFeeRow(index, "verificationFee", Number(e.target.value))}
                          className="w-full h-8 rounded border border-slate-300 px-2 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2.5 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-600 font-medium">Situ:</span>
                          <input
                            type="number"
                            min="0"
                            value={row.situ}
                            onChange={(e) => updateFeeRow(index, "situ", Number(e.target.value))}
                            className="w-20 h-6 rounded border border-slate-300 px-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-600 font-medium">Due Fee:</span>
                          <input
                            type="number"
                            min="0"
                            value={row.dueFee}
                            onChange={(e) => updateFeeRow(index, "dueFee", Number(e.target.value))}
                            className="w-20 h-6 rounded border border-slate-300 px-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-600 font-medium">CC:</span>
                          <input
                            type="number"
                            min="0"
                            value={row.cc}
                            onChange={(e) => updateFeeRow(index, "cc", Number(e.target.value))}
                            className="w-20 h-6 rounded border border-slate-300 px-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-600 font-medium">Additional Fee:</span>
                          <input
                            type="number"
                            min="0"
                            value={row.additionalFee}
                            onChange={(e) => updateFeeRow(index, "additionalFee", Number(e.target.value))}
                            className="w-20 h-6 rounded border border-slate-300 px-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
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
            <CardHeader className="flex-row items-center justify-between">
              <div><CardTitle>Line Items</CardTitle><CardDescription>Amounts recalculate instantly from quantity and rate.</CardDescription></div>
              <Button type="button" onClick={() => append(emptyItem)}><Plus className="h-4 w-4" /> Add Item</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {serviceTypes.length > 0 && (
                  <Field label="Package / Service Type">
                    <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800" value={serviceType} onChange={(event) => applyServiceType(event.target.value)}>
                      <option value="">Select package type to populate items...</option>
                      {serviceTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Add Predefined Item">
                  <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800" onChange={(event) => { applyService(event.target.value); event.currentTarget.value = ""; }}>
                    <option value="">Add predefined single item row...</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.type} - {product.name}</option>)}
                  </select>
                </Field>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[2fr_100px_90px_90px_110px_90px_44px]">
                  <Input placeholder="Item / Service Description" {...form.register(`items.${index}.description`)} />
                  <Input placeholder="HSN" {...form.register(`items.${index}.hsnCode`)} />
                  <Input type="number" step="0.001" placeholder="Qty" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  <Input placeholder="Unit" {...form.register(`items.${index}.unit`)} />
                  <Input type="number" step="0.01" placeholder="Rate" {...form.register(`items.${index}.rate`, { valueAsNumber: true })} />
                  <Input type="number" step="0.01" placeholder="Tax %" {...form.register(`items.${index}.taxRate`, { valueAsNumber: true })} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => fields.length > 1 && remove(index)}><Trash2 className="h-4 w-4" /></Button>
                  <div className="text-sm font-semibold text-slate-600 md:col-span-7">Amount: {money(totals.items[index]?.amount || 0)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Instrument Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Type of Instrument"><Input {...form.register("typeOfInstrument")} /></Field>
              <Field label="Capacity"><Input {...form.register("capacity")} /></Field>
              <Field label="Make"><Input {...form.register("make")} /></Field>
              <Field label="Model"><Input {...form.register("model")} /></Field>
              <Field label="Serial Number"><Input {...form.register("serialNumber")} /></Field>
              <Field label="Accuracy Class"><Input {...form.register("accuracyClass")} /></Field>
              <Field label="Model Approval Number"><Input {...form.register("modelApprovalNumber")} /></Field>
            </CardContent>
          </Card>

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
