import React from "react";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

type InvoiceItem = {
  id: string;
  description: string;
  hsnCode: string | null;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
};

type InvoiceWithItems = {
  invoiceNumber: string;
  invoiceDate: Date;
  clientNameSnapshot: string;
  clientCompanyNameSnapshot: string | null;
  clientAddressSnapshot: string;
  clientGstinSnapshot?: string | null;
  clientGSTINSnapshot?: string | null;
  clientMobileSnapshot: string | null;
  typeOfInstrument: string | null;
  capacity: string | null;
  make: string | null;
  model: string | null;
  serialNumber: string | null;
  accuracyClass: string | null;
  modelApprovalNumber: string | null;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  customerSignature: string | null;
  authorizedSignatoryName: string | null;
  authorizedSignatureSnapshot: string | null;
  items: InvoiceItem[];
};

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827"
  },
  shell: {
    border: "1 solid #111827",
    padding: 4,
    minHeight: "100%"
  },
  center: {
    textAlign: "center"
  },
  companyTitle: {
    fontSize: 15,
    fontWeight: 700,
    textAlign: "center"
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center"
  },
  small: {
    fontSize: 7
  },
  row: {
    flexDirection: "row"
  },
  sectionTitle: {
    textAlign: "center",
    textDecoration: "underline",
    marginVertical: 3
  },
  lineBox: {
    borderBottom: "1 solid #9ca3af",
    minHeight: 14,
    paddingTop: 2
  },
  half: {
    width: "50%",
    paddingHorizontal: 4
  },
  table: {
    marginTop: 6,
    borderTop: "1 solid #111827",
    borderLeft: "1 solid #111827"
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 22
  },
  tableHeader: {
    fontSize: 8,
    textAlign: "center",
    padding: 3,
    borderBottom: "1 solid #111827",
    borderRight: "1 solid #111827"
  },
  tableCell: {
    padding: 4,
    borderBottom: "1 solid #111827",
    borderRight: "1 solid #111827"
  },
  totalsLabel: {
    width: "78%",
    padding: 3,
    textAlign: "right",
    fontWeight: 700,
    borderBottom: "1 solid #111827",
    borderRight: "1 solid #111827"
  },
  totalsValue: {
    width: "22%",
    padding: 3,
    textAlign: "right",
    borderBottom: "1 solid #111827",
    borderRight: "1 solid #111827"
  },
  footer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  signatureBlock: {
    width: "33%",
    minHeight: 58,
    justifyContent: "flex-end"
  },
  signatureImage: {
    width: 92,
    height: 34,
    objectFit: "contain",
    marginBottom: 2
  }
});

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function date(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(value);
}

function ValueLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.lineBox}>
      <Text>
        {label}: {value || ""}
      </Text>
    </View>
  );
}

