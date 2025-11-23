import React from "react";
import { motion } from "framer-motion";
import { FileText, Edit2 } from "lucide-react";

export default function LedgerTable({
  decodedName,
  ledgerEntries,
  totals,
  handleViewInvoiceClick,
  handleEditClick,
  isLoadingInvoice,
}) {
  return (
    <div
      id="ledger-root"
      className="w-full max-w-6xl bg-white/80 backdrop-blur-lg border-2 border-[#0ea5a4]/50 p-4 md:p-6 rounded-2xl shadow-2xl overflow-x-auto mb-10"
    >
      <table className="w-full border-collapse">
        {/* --- Table Head --- */}
        <thead>
          <tr className="border-b-2 border-[#0ea5a4]/50">
            <th className="p-3 text-left font-semibold text-slate-900 bg-slate-100/80 border border-[#0ea5a4]/30">
              NAME
            </th>
            <th
              className="p-3 text-2xl font-bold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent border border-[#0ea5a4]/30"
              colSpan={2}
            >
              {decodedName}
            </th>
            <th className="p-3 font-semibold text-center border border-[#0ea5a4]/30">
              DEBIT
              <br />
              <span className="font-bold text-[#056b66]">
                {totals.dr.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </th>
            <th className="p-3 font-semibold text-center border border-[#0ea5a4]/30">
              CREDIT
              <br />
              <span className="font-bold text-[#056b66]">
                {totals.cr.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </th>
            <th className="p-3 font-semibold text-center border border-[#0ea5a4]/30">
              BALANCE
              <br />
              <span className="font-bold text-red-700">
                {totals.balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </th>
            <th className="p-3 font-semibold text-center border border-[#0ea5a4]/30 bg-slate-100/80"></th>
          </tr>
          <tr className="bg-slate-200/80 text-slate-900">
            <th className="p-3 text-center font-semibold border border-[#0ea5a4]/30">
              S.NO.
            </th>
            <th className="p-3 text-left font-semibold border border-[#0ea5a4]/30">
              BILL DATE
            </th>
            <th className="p-3 text-left font-semibold border border-[#0ea5a4]/30">
              PARTICULARS
            </th>
            <th className="p-3 text-right font-semibold border border-[#0ea5a4]/30">
              DR.
            </th>
            <th className="p-3 text-right font-semibold border border-[#0ea5a4]/30">
              CR.
            </th>
            <th className="p-3 text-right font-semibold border border-[#0ea5a4]/30">
              BALANCE
            </th>
            <th className="p-3 text-center font-semibold border border-[#0ea5a4]/3D">
              ACTIONS
            </th>
          </tr>
        </thead>

        <tbody>
          {ledgerEntries.map((row, index) => (
            <tr
              key={row.id || `ob-${index}`} // Use index for Opening Balance row
              className={`${
                index % 2 === 0 ? "bg-white/50" : "bg-slate-50/50"
              } border-b border-[#0ea5a4]/20 text-slate-800`}
            >
              {/* --- Table data cells --- */}
              <td className="p-2 text-center border-x border-[#0ea5a4]/20">
                {row.sNo}
              </td>
              <td className="p-2 border-x border-[#0ea5a4]/20">
                {row.displayDate}
              </td>
              <td className="p-2 border-x border-[#0ea5a4]/20">
                {row.particulars}
              </td>
              <td className="p-2 text-right border-x border-[#0ea5a4]/20">
                {row.displayDr}
              </td>
              <td className="p-2 text-right border-x border-[#0ea5a4]/20">
                {row.displayCr}
              </td>
              <td className="p-2 text-right border-x border-[#0ea5a4]/20 font-medium">
                {row.balance}
              </td>

              {/* --- Action Cell Logic --- */}
              <td className="p-2 text-center border-x border-[#0ea5a4]/20">
                {row.particulars.startsWith("BY BILL ") ? (
                  // 1. If it's an INVOICE entry
                  <div className="flex justify-center items-center">
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      onClick={() => handleViewInvoiceClick(row.particulars)}
                      className="p-1.5 text-teal-700 hover:text-teal-900 rounded-full hover:bg-teal-100 disabled:text-gray-400 disabled:cursor-wait transition-colors duration-200"
                      title="View Invoice Details"
                      disabled={isLoadingInvoice}
                    >
                      <FileText size={18} />
                    </motion.button>
                  </div>
                ) : row.particulars === "Opening Balance" ? (
                  // 3. If it's the Opening Balance row, no actions
                  <span className="text-gray-400">-</span>
                ) : (
                  // 2. If it's a MANUAL entry
                  <div className="flex justify-center items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      onClick={() => handleEditClick(row)}
                      className="p-1.5 text-sky-700 hover:text-sky-900 rounded-full hover:bg-sky-100 transition-colors duration-200"
                      title="Edit Entry"
                    >
                      <Edit2 size={18} />
                    </motion.button>
                  </div>
                )}
              </td>
            </tr>
          ))}

          {/* --- Table foot total row --- */}
          <tr className="bg-slate-200/80 text-slate-900 font-bold">
            <td className="p-3 border border-[#0ea5a4]/30" colSpan={3}>
              TOTAL
            </td>
            <td className="p-3 text-right border border-[#0ea5a4]/30">
              {totals.dr.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
            <td className="p-3 text-right border border-[#0ea5a4]/30">
              {totals.cr.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
            <td className="p-3 border border-[#0ea5a4]/30"></td>
            <td className="p-3 border border-[#0ea5a4]/30"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
