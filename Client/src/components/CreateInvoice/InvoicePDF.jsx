import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import headerImage from "../../assets/header.jpg"; // Make sure this path is correct

const formatCurrency = (amount) => {
  const formattedAmount = (amount || 0).toFixed(2);
  return `${formattedAmount}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch (err) {
    return "Invalid Date";
  }
};

// --- NEW HELPER ---
// Formats a number to 0 or 2 decimal places
const formatPercent = (percent) => {
  const num = parseFloat(percent) || 0;
  if (num % 1 === 0) {
    return num.toFixed(0); // e.g., "18"
  }
  return num.toFixed(2); // e.g., "12.50"
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "black",
    paddingTop: 124, // 100px header + 24px margin
    paddingBottom: 24, // Standard page padding
    paddingHorizontal: 72,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  newHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  contentBox: {
    marginTop: 20,
    border: "1.5px solid black",
  },
  titleContainer: {
    textAlign: "center",
    marginBottom: 0,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
  },
  section: {
    display: "flex",
    flexDirection: "row",
  },
  halfColumn: {
    width: "50%",
    padding: 2,
  },
  borderedColumn: {
    borderRightWidth: 1.5,
    borderRightColor: "black",
  },
  metaGrid: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "black",
  },
  metaGridLast: {
    borderBottomWidth: 0,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  textLg: { fontSize: 14 },
  textBase: { fontSize: 11 },
  textXs: {
    fontSize: 8,
    lineHeight: 1.4,
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderColor: "black",
    borderLeftWidth: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 0,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderColor: "black",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 4,
    backgroundColor: "#f2f2f2",
  },
  tableCol: {
    borderStyle: "solid",
    borderColor: "black",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 4,
  },
  colSNo: { width: "8%" },
  colParticulars: { width: "42%" },
  colQty: { width: "15%", textAlign: "center" },
  colRate: { width: "15%", textAlign: "right" },
  colAmount: { width: "20%", textAlign: "right" },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: "black",
  },
  totalsBox: {
    width: "33.33%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: "black",
  },
  totalRowLast: {
    borderBottomWidth: 0,
  },
  eoeBox: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: "black",
    padding: 2,
  },
  eoeText: {
    textAlign: "right",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  signatureAndTermsContainer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  termsSection: {
    width: "70%",
  },
  signatorySection: {
    width: "25%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  signatoryBox: {
    borderTopWidth: 1,
    borderTopColor: "black",
    width: "100%",
    textAlign: "center",
    paddingTop: 4,
    marginTop: 40,
  },
  gstTable: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderColor: "black",
    borderTopWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 0,
  },
  gstHeaderCell: {
    borderStyle: "solid",
    borderColor: "black",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 4,
    backgroundColor: "#f2f2f2",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    fontSize: 8,
  },
  gstDataCell: {
    borderStyle: "solid",
    borderColor: "black",
    borderBottomWidth: 0,
    borderRightWidth: 1,
    padding: 4,
    fontSize: 9,
    textAlign: "center",
  },
});

function InvoicePDF({ invoice }) {
  // --- MODIFIED: Use saved values ---
  const taxableValue = invoice.subtotal;
  const gstAmount = invoice.gstAmount;
  const totalAmount = invoice.total;
  const centralTax = gstAmount / 2;
  const stateTax = gstAmount / 2;

  // Get the saved percentage
  const savedGstPercent = parseFloat(invoice.gstPercent) || 0;
  // Get the half percentage (for CGST/SGST)
  const halfGstPercent = savedGstPercent / 2;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src={headerImage} style={styles.newHeader} fixed />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>TAX INVOICE</Text>
        </View>
        <View style={styles.contentBox} wrap>
          {/* ... Seller Info / Invoice Meta ... */}
          <View
            style={[
              styles.section,
              { borderBottomWidth: 2.5, borderBottomColor: "black" },
            ]}
          >
            <View
              style={[styles.halfColumn, styles.borderedColumn, styles.textXs]}
            >
              <Text style={[styles.bold, styles.textLg]}>
                DESIGNER'S SQUARE
              </Text>
              <Text style={[styles.bold, { marginTop: 2 }]}>
                {invoice.billFrom?.streetAddress ||
                  "Second Floor, LIG-405, Dindayal Nagar, Bhilai"}
              </Text>
              <Text>
                {invoice.billFrom?.city || "Distt. Durg (C.G.)"} Pin -{" "}
                {invoice.billFrom?.postCode || "490020"}
              </Text>
              <Text>Mo. No. : 77228 28880, 86029 48880</Text>
              <Text>
                GSTIN : {invoice.billFrom?.gstin || "22DPRPS5517H3ZG"}
              </Text>
              <Text>
                E-MAIL :{" "}
                {invoice.billFrom?.email || "designersquarebhilai@gmail.com"}
              </Text>
            </View>
            <View style={styles.halfColumn}>
              <View style={styles.metaGrid}>
                <View style={[styles.halfColumn, styles.borderedColumn]}>
                  <Text style={styles.bold}>Invoice No.</Text>
                  <Text>{invoice.id}</Text>
                </View>
                <View style={styles.halfColumn}>
                  <Text style={styles.bold}>Dated</Text>
                  <Text>{formatDate(invoice.invoiceDate)}</Text>
                </View>
              </View>
              <View style={styles.metaGrid}>
                <View style={[styles.halfColumn, styles.borderedColumn]}>
                  <Text style={styles.bold}>Delivery Note</Text>
                  <Text>{invoice.projectDescription || "N/A"}</Text>
                </View>
                <View style={styles.halfColumn}>
                  <Text style={styles.bold}>Mode/Terms of Payment</Text>
                  <Text>{invoice.termsOfPayment || "N/A"}</Text>
                </View>
              </View>
              <View style={[styles.metaGrid, styles.metaGridLast]}>
                <View style={[styles.halfColumn, styles.borderedColumn]}>
                  <Text style={styles.bold}>Supplier's Ref.</Text>
                  <Text>{invoice.suppliersRef || "N/A"}</Text>
                </View>
                <View style={styles.halfColumn}>
                  <Text style={styles.bold}>Other Reference(s)</Text>
                  <Text>{invoice.otherRef || "N/A"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ... Buyer Info / Bank Details ... */}
          <View style={styles.section}>
            <View style={[styles.halfColumn, styles.borderedColumn]}>
              <Text style={styles.bold}>BUYER :</Text>
              <Text style={[styles.bold, styles.textBase]}>
                {invoice.clientName}
              </Text>
              <Text>{invoice.billTo?.streetAddress || "N/A"}</Text>
              <Text>
                {invoice.billTo?.city}, {invoice.billTo?.postCode}
              </Text>
              <Text>
                <Text style={styles.bold}>GST No. :</Text>{" "}
                {invoice.billTo?.gstin || "N/A"}
              </Text>
            </View>
            <View style={styles.halfColumn}>
              <Text style={styles.bold}>BANK DETAILS</Text>
              <Text>
                <Text style={styles.bold}>BANK NAME :</Text> DESIGNER SQUARE
              </Text>
              <Text>
                <Text style={styles.bold}>ACCOUNT NUMBER :</Text> 3451935031
              </Text>
              <Text>
                <Text style={styles.bold}>IFSC CODE :</Text> CBIN0283481
              </Text>
              <Text>
                <Text style={styles.bold}>BRANCH NAME :</Text> CENTRAL BANK OF
                INDIA
              </Text>
            </View>
          </View>

          {/* ... Items Table ... */}
          <View style={styles.table}>
            <View style={styles.tableRow} fixed>
              <View style={[styles.tableColHeader, styles.colSNo]}>
                <Text style={styles.bold}>S.NO.</Text>
              </View>
              <View style={[styles.tableColHeader, styles.colParticulars]}>
                <Text style={styles.bold}>PARTICULARS</Text>
              </View>
              <View style={[styles.tableColHeader, styles.colQty]}>
                <Text style={styles.bold}>QTY.</Text>
              </View>
              <View style={[styles.tableColHeader, styles.colRate]}>
                <Text style={styles.bold}>Rate</Text>
              </View>
              <View
                style={[
                  styles.tableColHeader,
                  styles.colAmount,
                  { borderRightWidth: 0 },
                ]}
              >
                <Text style={styles.bold}>AMOUNT</Text>
              </View>
            </View>
            {invoice.items.map((item, index) => (
              <View style={styles.tableRow} key={item.name} wrap={false}>
                <View style={[styles.tableCol, styles.colSNo]}>
                  <Text>{String(index + 1).padStart(2, "0")}.</Text>
                </View>
                <View style={[styles.tableCol, styles.colParticulars]}>
                  <Text>{item.name}</Text>
                </View>
                <View style={[styles.tableCol, styles.colQty]}>
                  <Text>
                    {item.quantity} {item.unit || "unit"}
                  </Text>
                </View>
                <View style={[styles.tableCol, styles.colRate]}>
                  <Text>{item.rate.toFixed(2)}</Text>
                </View>
                <View
                  style={[
                    styles.tableCol,
                    styles.colAmount,
                    { borderRightWidth: 0 },
                  ]}
                >
                  <Text>{item.total.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ... Totals ... */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                {/* --- MODIFIED LINE --- */}
                <Text style={styles.bold}>
                  GST ({formatPercent(savedGstPercent)}%)
                </Text>
                <Text>{gstAmount.toFixed(2)}</Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowLast]}>
                <Text style={[styles.bold, styles.textLg]}>TOTAL</Text>
                <Text style={[styles.bold, styles.textLg]}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
            </View>
          </View>

          {/* ... EOE Box ... */}
          <View style={styles.eoeBox}>
            <Text style={styles.eoeText}>E. & O. E</Text>
          </View>

          {/* ... GST Table ... */}
          <View style={styles.gstTable}>
            {/* Header Row 1 */}
            <View style={styles.tableRow}>
              <View
                style={[
                  styles.gstHeaderCell,
                  {
                    width: "15%",
                    borderBottomWidth: 0,
                    justifyContent: "center",
                  },
                ]}
              >
                <Text>HSN/SAC</Text>
              </View>
              <View
                style={[
                  styles.gstHeaderCell,
                  {
                    width: "25%",
                    borderBottomWidth: 0,
                    justifyContent: "center",
                  },
                ]}
              >
                <Text>TAXABLE VALUE</Text>
              </View>
              <View style={[styles.gstHeaderCell, { width: "30%" }]}>
                <Text>CENTRAL TAX (CGST)</Text>
              </View>
              <View
                style={[
                  styles.gstHeaderCell,
                  { width: "30%", borderRightWidth: 0 },
                ]}
              >
                <Text>STATE TAX (SGST)</Text>
              </View>
            </View>
            {/* Header Row 2 (for sub-headers) */}
            <View style={styles.tableRow}>
              <View
                style={[
                  styles.gstHeaderCell,
                  { width: "15%", borderTopWidth: 0 },
                ]}
              >
                <Text> </Text>
                {/* Filler for rowspan */}
              </View>
              <View
                style={[
                  styles.gstHeaderCell,
                  { width: "25%", borderTopWidth: 0 },
                ]}
              >
                <Text> </Text>
                {/* Filler for rowspan */}
              </View>
              <View
                style={[styles.gstHeaderCell, { width: "15%", fontSize: 8 }]}
              >
                <Text>RATE</Text>
              </View>
              <View
                style={[styles.gstHeaderCell, { width: "15%", fontSize: 8 }]}
              >
                <Text>AMOUNT</Text>
              </View>
              <View
                style={[styles.gstHeaderCell, { width: "15%", fontSize: 8 }]}
              >
                <Text>RATE</Text>
              </View>
              <View
                style={[
                  styles.gstHeaderCell,
                  { width: "15%", fontSize: 8, borderRightWidth: 0 },
                ]}
              >
                <Text>AMOUNT</Text>
              </View>
            </View>
            {/* Data Row */}
            <View style={styles.tableRow}>
              <View style={[styles.gstDataCell, { width: "15%" }]}>
                <Text>{invoice.hsn}</Text>
              </View>
              <View
                style={[
                  styles.gstDataCell,
                  { width: "25%", textAlign: "right" },
                ]}
              >
                <Text>{taxableValue.toFixed(2)}</Text>
              </View>
              {/* --- MODIFIED LINES --- */}
              <View
                style={[
                  styles.gstDataCell,
                  { width: "15%", textAlign: "right" },
                ]}
              >
                <Text>{formatPercent(halfGstPercent)}%</Text>
              </View>
              <View
                style={[
                  styles.gstDataCell,
                  { width: "15%", textAlign: "right" },
                ]}
              >
                <Text>{centralTax.toFixed(2)}</Text>
              </View>
              <View
                style={[
                  styles.gstDataCell,
                  { width: "15%", textAlign: "right" },
                ]}
              >
                <Text>{formatPercent(halfGstPercent)}%</Text>
              </View>
              <View
                style={[
                  styles.gstDataCell,
                  { width: "15%", borderRightWidth: 0, textAlign: "right" },
                ]}
              >
                <Text>{stateTax.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>{" "}
        {/* End of contentBox */}
        {/* ... Signature and Terms ... */}
        <View style={styles.signatureAndTermsContainer}>
          <View style={styles.termsSection}>
            <View style={{ fontSize: 7, marginTop: 10 }}>
              <Text style={styles.bold}>TERMS AND CONDITIONS :</Text>
              <Text>
                1. Certified that the particulars given above are correct in all
                respects, Also the charged & collected are in accordance with
                the provisions of the Act & Rules made, There under company's
                terms & conditions shall apply &subjects to Durg Jurisdiction.
              </Text>
              <Text>
                2. Interest @ 24% P.A. shall be charged in case of delayed
                payments beyond approved terms & GST Extra.
              </Text>
              <Text>3. E. & O. E.</Text>
            </View>
          </View>
          <View style={styles.signatorySection}>
            <View style={styles.signatoryBox}>
              <Text style={styles.bold}>AUTHORISED SIGNATORY</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePDF;
