import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useParams } from "react-router-dom";
import headerImg from "../../assets/header.jpg";
import api from "../../api";

const Pdf = ({ customerName: propName, selectedYear }) => {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name || propName || "");

  const printRef = useRef();
  const headerRef = useRef();
  // contentRef is no longer needed

  const [generating, setGenerating] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState([]); // Keep for totals
  const [pagedEntries, setPagedEntries] = useState([]); // For pagination
  const [totals, setTotals] = useState({ dr: 0, cr: 0, balance: 0 });

  // --- CONFIGURATION ---
  const ENTRIES_PER_PAGE = 20; // <--- *** THIS IS THE CHANGE ***
  // A4 height is ~297mm. Header is ~38mm (1.5in).
  // Content margin is 1in (25.4mm).
  // Usable content height is ~234mm.
  // In pixels (at 72dpi), 234mm is ~880px. We use 900px for safety.
  const CONTENT_MIN_HEIGHT_PX = "900px"; // This makes short pages fill the space

  useEffect(() => {
    if (!decodedName) return;

    const fetchLedgerForPdf = async () => {
      try {
        const yearQuery =
          selectedYear && selectedYear !== "All"
            ? `?year=${selectedYear}`
            : "";
        const rawEntries = await api.get(
          `/ledger/${encodeURIComponent(decodedName)}${yearQuery}`
        );

        let runningBalance = 0;
        let totalDr = 0;
        let totalCr = 0;

        const entriesWithBalance = rawEntries.map((entry) => {
          const debit = parseFloat(entry.dr) || 0;
          const credit = parseFloat(entry.cr) || 0;

          totalDr += debit;
          totalCr += credit;
          runningBalance = runningBalance + debit - credit;

          return {
            ...entry,
            sNo: entry.sNo,
            billDate: entry.billDate.split("-").reverse().join("."),
            dr: debit
              ? debit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "",
            cr: credit
              ? credit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "",
            balance: runningBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          };
        });

        setLedgerEntries(entriesWithBalance); // Keep original for totals
        setTotals({ dr: totalDr, cr: totalCr, balance: runningBalance });

        // --- NEW CHUNKING LOGIC ---
        const chunks = [];
        for (
          let i = 0;
          i < entriesWithBalance.length;
          i += ENTRIES_PER_PAGE
        ) {
          chunks.push(entriesWithBalance.slice(i, i + ENTRIES_PER_PAGE));
        }
        setPagedEntries(chunks); // This is our array of pages
        // --- END NEW CHUNKING ---
      } catch (error) {
        console.error("Failed to fetch ledger for PDF:", error);
      }
    };

    fetchLedgerForPdf();
  }, [decodedName, selectedYear]);

  // --- *** NEW PAGE-BY-PAGE PDF GENERATION *** ---
  const handleGeneratePdf = async () => {
    try {
      setGenerating(true);
      const headerElement = headerRef.current;
      // Get *all* the page content elements
      const contentElements =
        printRef.current.querySelectorAll(".pdf-page-content");

      if (!headerElement) {
        throw new Error("Header element not found.");
      }
      
      // Handle "No entries found" case
      if (contentElements.length === 0) {
        if (ledgerEntries.length === 0) {
           const noEntriesElement = printRef.current.querySelector(".no-entries-page");
           if (!noEntriesElement) throw new Error("Print elements not found.");

           // Just print the single "no entries" page
           const headerCanvas = await html2canvas(headerElement, { scale: 2, useCORS: true });
           const contentCanvas = await html2canvas(noEntriesElement, { scale: 2, useCORS: true });
           
           const pdf = new jsPDF("p", "mm", "a4");
           const pdfWidth = pdf.internal.pageSize.getWidth();
           const leftMargin = 25.4;
           const usableWidth = pdfWidth - leftMargin * 2;
           
           const headerHeight = (headerCanvas.height * pdfWidth) / headerCanvas.width;
           const contentHeight = (contentCanvas.height * usableWidth) / contentCanvas.width;
           
           pdf.addImage(headerCanvas.toDataURL("image/png", 1.0), "PNG", 0, 0, pdfWidth, headerHeight);
           pdf.addImage(contentCanvas.toDataURL("image/png", 1.0), "PNG", leftMargin, headerHeight + 10, usableWidth, contentHeight);
           
           pdf.save(`${decodedName}-ledger.pdf`);
           return;
        }
        throw new Error("Content elements not found.");
      }


      // 1. Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 2. Define Margins & Dimensions
      const leftMargin = 25.4; // 1 inch
      const rightMargin = 25.4; // 1 inch
      const topMarginInches = 2.8;
      const topMarginMM = topMarginInches * 25.4; // ~38.1mm

      const pdfWidth = pdf.internal.pageSize.getWidth();
      // const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pdfWidth - leftMargin - rightMargin;

      // 3. Process Header (once)
      const headerCanvas = await html2canvas(headerElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const headerImgData = headerCanvas.toDataURL("image/png", 1.0);
      // Calculate header height *relative to full PDF width*
      const headerHeight = (headerCanvas.height * pdfWidth) / headerCanvas.width;

      // Use the *larger* of the calculated height or your 1.5in request
      const finalTopMargin = Math.max(headerHeight, topMarginMM);

      // 4. Process Content Pages (in a loop)
      for (let i = 0; i < contentElements.length; i++) {
        const contentElement = contentElements[i];

        const contentCanvas = await html2canvas(contentElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const contentImgData = contentCanvas.toDataURL("image/png", 1.0);

        // Calculate content height *relative to usable (margined) width*
        const contentHeight =
          (contentCanvas.height * usableWidth) / contentCanvas.width;

        // Add a new page (except for the first iteration)
        if (i > 0) {
          pdf.addPage();
        }

        // --- Add Header to Page ---
        pdf.addImage(
          headerImgData,
          "PNG",
          0,
          0, // Place at top-left
          pdfWidth,
          headerHeight // Use actual calculated header height
        );

        // --- Add Content to Page ---
        pdf.addImage(
          contentImgData,
          "PNG",
          leftMargin,
          finalTopMargin, // Place *below* header (at 1.5in or header height)
          usableWidth,
          contentHeight
        );
      } // End loop

      pdf.save(`${decodedName}-ledger.pdf`);
    } catch (err) {
      alert("PDF generation failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };
  // --- *** END NEW FUNCTION *** ---

  return (
    <div>
      <button
        onClick={handleGeneratePdf}
        disabled={generating}
        className="bg-red-700 hover:bg-red-800 text-white font-semibold px-4 py-2 rounded-full shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? "..." : "PDF"}
      </button>

      {/* --- Hidden Print Area --- */}
      <div
        ref={printRef}
        style={{
          width: "750px", // A4-ish width with padding
          padding: "30px", // Base padding
          background: "#fff",
          border: "2px solid #000",
          position: "absolute",
          left: "-9999px",
          top: "0",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#000",
        }}
      >
        {/* --- Header Section (Captured Once) --- */}
        <div ref={headerRef}>
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
          <div
            style={{
             display: "flex",            // 1. Use Flexbox layout
              justifyContent: "center",   // 2. Center content Horizontally
              alignItems: "center",       // 3. Center content Vertically
              textAlign: "center",        // 4. Ensure multi-line text stays centered
              background: "#a20000",
              color: "white",
              padding: "12px 10px 25px 10px",       
              fontWeight: "bold",
              fontSize: "20px",
              borderRadius: "6px",
              marginBottom: "10px",
              letterSpacing: "1px",
              lineHeight: "1.2",
            }}
          >
            LEDGER REPORT — {decodedName}
          </div>
        </div>
        {/* --- End Header Section --- */}

        {/* --- Content Pages (Mapped) --- */}
        {/* This div is just a container */}
        <div>
          {pagedEntries.length > 0 ? (
            pagedEntries.map((pageEntries, pageIndex) => (
              // This is the div we capture for each page
              <div
                key={pageIndex}
                className="pdf-page-content"
                style={{
                  width: "570px",
                  margin: "0 auto",
                  minHeight: CONTENT_MIN_HEIGHT_PX, // <-- FILLS THE PAGE
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {/* Year on first page only */}
                  {pageIndex === 0 && selectedYear && selectedYear !== "All" && (
                    <div
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        fontSize: "14px",
                        color: "#a20000",
                        marginBottom: "20px",
                      }}
                    >
                      For Financial Year: {selectedYear}
                    </div>
                  )}

                  {/* Table for this page */}
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "11px",
                      marginBottom: "10px",
                    }}
                  >
                    {/* Headers on *every* page */}
                    <thead>
                      <tr
                        style={{
                          background: "#f5f5f5",
                          border: "1px solid #000",
                        }}
                      >
                        <th style={{ padding: "8px", border: "1px solid #000", textAlign: "left" }}>
                          NAME
                        </th>
                        <th colSpan="2" style={{ padding: "12px 10px 22px 10px", border: "1px solid #000", fontWeight: "bold", color: "#a20000", fontSize: "18px" }}>
                          {decodedName}
                        </th>
                        <th style={{ padding: "8px", border: "1px solid #000", textAlign: "center" }}>
                          DEBIT
                          <br />
                          <span style={{ fontWeight: "bold", color: "#000" }}>
                            {totals.dr.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </th>
                        <th style={{ padding: "8px", border: "1px solid #000", textAlign: "center" }}>
                          CREDIT
                          <br />
                          <span style={{ fontWeight: "bold", color: "#000" }}>
                            {totals.cr.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </th>
                        <th style={{ padding: "8px", border: "1px solid #000", textAlign: "center" }}>
                          BALANCE
                          <br />
                          <span style={{ fontWeight: "bold", color: "red" }}>
                            {totals.balance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </th>
                      </tr>
                      <tr style={{ background: "#a20000", color: "white" }}>
                        <th style={{ border: "1px solid #000", padding: "12px 10px 22px 10px" }}> S.NO. </th>
                        <th style={{ border: "1px solid #000", padding: "12px 10px 22px 10px" }}> BILL DATE </th>
                        <th style={{ border: "1px solid #000", padding: "12px 10px 22px 10px" }}> PARTICULARS </th>
                        <th style={{ border: "1px solid #000", padding: "12px 10px 22px 10px" }}> DR. </th>
                        <th style={{ border: "1px solid #000", padding: "12px 10px 22px 10px" }}> CR. </th>
                        <th style={{ border: "1px solid #000", padding: "12px 10px 22px 10px" }}> BALANCE </th>
                      </tr>
                    </thead>

                    {/* Entries for *this page* */}
                    <tbody>
                      {pageEntries.map((row, index) => (
                        <tr
                          key={row.id || `ob-${pageIndex}-${index}`}
                          style={{
                            background: row.sNo % 2 === 0 ? "#f9f9f9" : "white",
                            pageBreakInside: "avoid",
                          }}
                        >
                          <td style={{ border: "1px solid #000", textAlign: "center", padding: "5px" }}>
                            {row.sNo}
                          </td>
                          <td style={{ border: "1px solid #000", textAlign: "center", padding: "5px" }}>
                            {row.billDate}
                          </td>
                          <td style={{ border: "1px solid #000", padding: "5px 8px" }}>
                            {row.particulars}
                          </td>
                          <td style={{ border: "1px solid #000", textAlign: "right", padding: "5px 8px" }}>
                            {row.dr}
                          </td>
                          <td style={{ border: "1px solid #000", textAlign: "right", padding: "5px 8px" }}>
                            {row.cr}
                          </td>
                          <td style={{ border: "1px solid #000", textAlign: "right", padding: "5px 8px" }}>
                            {row.balance}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Totals row on *last page only* */}
                    {pageIndex === pagedEntries.length - 1 && (
                      <tfoot style={{ pageBreakInside: "avoid" }}>
                        <tr
                          style={{
                            background: "#a20000",
                            color: "white",
                            fontWeight: "bold",
                          }}
                        >
                          <td colSpan={3} style={{ textAlign: "center", padding: "12px 10px 22px 10px", border: "1px solid #000" }}>
                            TOTAL
                          </td>
                          <td style={{ textAlign: "right", padding: "12px 10px 22px 10px", border: "1px solid #000" }}>
                            {totals.dr.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td style={{ textAlign: "right", padding: "12px 10px 22px 10px", border: "1px solid #000" }}>
                            {totals.cr.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td style={{ textAlign: "right", padding: "12px 10px 22px 10px", border: "1px solid #a20000", color: "#ffcccc", background: "#a20000" }}>
                            {totals.balance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Generated-by on *last page only* */}
                {pageIndex === pagedEntries.length - 1 && (
                  <div
                    style={{
                      marginTop: "25px",
                      textAlign: "right",
                      fontSize: "9px",
                      color: "#333",
                      fontStyle: "italic",
                      pageBreakInside: "avoid",
                    }}
                  >
                    Generated by <b style={{ color: "#a20000" }}>Designer Square</b>{" "}
                    • {new Date().toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          ) : (
            // "No entries" message
            <div 
              className="no-entries-page"
              style={{ width: "570px", margin: "0 auto", minHeight: "200px" }}
            >
              <p
                style={{
                  color: "#a20000",
                  textAlign: "center",
                  padding: "20px",
                  fontWeight: "bold",
                }}
              >
                ⚠️ No ledger entries found for <b>{decodedName}</b>
              </p>
            </div>
          )}
        </div>
        {/* --- End Content Pages --- */}
      </div>
    </div>
  );
};

export default Pdf;