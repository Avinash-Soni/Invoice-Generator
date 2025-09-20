import React from "react";
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import logoOriginal from "./logo_original.png";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);
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

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    color: 'black',
    padding: 24,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#0f766e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    color: 'white',
  },
  headerText: {
    fontSize: 8,
    lineHeight: 1.4,
  },
  headerTextBold: {
    fontFamily: 'Helvetica-Bold',
  },
  logo: {
    height: 90,
    width: 'auto',
  },
  titleContainer: {
    marginTop: 100,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
  section: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: 'black',
  },
  halfColumn: {
    width: '50%',
    padding: 8,
  },
  borderedColumn: {
    borderRightWidth: 1,
    borderRightColor: 'black',
  },
  metaGrid: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  metaGridLast: {
    borderBottomWidth: 0,
  },
  bold: { fontFamily: 'Helvetica-Bold' },
  textLg: { fontSize: 14 },
  textBase: { fontSize: 11 },
  textXs: { fontSize: 8 },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderColor: 'black',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderColor: 'black',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 4,
    backgroundColor: '#f2f2f2',
  },
  tableCol: {
    borderStyle: 'solid',
    borderColor: 'black',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 4,
  },
  colSNo: { width: '8%' },
  colParticulars: { width: '42%' },
  colQty: { width: '15%', textAlign: 'center' },
  colRate: { width: '15%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  totalsBox: {
    width: '33.33%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  totalRowLast: {
    borderBottomWidth: 0,
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  termsSection: {
    width: '70%',
  },
  signatorySection: {
    width: '25%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  signatoryBox: {
    borderTopWidth: 1,
    borderTopColor: 'black',
    width: '100%',
    textAlign: 'center',
    paddingTop: 4,
    marginTop: 40,
  },
});