export function InvoicePdfDocument({ invoice }: { invoice: InvoiceWithItems }) {
  return (
    <Document title={invoice.invoiceNumber}>
      <Page size="A4" style={styles.page}>
        <View style={styles.shell}>
          <Text style={styles.companyTitle}>GOVERNMENT APPROVED TEST CENTRE</Text>
          <Text style={[styles.center, styles.small]}>(Approved : Department of Consumer Affairs, Legal metrology Division)</Text>
          <Text style={[styles.center, styles.small]}>(under section 24 of the legal metrology Act, 2009)</Text>
          <Text style={[styles.center, styles.small]}>(GATC) No. IND/GATC/TS/26/39</Text>
          <Text style={styles.companyName}>VISHWAKARMA SERVICES</Text>
          <Text style={[styles.center, styles.small]}>
            8-1-379/4, Kranthi Nagar Colony, NALGONDA-508 001. E-mail: vishwarooapa2007@gmail.com
          </Text>
          <Text style={[styles.center, { fontWeight: 700 }]}>Complaint Mobile No 9849741617</Text>

          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={{ width: "50%", fontWeight: 700 }}>Invoice No. {invoice.invoiceNumber}</Text>
            <Text style={{ width: "50%", textAlign: "right", fontWeight: 700 }}>Date: {date(invoice.invoiceDate)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Firm Details</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <ValueLine label="Name of Firm" value={invoice.clientCompanyNameSnapshot || invoice.clientNameSnapshot} />
              <ValueLine label="Address" value={invoice.clientAddressSnapshot} />
            </View>
            <View style={styles.half}>
              <ValueLine label="Unique No. / GSTIN" value={invoice.clientGstinSnapshot || invoice.clientGSTINSnapshot} />
              <ValueLine label="Contact No." value={invoice.clientMobileSnapshot} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Instruments Details</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <ValueLine label="Type of Instrument" value={invoice.typeOfInstrument} />
              <ValueLine label="Capacity" value={invoice.capacity} />
              <ValueLine label="Make" value={invoice.make} />
            </View>
            <View style={styles.half}>
              <ValueLine label="Serial Number" value={invoice.serialNumber} />
              <ValueLine label="Accuracy Class" value={invoice.accuracyClass} />
              <ValueLine label="Model Approval No" value={invoice.modelApprovalNumber || invoice.model} />
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, { width: "7%" }]}>Sl. No.</Text>
              <Text style={[styles.tableHeader, { width: "45%" }]}>DESCRIPTION</Text>
              <Text style={[styles.tableHeader, { width: "12%" }]}>HSN</Text>
              <Text style={[styles.tableHeader, { width: "8%" }]}>Qty.</Text>
              <Text style={[styles.tableHeader, { width: "8%" }]}>Rate</Text>
              <Text style={[styles.tableHeader, { width: "8%" }]}>Tax</Text>
              <Text style={[styles.tableHeader, { width: "12%" }]}>AMOUNT Rs.</Text>
            </View>
            {invoice.items.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "7%", textAlign: "center" }]}>{index + 1}.</Text>
                <Text style={[styles.tableCell, { width: "45%" }]}>{item.description}</Text>
                <Text style={[styles.tableCell, { width: "12%" }]}>{item.hsnCode || ""}</Text>
                <Text style={[styles.tableCell, { width: "8%", textAlign: "right" }]}>{Number(item.quantity)}</Text>
                <Text style={[styles.tableCell, { width: "8%", textAlign: "right" }]}>{money(item.rate)}</Text>
                <Text style={[styles.tableCell, { width: "8%", textAlign: "right" }]}>{Number(item.taxRate)}%</Text>
                <Text style={[styles.tableCell, { width: "12%", textAlign: "right" }]}>{money(item.amount)}</Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={styles.totalsLabel}>TOTAL</Text>
              <Text style={styles.totalsValue}>{money(invoice.subtotal)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.totalsLabel}>CGST</Text>
              <Text style={styles.totalsValue}>{money(invoice.cgstAmount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.totalsLabel}>SGST</Text>
              <Text style={styles.totalsValue}>{money(invoice.sgstAmount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.totalsLabel}>GRAND TOTAL</Text>
              <Text style={[styles.totalsValue, { fontWeight: 700 }]}>{money(invoice.totalAmount)}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.signatureBlock}>
              {invoice.customerSignature ? <Image src={invoice.customerSignature} style={styles.signatureImage} /> : null}
              <Text style={{ fontWeight: 700 }}>Customer Signature</Text>
            </View>
            <View style={{ width: "34%" }}>
              <Text style={styles.small}>Amount in words: ........................................................................</Text>
              <Text style={styles.small}>Payment Details: .............................................................................</Text>
              <Text style={styles.small}>Mode of Payment: Cash/UPI/NEFT/Cheque: ....................................</Text>
              <Text style={[styles.small, { marginTop: 4, fontWeight: 700 }]}>Terms & Conditions</Text>
              <Text style={styles.small}>1. Subject to Nalgonda Jurisdiction only.</Text>
              <Text style={styles.small}>Declaration: Certified that the above instrument has been tested and verified in accordance with the applicable provisions of the Legal metrology Act, Rules and Government Approved Test Centre conditions.</Text>
            </View>
            <View style={[styles.signatureBlock, { alignItems: "flex-end" }]}>
              {invoice.authorizedSignatureSnapshot ? <Image src={invoice.authorizedSignatureSnapshot} style={styles.signatureImage} /> : null}
              <Text style={{ fontWeight: 700, textAlign: "right" }}>Authorized Signatory</Text>
              <Text style={{ textAlign: "right" }}>{invoice.authorizedSignatoryName || "Vishwakarma Services"}</Text>
              <Text style={{ marginTop: 12, fontWeight: 700 }}>(Seal)</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoiceWithItems) {
  return renderToBuffer(<InvoicePdfDocument invoice={invoice} />);
}
