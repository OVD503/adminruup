import React from "react";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export type ChecklistPhoto = { label: string; dataUrl: string };

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
    padding: 12,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000000"
  },
  shell: {
    border: "2 solid #000000",
    padding: 8,
    minHeight: "98%",
    display: "flex",
    flexDirection: "column"
  },
  headerBox: {
    textAlign: "center",
    borderBottom: "1.5 solid #000000",
    paddingBottom: 6,
    marginBottom: 4
  },
  govTitle: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 0.5,
    textAlign: "center",
    textTransform: "uppercase",
    color: "#000000"
  },
  subTitleText: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 1.5,
    color: "#000000"
  },
  gatcNo: {
    fontSize: 15,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 2.5,
    color: "#000000"
  },
  companyName: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 3,
    letterSpacing: 0.5,
    color: "#000000"
  },
  companyAddress: {
    fontSize: 8.5,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 1.5,
    color: "#000000"
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    fontWeight: 700,
    marginTop: 3,
    paddingHorizontal: 6,
    color: "#000000"
  },
  complaintMobile: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 2,
    color: "#000000"
  },
  invoiceBanner: {
    marginVertical: 4,
    paddingVertical: 3.5,
    backgroundColor: "#0F172A",
    textAlign: "center"
  },
  invoiceBannerText: {
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  metaGrid: {
    flexDirection: "row",
    border: "1.5 solid #000000",
    marginBottom: 6
  },
  metaColLeft: {
    width: "48%",
    padding: 5,
    borderRight: "1.5 solid #000000"
  },
  metaColRight: {
    width: "52%",
    padding: 5
  },
  metaRow: {
    flexDirection: "row",
    marginVertical: 1.5
  },
  metaLabel: {
    width: "40%",
    fontSize: 9,
    color: "#000000",
    fontWeight: 700
  },
  metaVal: {
    width: "60%",
    fontSize: 9,
    color: "#000000",
    fontWeight: 700
  },
  yellowSection: {
    backgroundColor: "#FFF5C4",
    border: "2 solid #CA8A04",
    marginTop: 2,
    marginBottom: 6
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    color: "#ffffff",
    minHeight: 24,
    alignItems: "center"
  },
  tableHeaderCell: {
    fontSize: 8.5,
    fontWeight: 700,
    textAlign: "center",
    padding: 3,
    color: "#ffffff",
    borderRight: "1 solid #334155"
  },
  tableBodyRow: {
    flexDirection: "row",
    backgroundColor: "#FFF9C4",
    borderBottom: "1 dotted #CA8A04",
    minHeight: 45
  },
  tableBodyCell: {
    padding: 4,
    fontSize: 9,
    color: "#000000",
    borderRight: "1 dotted #CA8A04"
  },
  specLine: {
    fontSize: 8.5,
    marginVertical: 1,
    color: "#000000"
  },
  specBold: {
    fontWeight: 700
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#FDE047",
    borderTop: "2 solid #CA8A04"
  },
  totalCell: {
    padding: 4,
    fontSize: 9.5,
    fontWeight: 700,
    color: "#000000",
    borderRight: "1 solid #CA8A04"
  },
  grandTotalBox: {
    padding: 6,
    backgroundColor: "#FFF9C4",
    border: "1.5 solid #CA8A04",
    marginBottom: 8
  },
  grandTotalText: {
    fontSize: 9.5,
    color: "#000000"
  },
  bold: {
    fontWeight: 700
  },
  footerSignatures: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  signBlock: {
    alignItems: "center",
    width: "45%"
  },
  signatureImage: {
    width: 100,
    height: 40,
    objectFit: "contain",
    marginBottom: 2
  },
  checklistSection: {
    marginTop: 8,
    border: "1.5 solid #000000",
    flexGrow: 1,
    display: "flex",
    flexDirection: "column"
  },
  checklistSectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#0F172A",
    padding: 3,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  checklistPhotoRow: {
    flexDirection: "row",
    borderTop: "1 solid #000000",
    flexGrow: 1
  },
  checklistPhotoBox: {
    flex: 1,
    borderRight: "1 solid #000000",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  checklistPhotoLabel: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#1E293B",
    padding: 3,
    textAlign: "center",
    width: "100%"
  },
  checklistPhotoImg: {
    width: "100%",
    height: 180,
    objectFit: "contain"
  },
  checklistPhotoEmpty: {
    height: 180,
    width: "100%"
  }
});

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function taxBreakdown(rate: number, taxRate: number) {
  if (!taxRate) return { svc: rate, cgst: 0, sgst: 0, total: rate };
  const taxAmt = Math.round((rate * taxRate) / 100 * 100) / 100;
  const cgst = Math.round((taxAmt / 2) * 100) / 100;
  const sgst = Math.round((taxAmt - cgst) * 100) / 100;
  return { svc: rate, cgst, sgst, total: rate + taxAmt };
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

export function InvoicePdfDocument({ invoice, checklistPhotos }: { invoice: InvoiceWithItems; checklistPhotos?: ChecklistPhoto[] }) {
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
                <Text style={[styles.metaVal, styles.bold]}>{dateStr(invoice.invoiceDate)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Instrument Type:</Text>
                <Text style={[styles.metaVal, styles.bold]}>{invoice.typeOfInstrument || "Automatic Weighing Instrument (AWI)"}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Accuracy Class:</Text>
                <Text style={[styles.metaVal, styles.bold]}>{invoice.accuracyClass || "class III"}</Text>
              </View>
              {invoice.make ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Make:</Text>
                  <Text style={[styles.metaVal, styles.bold]}>{invoice.make}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metaColRight}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Firm Name:-</Text>
                <Text style={[styles.metaVal, styles.bold]}>{clientName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Contact Person:</Text>
                <Text style={[styles.metaVal, styles.bold]}>{proprietorName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Address:</Text>
                <Text style={[styles.metaVal, styles.bold]}>{address}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mobile / GSTIN:</Text>
                <Text style={[styles.metaVal, styles.bold]}>{mobile} / {gstin}</Text>
              </View>
            </View>
          </View>

          {/* Key Table (Yellow Background with dotted interior borders as shown in Image 3/4) */}
          <View style={styles.yellowSection}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: "5%" }]}>S.NO</Text>
              <Text style={[styles.tableHeaderCell, { width: "24%" }]}>Location of the weights/ measures</Text>
              <Text style={[styles.tableHeaderCell, { width: "41%" }]}>Details of weights/measures/weighing/Measuring instruments</Text>
              <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Verification Fee Rs.</Text>
              <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Charges Rs.</Text>
              <Text style={[styles.tableHeaderCell, { width: "10%", borderRightWidth: 0 }]}>Total Fee Rs.</Text>
            </View>

            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, idx) => {
                const parsed = parseItemDetails(item.description);

                return (
                  <View key={idx} style={styles.tableBodyRow}>
                    <Text style={[styles.tableBodyCell, { width: "5%", textAlign: "center", fontWeight: 700 }]}>{idx + 1}</Text>

                    <Text style={[styles.tableBodyCell, { width: "24%" }]}>
                      <Text style={styles.specBold}>{parsed.mainTitle}</Text>
                    </Text>

                    <View style={[styles.tableBodyCell, { width: "41%" }]}>
                      {parsed.details.length > 0 ? (
                        parsed.details.map((detail, dIdx) => {
                          const colonIdx = detail.indexOf(":");
                          if (colonIdx !== -1) {
                            const label = detail.substring(0, colonIdx + 1);
                            const val = detail.substring(colonIdx + 1);
                            return (
                              <Text key={dIdx} style={styles.specLine}>
                                <Text style={styles.specBold}>{label}</Text>
                                {val}
                              </Text>
                            );
                          }
                          return <Text key={dIdx} style={styles.specLine}>{detail}</Text>;
                        })
                      ) : (
                        <>
                          {invoice.make ? <Text style={styles.specLine}><Text style={styles.specBold}>Make: </Text>{invoice.make}</Text> : null}
                          <Text style={styles.specLine}><Text style={styles.specBold}>Capacity: </Text>{invoice.capacity || item.description}</Text>
                          <Text style={styles.specLine}><Text style={styles.specBold}>Quantity: </Text>{item.quantity} {item.unit}</Text>
                          {invoice.model ? <Text style={styles.specLine}><Text style={styles.specBold}>MOD APP: </Text>{invoice.model}</Text> : null}
                          {invoice.accuracyClass ? <Text style={styles.specLine}><Text style={styles.specBold}>Class: </Text>{invoice.accuracyClass}</Text> : null}
                          {invoice.serialNumber ? <Text style={styles.specLine}><Text style={styles.specBold}>Serial No: </Text>{invoice.serialNumber}</Text> : null}
                        </>
                      )}
                    </View>

                    {/* Verification Fee = pre-tax service fee */}
                    <Text style={[styles.tableBodyCell, { width: "10%", textAlign: "right", fontWeight: 700 }]}>
                      {money(item.rate)}
                    </Text>

                    {/* Charges = CGST + SGST breakdown */}
                    <View style={[styles.tableBodyCell, { width: "10%" }]}>
                      {(() => {
                        const tb = taxBreakdown(item.rate, item.taxRate);
                        if (item.taxRate > 0) {
                          return (
                            <>
                              <Text style={[styles.specLine, { textAlign: "right", fontSize: 8 }]}>Svc:{money(tb.svc)}</Text>
                              <Text style={[styles.specLine, { textAlign: "right", fontSize: 8 }]}>CGST:{money(tb.cgst)}</Text>
                              <Text style={[styles.specLine, { textAlign: "right", fontSize: 8 }]}>SGST:{money(tb.sgst)}</Text>
                            </>
                          );
                        }
                        return <Text style={{ textAlign: "right" }}>{money(0)}</Text>;
                      })()}
                    </View>

                    {/* Total Fee = service fee + GST */}
                    <Text style={[styles.tableBodyCell, { width: "10%", textAlign: "right", fontWeight: 700, borderRightWidth: 0 }]}>
                      {money(item.amount || taxBreakdown(item.rate, item.taxRate).total)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.tableBodyRow}>
                <Text style={[styles.tableBodyCell, { width: "5%", textAlign: "center", fontWeight: 700 }]}>1</Text>
                <Text style={[styles.tableBodyCell, { width: "24%" }]}>
                  <Text style={styles.specBold}>{invoice.typeOfInstrument || "Automatic Weighing Instrument (AWI)"}</Text>
                </Text>
                <View style={[styles.tableBodyCell, { width: "41%" }]}>
                  <Text style={styles.specLine}><Text style={styles.specBold}>Capacity: </Text>{invoice.capacity || "-"}</Text>
                  <Text style={styles.specLine}><Text style={styles.specBold}>MOD APP: </Text>{invoice.model || "-"}</Text>
                  <Text style={styles.specLine}><Text style={styles.specBold}>Class: </Text>{invoice.accuracyClass || "-"}</Text>
                  <Text style={styles.specLine}><Text style={styles.specBold}>Serial No: </Text>{invoice.serialNumber || "-"}</Text>
                </View>
                <Text style={[styles.tableBodyCell, { width: "10%", textAlign: "right", fontWeight: 700 }]}>{money(invoice.subtotal)}</Text>
                <View style={[styles.tableBodyCell, { width: "10%" }]}>
                  <Text style={[styles.specLine, { textAlign: "right", fontSize: 8 }]}>Svc:{money(invoice.subtotal)}</Text>
                  <Text style={[styles.specLine, { textAlign: "right", fontSize: 8 }]}>CGST:{money(invoice.cgstAmount)}</Text>
                  <Text style={[styles.specLine, { textAlign: "right", fontSize: 8 }]}>SGST:{money(invoice.sgstAmount)}</Text>
                </View>
                <Text style={[styles.tableBodyCell, { width: "10%", textAlign: "right", fontWeight: 700, borderRightWidth: 0 }]}>{money(invoice.totalAmount)}</Text>
              </View>
            )}

            {/* Total Summary Row */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalCell, { width: "70%", textAlign: "center", fontSize: 11 }]}>Total</Text>
              <Text style={[styles.totalCell, { width: "10%", textAlign: "right" }]}>{money(invoice.subtotal)}</Text>
              <View style={[styles.totalCell, { width: "10%" }]}>
                <Text style={[{ fontSize: 7.5, textAlign: "right", color: "#000000", fontWeight: 700 }]}>CGST:{money(invoice.cgstAmount)}</Text>
                <Text style={[{ fontSize: 7.5, textAlign: "right", color: "#000000", fontWeight: 700 }]}>SGST:{money(invoice.sgstAmount)}</Text>
              </View>
              <Text style={[styles.totalCell, { width: "10%", textAlign: "right", fontSize: 11, borderRightWidth: 0 }]}>{money(invoice.totalAmount)}</Text>
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
              <Text style={[styles.bold, { fontSize: 9.5 }]}>Customer Signature</Text>
            </View>

            <View style={styles.signBlock}>
              {invoice.authorizedSignatureSnapshot ? (
                <Image src={invoice.authorizedSignatureSnapshot} style={styles.signatureImage} />
              ) : <View style={{ height: 40 }} />}
              <Text style={[styles.bold, { fontSize: 9.5 }]}>{invoice.authorizedSignatoryName || "Gottimukkala Shyam Sunder"}</Text>
              <Text style={{ fontSize: 8.5, marginTop: 1, fontWeight: 700 }}>Principal Officer</Text>
            </View>
          </View>

          {/* Checklist Photos – always rendered as styled placeholder boxes */}
          <View style={styles.checklistSection}>
            <Text style={styles.checklistSectionTitle}>Checklist Photos</Text>
            <View style={styles.checklistPhotoRow}>
              {(['Calibration', 'Stamp & Seal'] as const).map((label, i) => {
                const photo = checklistPhotos?.find(p => p.label === label);
                return (
                  <View key={i} style={[styles.checklistPhotoBox, i === 1 ? { borderRightWidth: 0 } : {}]}>
                    <Text style={styles.checklistPhotoLabel}>{label}</Text>
                    {photo ? (
                      <Image src={photo.dataUrl} style={styles.checklistPhotoImg} />
                    ) : (
                      <View style={styles.checklistPhotoEmpty} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoiceWithItems, checklistPhotos?: ChecklistPhoto[]) {
  return renderToBuffer(<InvoicePdfDocument invoice={invoice} checklistPhotos={checklistPhotos} />);
}
