import React from "react";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

type InvoiceItem = {
  id?: string;
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
  firmType?: string | null;
  firmName?: string | null;
  doorNo?: string | null;
  street?: string | null;
  locality?: string | null;
  pinCode?: string | null;
  contactPersonName?: string | null;
  contactPersonNumber?: string | null;
  proprietorName?: string | null;
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
  taxAmount: number;
  totalAmount: number;
  customerSignature: string | null;
  authorizedSignatoryName: string | null;
  authorizedSignatureSnapshot: string | null;
  items: InvoiceItem[];
};

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#0f172a"
  },
  shell: {
    border: "1.5 solid #1e293b",
    padding: 10,
    minHeight: "97%"
  },
  headerBox: {
    textAlign: "center",
    borderBottom: "1.5 solid #1e293b",
    paddingBottom: 6,
    marginBottom: 6
  },
  govTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.5,
    textAlign: "center",
    textTransform: "uppercase"
  },
  subTitleText: {
    fontSize: 7.5,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 1
  },
  gatcNo: {
    fontSize: 8.5,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 2
  },
  companyName: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 3,
    letterSpacing: 0.5
  },
  companyAddress: {
    fontSize: 7.5,
    textAlign: "center",
    marginTop: 1
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    marginTop: 3,
    paddingHorizontal: 4
  },
  complaintMobile: {
    fontSize: 8.5,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 2
  },
  invoiceBanner: {
    marginVertical: 4,
    paddingVertical: 3,
    backgroundColor: "#1e293b",
    textAlign: "center"
  },
  invoiceBannerText: {
    fontSize: 11,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  metaGrid: {
    flexDirection: "row",
    border: "1 solid #cbd5e1",
    marginBottom: 6
  },
  metaColLeft: {
    width: "50%",
    padding: 5,
    borderRight: "1 solid #cbd5e1"
  },
  metaColRight: {
    width: "50%",
    padding: 5
  },
  metaRow: {
    flexDirection: "row",
    marginVertical: 1
  },
  metaLabel: {
    width: "38%",
    fontSize: 7.5,
    color: "#475569",
    fontWeight: 700
  },
  metaVal: {
    width: "62%",
    fontSize: 7.5,
    color: "#0f172a"
  },
  // Key Yellow Section from Image 3/4
  yellowSection: {
    backgroundColor: "#fffde7",
    border: "1.5 solid #ca8a04",
    marginTop: 4,
    marginBottom: 6
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    minHeight: 22,
    alignItems: "center"
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontWeight: 700,
    textAlign: "center",
    padding: 3,
    color: "#ffffff",
    borderRight: "1 solid #334155"
  },
  tableBodyRow: {
    flexDirection: "row",
    backgroundColor: "#fef9c3",
    borderBottom: "1 dotted #eab308",
    minHeight: 40
  },
  tableBodyCell: {
    padding: 4,
    fontSize: 7.5,
    color: "#1e293b",
    borderRight: "1 dotted #eab308"
  },
  specLine: {
    fontSize: 7.5,
    marginVertical: 0.5
  },
  specBold: {
    fontWeight: 700
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#fef08a",
    borderTop: "1.5 solid #ca8a04"
  },
  totalCell: {
    padding: 4,
    fontSize: 8,
    fontWeight: 700,
    color: "#0f172a",
    borderRight: "1 solid #ca8a04"
  },
  grandTotalBox: {
    padding: 6,
    backgroundColor: "#fef9c3",
    border: "1 solid #eab308",
    marginBottom: 8
  },
  grandTotalText: {
    fontSize: 8.5,
    color: "#0f172a"
  },
  bold: {
    fontWeight: 700
  },
  footerSignatures: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  signBlock: {
    alignItems: "center",
    width: "42%"
  },
  signatureImage: {
    width: 100,
    height: 40,
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

function dateStr(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  }

  return (inWords(n) + 'Rupees Only').replace(/\s+/g, ' ').trim();
}

function parseItemDetails(description: string) {
  if (!description.includes("|")) {
    return { mainTitle: description, details: [] };
  }

  const parts = description.split("—");
  const mainTitle = parts[0]?.trim() || "Weighing Instrument";
  const detailsStr = parts[1] || "";
  const details = detailsStr.split("|").map((s) => s.trim()).filter(Boolean);

  return { mainTitle, details };
}

export function InvoicePdfDocument({ invoice }: { invoice: InvoiceWithItems }) {
  const clientName = invoice.firmName || invoice.clientCompanyNameSnapshot || invoice.clientNameSnapshot || "-";
  const proprietorName = invoice.proprietorName || invoice.contactPersonName || "-";
  const address = invoice.clientAddressSnapshot || "-";
  const mobile = invoice.contactPersonNumber || invoice.clientMobileSnapshot || "-";
  const gstin = invoice.clientGSTINSnapshot || invoice.clientGstinSnapshot || "-";

  return (
    <Document title={invoice.invoiceNumber}>
      <Page size="A4" style={styles.page}>
        <View style={styles.shell}>
          {/* Header Details (Reference Image 2) */}
          <View style={styles.headerBox}>
            <Text style={styles.govTitle}>GOVERNMENT APPROVED TEST CENTRE</Text>
            <Text style={styles.subTitleText}>
              (Approved : Department of consumer affairs, Legal metrology Division)
            </Text>
            <Text style={styles.subTitleText}>
              (under section 24 of the legal metrology Act,2009)
            </Text>
            <Text style={styles.gatcNo}>(GATC) No. IND/GATC/TS/26/39</Text>
            <Text style={styles.companyName}>VISHWAKARMA SERVICES</Text>
            <Text style={styles.companyAddress}>
              8-1-379/4, Kranthi Nagar Colony, NALGONDA-508 001. E-mail: vishwaroopa2007@gmail.com
            </Text>
            <View style={styles.contactRow}>
              <Text>GSTIN: 36AVEPG8701H1ZP</Text>
              <Text>Phone : +91-9849676054</Text>
            </View>
            <Text style={styles.complaintMobile}>Complaint Mobile No 9849676054</Text>
          </View>

          {/* Invoice Banner */}
          <View style={styles.invoiceBanner}>
            <Text style={styles.invoiceBannerText}>TAX INVOICE</Text>
          </View>

          {/* Meta Information Section */}
          <View style={styles.metaGrid}>
            <View style={styles.metaColLeft}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice No:</Text>
                <Text style={[styles.metaVal, styles.bold]}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice Date:</Text>
                <Text style={styles.metaVal}>{dateStr(invoice.invoiceDate)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Instrument Type:</Text>
                <Text style={styles.metaVal}>{invoice.typeOfInstrument || "Weighing Machine"}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Accuracy Class:</Text>
                <Text style={styles.metaVal}>{invoice.accuracyClass || "class III"}</Text>
              </View>
            </View>

            <View style={styles.metaColRight}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Firm Name:</Text>
                <Text style={[styles.metaVal, styles.bold]}>{clientName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Contact Person:</Text>
                <Text style={styles.metaVal}>{proprietorName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Address:</Text>
                <Text style={styles.metaVal}>{address}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mobile / GSTIN:</Text>
                <Text style={styles.metaVal}>{mobile} / {gstin}</Text>
              </View>
            </View>
          </View>

          {/* Redesigned Key Table (Yellow Background with dotted interior borders as shown in Image 3/4) */}
          <View style={styles.yellowSection}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: "5%" }]}>S.NO</Text>
              <Text style={[styles.tableHeaderCell, { width: "24%" }]}>Location of the weights/ measures</Text>
              <Text style={[styles.tableHeaderCell, { width: "41%" }]}>Details of weights/measures/weighing/Measuring instruments</Text>
              <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Verif. Fee Rs.</Text>
              <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Charges Rs.</Text>
              <Text style={[styles.tableHeaderCell, { width: "10%", borderRightWidth: 0 }]}>Total Fee Rs.</Text>
            </View>

            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, idx) => {
                const parsed = parseItemDetails(item.description);
                const charges = invoice.cgstAmount + invoice.sgstAmount;

                return (
                  <View key={idx} style={styles.tableBodyRow}>
                    <Text style={[styles.tableBodyCell, { width: "5%", textAlign: "center" }]}>{idx + 1}</Text>

                    <Text style={[styles.tableBodyCell, { width: "24%" }]}>
                      <Text style={styles.specBold}>{parsed.mainTitle}</Text>
                    </Text>

                    <View style={[styles.tableBodyCell, { width: "41%" }]}>
                      {parsed.details.length > 0 ? (
                        parsed.details.map((detail, dIdx) => (
                          <Text key={dIdx} style={styles.specLine}>• {detail}</Text>
                        ))
                      ) : (
                        <>
                          <Text style={styles.specLine}>• Denomination/Capacity: {invoice.capacity || item.description}</Text>
                          <Text style={styles.specLine}>• Quantity: {item.quantity} {item.unit}</Text>
                          {invoice.make ? <Text style={styles.specLine}>• Make: {invoice.make}</Text> : null}
                          {invoice.model ? <Text style={styles.specLine}>• Model: {invoice.model}</Text> : null}
                          {invoice.accuracyClass ? <Text style={styles.specLine}>• Class: {invoice.accuracyClass}</Text> : null}
                          {invoice.serialNumber ? <Text style={styles.specLine}>• Serial No: {invoice.serialNumber}</Text> : null}
                        </>
                      )}
                    </View>

                    <Text style={[styles.tableBodyCell, { width: "10%", textAlign: "right" }]}>{money(invoice.subtotal || item.rate)}</Text>
                    <Text style={[styles.tableBodyCell, { width: "10%", textAlign: "right" }]}>{money(charges)}</Text>
                    <Text style={[styles.tableBodyCell, { width: "10%", textAlign: "right", borderRightWidth: 0 }]}>
                      {money(invoice.totalAmount || item.amount)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.tableBodyRow}>
                <Text style={[styles.tableBodyCell, { width: "5%", textAlign: "center" }]}>1</Text>
                <Text style={[styles.tableBodyCell, { width: "24%" }]}>
                  <Text style={styles.specBold}>{invoice.typeOfInstrument || "Weighing Machine"}</Text>
                </Text>
                <View style={[styles.tableBodyCell, { width: "41%" }]}>
                  <Text style={styles.specLine}>• Capacity: {invoice.capacity || "-"}</Text>
                  <Text style={styles.specLine}>• Model: {invoice.model || "-"}</Text>
                  <Text style={styles.specLine}>• Class: {invoice.accuracyClass || "-"}</Text>
                  <Text style={styles.specLine}>• Serial No: {invoice.serialNumber || "-"}</Text>
                </View>
                <Text style={[styles.tableBodyCell, { width: "10%", textAlign: "right" }]}>{money(invoice.subtotal)}</Text>
                <Text style={[styles.tableBodyCell, { width: "10%", textAlign: "right" }]}>{money(invoice.cgstAmount + invoice.sgstAmount)}</Text>
                <Text style={[styles.tableBodyCell, { width: "10%", textAlign: "right", borderRightWidth: 0 }]}>{money(invoice.totalAmount)}</Text>
              </View>
            )}

            {/* Total Summary Row */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalCell, { width: "70%", textAlign: "right" }]}>Total</Text>
              <Text style={[styles.totalCell, { width: "10%", textAlign: "right" }]}>{money(invoice.subtotal)}</Text>
              <Text style={[styles.totalCell, { width: "10%", textAlign: "right" }]}>{money(invoice.cgstAmount + invoice.sgstAmount)}</Text>
              <Text style={[styles.totalCell, { width: "10%", textAlign: "right", borderRightWidth: 0 }]}>{money(invoice.totalAmount)}</Text>
            </View>
          </View>

          {/* Grand Total In Words Box */}
          <View style={styles.grandTotalBox}>
            <Text style={styles.grandTotalText}>
              Grand Total Rs. <Text style={styles.bold}>{money(invoice.totalAmount)}</Text> (in words: <Text style={styles.bold}>{numberToWords(invoice.totalAmount)}</Text>)
            </Text>
          </View>

          {/* Bottom Signatures Block */}
          <View style={styles.footerSignatures}>
            <View style={styles.signBlock}>
              {invoice.customerSignature ? <Image src={invoice.customerSignature} style={styles.signatureImage} /> : <View style={{ height: 40 }} />}
              <Text style={styles.bold}>Customer Signature</Text>
            </View>

            <View style={styles.signBlock}>
              {invoice.authorizedSignatureSnapshot ? (
                <Image src={invoice.authorizedSignatureSnapshot} style={styles.signatureImage} />
              ) : <View style={{ height: 40 }} />}
              <Text style={styles.bold}>{invoice.authorizedSignatoryName || "Vishwakarma Services"}</Text>
              <Text style={{ fontSize: 7.5, marginTop: 1 }}>Inspector Legal Metrology</Text>
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
