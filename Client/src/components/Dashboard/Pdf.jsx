import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useParams } from "react-router-dom";
import headerImg from "../../assets/header.jpg";
import api from "../../api"; // <-- IMPORT THE API HELPER

const Pdf = ({ customerName: propName }) => {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name || propName || "");
  const printRef = useRef();
  const [generating, setGenerating] = useState(false);

  // State for the PDF content
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [totals, setTotals] = useState({ dr: 0, cr: 0, balance: 0 });

  useEffect(() => {
    if (!decodedName) return;

    const fetchLedgerForPdf = async () => {
      try {
        const rawEntries = await api.get(`/ledger/${encodeURIComponent(decodedName)}`);

        let runningBalance = 0;
        let totalDr = 0;
        let totalCr = 0;

        const entriesWithBalance = rawEntries.map((entry) => {
          const debit = parseFloat(entry.dr) || 0;
          const credit = parseFloat(entry.cr) || 0;
          runningBalance = runningBalance + debit - credit;
          totalDr += debit;
          totalCr += credit;

          return {
            ...entry,
            // Format date from YYYY-MM-DD to DD.MM.YYYY
            billDate: entry.billDate.split('-').reverse().join('.'),
            dr: debit ? debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
            cr: credit ? credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
            balance: runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          };
        });

        setLedgerEntries(entriesWithBalance);
        setTotals({ dr: totalDr, cr: totalCr, balance: runningBalance });
      } catch (error) {
        console.error("Failed to fetch ledger for PDF:", error);
      }
    };

    fetchLedgerForPdf();
  }, [decodedName]);

  const handleGeneratePdf = async () => {
    try {
      setGenerating(true);
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${decodedName}-ledger.pdf`);
    } catch (err) {
      alert("PDF generation failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      {/* Download Button (Styled to match theme) */}
      <button
        onClick={handleGeneratePdf}
        disabled={generating}
        className="bg-red-700 hover:bg-red-800 text-white font-semibold px-4 py-2 rounded-full shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? "..." : "PDF"}
      </button>

      {/* Hidden Print Area */}
      <div
        ref={printRef}
        style={{
          width: "1100px",
          padding: "30px",
          background: "#fff",
          border: "2px solid #000",
          position: "absolute",
          left: "-9999px",
          top: "0",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#000",
        }}
      >
        {/* Header Image */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src={headerImg}
            alt="Designer Square Header"
            style={{
              width: "100%",
              maxHeight: "180px",
              objectFit: "contain",
              borderBottom: "3px solid #a20000",
              paddingBottom: "6px",
            }}
          />
        </div>

        {/* Main Heading */}
        <div
          style={{
            textAlign: "center",
            background: "#a20000",
            color: "white",
            padding: "20px 10px",
            fontWeight: "bold",
            fontSize: "22px",
            borderRadius: "6px",
            marginBottom: "20px",
            letterSpacing: "1px",
          }}
        >
          LEDGER REPORT — {decodedName}
        </div>

        {ledgerEntries.length > 0 ? (
          <>
            {/* Summary Header */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13.5px",
                marginBottom: "10px",
              }}
            >
              <thead>
                <tr style={{ background: "#f5f5f5", border: "1px solid #000" }}>
                  <th style={{ padding: "10px", border: "1px solid #000", textAlign: "left" }}>NAME</th>
                  <th colSpan="2" style={{ padding: "20px", border: "1px solid #000", fontWeight: "bold", color: "#a20000", fontSize: "22px" }}>
                    {decodedName}
                  </th>
                  <th style={{ padding: "10px", border: "1px solid #000", textAlign: "center" }}>
                    DEBIT<br />
                    <span style={{ fontWeight: "bold", color: "#000" }}>{totals.dr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </th>
                  <th style={{ padding: "10px", border: "1px solid #000", textAlign: "center" }}>
                    CREDIT<br />
                    <span style={{ fontWeight: "bold", color: "#000" }}>{totals.cr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </th>
                  <th style={{ padding: "10px", border: "1px solid #000", textAlign: "center" }}>
                    BALANCE<br />
                    <span style={{ fontWeight: "bold", color: "red" }}>{totals.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </th>
                </tr>
                <tr style={{ background: "#a20000", color: "white" }}>
                  <th style={{ border: "1px solid #000", padding: "8px" }}>S.NO.</th>
                  <th style={{ border: "1px solid #000", padding: "8px" }}>BILL DATE</th>
                  <th style={{ border: "1px solid #000", padding: "8px" }}>PARTICULARS</th>
                  <th style={{ border: "1px solid #000", padding: "8px" }}>DR.</th>
                  <th style={{ border: "1px solid #000", padding: "8px" }}>CR.</th>
                  <th style={{ border: "1px solid #000", padding: "8px" }}>BALANCE</th>
                </tr>
              </thead>

              <tbody>
                {ledgerEntries.map((row) => (
                  <tr key={row.id} style={{ background: row.sNo % 2 === 0 ? "#f9f9f9" : "white" }}>
                    <td style={{ border: "1px solid #000", textAlign: "center", padding: "6px" }}>{row.sNo}</td>
                    <td style={{ border: "1px solid #000", textAlign: "center", padding: "6px" }}>{row.billDate}</td>
                    <td style={{ border: "1px solid #000", padding: "6px 10px" }}>{row.particulars}</td>
                    <td style={{ border: "1px solid #000", textAlign: "right", padding: "6px 10px" }}>{row.dr}</td>
                    <td style={{ border: "1px solid #000", textAlign: "right", padding: "6px 10px" }}>{row.cr}</td>
                    <td style={{ border: "1px solid #000", textAlign: "right", padding: "6px 10px" }}>{row.balance}</td>
                  </tr>
                ))}

                {/* Totals Row */}
                <tr style={{ background: "#a20000", color: "white", fontWeight: "bold" }}>
                  <td colSpan={3} style={{ textAlign: "center", padding: "8px", border: "1px solid #000" }}>
                    TOTAL
                  </td>
                  <td style={{ textAlign: "right", padding: "8px", border: "1px solid #000" }}>
                    {totals.dr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: "right", padding: "8px", border: "1px solid #000" }}>
                    {totals.cr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "8px",
                      border: "1px solid #a20000",
                      color: "#ffcccc",
                      background: "#a20000",
                    }}
                  >
                    {totals.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              style={{
                marginTop: "25px",
                textAlign: "right",
                fontSize: "12px",
                color: "#333",
                fontStyle: "italic",
              }}
            >
              Generated by <b style={{ color: "#a20000" }}>Designer Square</b> •{" "}
              {new Date().toLocaleDateString()}
            </div>
          </>
        ) : (
          <p style={{ color: "#a20000", textAlign: "center", padding: "20px", fontWeight: "bold" }}>
            ⚠️ No ledger entries found for <b>{decodedName}</b>
          </p>
        )}
      </div>
    </div>
  );
};

export default Pdf;