function InvoicePDF({ invoice }) {
  const taxableValue = invoice.subtotal || invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const gstAmount = invoice.gstAmount || taxableValue * 0.18;
  const totalAmount = invoice.total || taxableValue + gstAmount;
  const centralTax = gstAmount / 2;
  const stateTax = gstAmount / 2;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={[styles.headerText, styles.headerTextBold]}>Add. : Awanti Bai Chowk, Junwani Road, Bhilai (C.G.)</Text>
            <Text style={styles.headerText}>Contact : 7722828880</Text>
            <Text style={styles.headerText}>E-mail : infodesignersquare@gmail.com</Text>
          </View>
          <Image src={logoOriginal} style={styles.logo} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>TAX INVOICE</Text>
        </View>
        <View style={styles.section}>
          <View style={[styles.halfColumn, styles.borderedColumn, styles.textXs]}>
            <Text style={[styles.bold, styles.textLg]}>DESIGNER'S SQUARE</Text>
            <Text>{invoice.billFrom?.streetAddress || "Second Floor, LIG-405, Dindayal Nagar, Bhilai"}</Text>
            <Text>{invoice.billFrom?.city || "Distt. Durg (C.G.)"} Pin - {invoice.billFrom?.postCode || "490020"}</Text>
            <Text>Mo. No. : 77228 28880, 86029 48880</Text>
            <Text>GSTIN : {invoice.billFrom?.gstin || "22DPRPS5517H3ZG"}</Text>
            <Text>E-MAIL : {invoice.billFrom?.email || "designersquarebhilai@gmail.com"}</Text>
          </View>
          <View style={styles.halfColumn}>
            <View style={styles.metaGrid}>
              <View style={[styles.halfColumn, styles.borderedColumn]}><Text style={styles.bold}>Invoice No.</Text><Text>{invoice.id}</Text></View>
              <View style={styles.halfColumn}><Text style={styles.bold}>Dated</Text><Text>{formatDate(invoice.invoiceDate)}</Text></View>
            </View>
            <View style={styles.metaGrid}>
              <View style={[styles.halfColumn, styles.borderedColumn]}><Text style={styles.bold}>Delivery Note</Text><Text>{invoice.projectDescription || "N/A"}</Text></View>
              <View style={styles.halfColumn}><Text style={styles.bold}>Mode/Terms of Payment</Text><Text>{invoice.termsOfPayment || "N/A"}</Text></View>
            </View>
            <View style={[styles.metaGrid, styles.metaGridLast]}>
              <View style={[styles.halfColumn, styles.borderedColumn]}><Text style={styles.bold}>Supplier's Ref.</Text><Text>{invoice.suppliersRef || "N/A"}</Text></View>
              <View style={styles.halfColumn}><Text style={styles.bold}>Other Reference(s)</Text><Text>{invoice.otherRef || "N/A"}</Text></View>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <View style={[styles.halfColumn, styles.borderedColumn]}>
            <Text style={styles.bold}>BUYER :</Text>
            <Text style={[styles.bold, styles.textBase]}>{invoice.clientName}</Text>
            <Text>{invoice.billTo?.streetAddress || "N/A"}</Text>
            <Text>{invoice.billTo?.city}, {invoice.billTo?.postCode}</Text>
            <Text><Text style={styles.bold}>GST No. :</Text> {invoice.billTo?.gstin || "N/A"}</Text>
          </View>
          <View style={styles.halfColumn}>
            <Text style={styles.bold}>BANK DETAILS</Text>
            <Text><Text style={styles.bold}>BANK NAME :</Text> DESIGNER SQUARE</Text>
            <Text><Text style={styles.bold}>ACCOUNT NUMBER :</Text> 3451935031</Text>
            <Text><Text style={styles.bold}>IFSC CODE :</Text> CBIN0283481</Text>
            <Text><Text style={styles.bold}>BRANCH NAME :</Text> CENTRAL BANK OF INDIA</Text>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, styles.colSNo]}><Text style={styles.bold}>S.NO.</Text></View>
            <View style={[styles.tableColHeader, styles.colParticulars]}><Text style={styles.bold}>PARTICULARS</Text></View>
            <View style={[styles.tableColHeader, styles.colQty]}><Text style={styles.bold}>QTY.</Text></View>
            <View style={[styles.tableColHeader, styles.colRate]}><Text style={styles.bold}>Rate</Text></View>
            <View style={[styles.tableColHeader, styles.colAmount]}><Text style={styles.bold}>AMOUNT</Text></View>
          </View>
          {invoice.items.map((item, index) => (
            <View style={styles.tableRow} key={item.name}>
              <View style={[styles.tableCol, styles.colSNo]}><Text>{String(index + 1).padStart(2, "0")}.</Text></View>
              <View style={[styles.tableCol, styles.colParticulars]}><Text>{item.name}</Text></View>
              <View style={[styles.tableCol, styles.colQty]}><Text>{item.quantity} {item.unit || "unit"}</Text></View>
              <View style={[styles.tableCol, styles.colRate]}><Text>{item.rate.toFixed(2)}</Text></View>
              <View style={[styles.tableCol, styles.colAmount]}><Text>{item.total.toFixed(2)}</Text></View>
            </View>
          ))}
        </View>
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.bold}>GST 18%</Text>
              <Text>{gstAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowLast]}>
              <Text style={[styles.bold, styles.textLg]}>TOTAL</Text>
              <Text style={[styles.bold, styles.textLg]}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>
        <Text style={{textAlign: 'right', fontSize: 8, fontFamily: 'Helvetica-Bold', padding: 2}}>E. & O.E</Text>
        <View style={styles.footer}>
          <View style={styles.termsSection}>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={[styles.tableColHeader, {width: '15%'}]}><Text style={styles.bold}>HSN/SAC</Text></View>
                <View style={[styles.tableColHeader, {width: '25%'}]}><Text style={styles.bold}>TAXABLE VALUE</Text></View>
                <View style={[styles.tableColHeader, {width: '15%'}]}><Text style={styles.bold}>RATE</Text></View>
                <View style={[styles.tableColHeader, {width: '15%'}]}><Text style={styles.bold}>AMOUNT</Text></View>
                <View style={[styles.tableColHeader, {width: '15%'}]}><Text style={styles.bold}>RATE</Text></View>
                <View style={[styles.tableColHeader, {width: '15%'}]}><Text style={styles.bold}>AMOUNT</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={[styles.tableCol, {width: '15%'}]}><Text>9989</Text></View>
                <View style={[styles.tableCol, {width: '25%'}]}><Text>{taxableValue.toFixed(2)}</Text></View>
                <View style={[styles.tableCol, {width: '15%'}]}><Text>9%</Text></View>
                <View style={[styles.tableCol, {width: '15%'}]}><Text>{centralTax.toFixed(2)}</Text></View>
                <View style={[styles.tableCol, {width: '15%'}]}><Text>9%</Text></View>
                <View style={[styles.tableCol, {width: '15%'}]}><Text>{stateTax.toFixed(2)}</Text></View>
              </View>
            </View>
            <View style={{fontSize: 7, marginTop: 10}}>
              <Text style={styles.bold}>TERMS AND CONDITIONS :</Text>
              <Text>1. Certified that the particulars given above are correct in all respects, Also the charged & collected are in accordance with the provisions of the Act & Rules made, There under company's terms & conditions shall apply &subjects to Durg Jurisdiction.</Text>
              <Text>2. Interest @ 24% P.A. shall be charged in case of delayed payments beyond approved terms & GST Extra.</Text>
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