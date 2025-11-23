import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, X, Trash2, AlertTriangle, BookUser } from "lucide-react";
import api from "../../api";
import DisplayInvoiceDetails from "./DisplayInvoiceDetails";
import LedgerTable from "./LedgerTable";

// ... (modalVariants and pageVariants are unchanged) ...
const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 50,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};
// --- (End of variants) ---

// --- NEW HELPER FUNCTION ---
const getCurrentFinancialYear = () => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0 = Jan, 3 = Apr
  const currentYear = today.getFullYear();
  let startYear;
  if (currentMonth >= 3) {
    // April or later, financial year started this year
    startYear = currentYear;
  } else {
    // Jan, Feb, Mar, financial year started last year
    startYear = currentYear - 1;
  }
  const endYearShort = (startYear + 1).toString().substring(2);
  return `${startYear}-${endYearShort}`;
};

export default function Ledger() {
  const navigate = useNavigate();
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  // --- MODIFIED: Default to current financial year ---
  const selectedYear = queryParams.get("year") || getCurrentFinancialYear();

  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [totals, setTotals] = useState({ dr: 0, cr: 0, balance: 0 });
  const today = new Date().toISOString().split("T")[0];

  // ... (All modal states are unchanged) ...
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [currentPaymentEntry, setCurrentPaymentEntry] = useState(null);
  const [paymentEntry, setPaymentEntry] = useState({
    date: today,
    amount: "",
    method: "Cash",
  });
  const [showGeneralEntryModal, setShowGeneralEntryModal] = useState(false);
  const [isEditingGeneralEntry, setIsEditingGeneralEntry] = useState(false);
  const [currentGeneralEntryId, setCurrentGeneralEntryId] = useState(null);
  const [generalEntry, setGeneralEntry] = useState({
    date: today,
    particulars: "",
    amount: "",
    type: "dr",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  useEffect(() => {
    fetchLedgerData();
  }, [decodedName, selectedYear]);

  // --- (fetchLedgerData logic is unchanged) ---
  const fetchLedgerData = async () => {
    try {
      const rawEntries = await api.get(
        `/ledger/${encodeURIComponent(decodedName)}?year=${selectedYear}`
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
          displayDate: entry.billDate.split("-").reverse().join("."),
          displayDr: debit
            ? debit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "",
          displayCr: credit
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

      setLedgerEntries(entriesWithBalance);
      setTotals({ dr: totalDr, cr: totalCr, balance: runningBalance });
    } catch (error) {
      console.error("Failed to fetch ledger data:", error);
    }
  };

  // ... (All modal handlers: closePaymentModal, handlePaymentSubmit, etc. are unchanged) ...
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setIsEditingPayment(false);
    setCurrentPaymentEntry(null);
    setPaymentEntry({ date: today, amount: "", method: "Cash" });
  };

  const handlePaymentSubmit = async () => {
    if (!paymentEntry.date || !paymentEntry.amount) {
      alert("Please enter both date and amount.");
      return;
    }
    const body = {
      date: paymentEntry.date,
      amount: parseFloat(paymentEntry.amount),
      method: paymentEntry.method,
    };

    try {
      if (isEditingPayment) {
        await api.put(`/ledger/${currentPaymentEntry.id}`, body);
      } else {
        await api.post(`/ledger/${encodeURIComponent(decodedName)}`, body);
      }
      closePaymentModal();
      fetchLedgerData();
    } catch (error) {
      console.error("Failed to submit payment:", error);
      alert("Failed to submit payment. Please try again.");
    }
  };

  const handlePaymentEditClick = (entry) => {
    let method = "Cash";
    if (entry.particulars && entry.particulars.startsWith("PAYMENT RECEIVED")) {
      const parts = entry.particulars.split(" ");
      if (parts.length > 2) {
        method = parts.slice(2).join(" ");
      }
    }
    setPaymentEntry({
      date: entry.billDate,
      amount: entry.cr.toString(),
      method: method,
    });
    setIsEditingPayment(true);
    setCurrentPaymentEntry(entry);
    setShowPaymentModal(true);
  };

  const closeGeneralEntryModal = () => {
    setShowGeneralEntryModal(false);
    setIsEditingGeneralEntry(false);
    setCurrentGeneralEntryId(null);
    setGeneralEntry({
      date: today,
      particulars: "",
      amount: "",
      type: "dr",
    });
  };

  const handleGeneralEntrySubmit = async () => {
    if (
      !generalEntry.date ||
      !generalEntry.particulars ||
      !generalEntry.amount
    ) {
      alert("Please fill in all fields.");
      return;
    }
    const amount = parseFloat(generalEntry.amount);
    if (amount <= 0) {
      alert("Amount must be greater than zero.");
      return;
    }
    const body = {
      date: generalEntry.date,
      particulars: generalEntry.particulars,
      dr: generalEntry.type === "dr" ? amount : 0,
      cr: generalEntry.type === "cr" ? amount : 0,
    };

    try {
      if (isEditingGeneralEntry) {
        await api.put(`/ledger/${currentGeneralEntryId}`, body);
      } else {
        await api.post(`/ledger/${encodeURIComponent(decodedName)}`, body);
      }
      closeGeneralEntryModal();
      fetchLedgerData();
    } catch (error) {
      console.error("Failed to submit general entry:", error);
      alert("Failed to submit entry. Please try again.");
    }
  };

  const handleGeneralEntryEditClick = (entry) => {
    setGeneralEntry({
      date: entry.billDate,
      particulars: entry.particulars,
      amount: (entry.dr > 0 ? entry.dr : entry.cr).toString(),
      type: entry.dr > 0 ? "dr" : "cr",
    });
    setIsEditingGeneralEntry(true);
    setCurrentGeneralEntryId(entry.id);
    setShowGeneralEntryModal(true);
  };

  const handleEditClick = (entry) => {
    if (entry.particulars === "Opening Balance") {
      alert("The Opening Balance row cannot be edited.");
      return;
    }
    if (entry.particulars.startsWith("PAYMENT RECEIVED")) {
      handlePaymentEditClick(entry);
    } else {
      handleGeneralEntryEditClick(entry);
    }
  };

  const openDeleteConfirm = (entryId) => {
    const entry = ledgerEntries.find((e) => e.id === entryId);
    if (entry && entry.particulars === "Opening Balance") {
      alert("The Opening Balance row cannot be deleted.");
      return;
    }
    setEntryToDelete(entryId);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setEntryToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteFromPaymentModal = () => {
    if (!currentPaymentEntry) return;
    closePaymentModal();
    openDeleteConfirm(currentPaymentEntry.id);
  };

  const handleDeleteFromGeneralEntryModal = () => {
    if (!currentGeneralEntryId) return;
    closeGeneralEntryModal();
    openDeleteConfirm(currentGeneralEntryId);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      await api.delete(`/ledger/${entryToDelete}`);
      fetchLedgerData();
    } catch (error) {
      console.error("Failed to delete entry:", error);
      alert(
        "Failed to delete entry. It may be linked to an invoice and cannot be deleted."
      );
    } finally {
      closeDeleteConfirm();
    }
  };

  const handleViewInvoiceClick = async (particulars) => {
    const invoiceId = particulars.split("BY BILL ")[1];
    if (!invoiceId) {
      alert("Could not find invoice ID.");
      return;
    }
    setIsLoadingInvoice(true);
    try {
      const invoiceData = await api.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(invoiceData);
      setShowInvoiceDetails(true);
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      alert("Failed to fetch invoice details. It may have been deleted.");
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handleDeleteInvoiceFromDetails = async (invoiceId) => {
    try {
      await api.delete(`/invoices/${invoiceId}`);
      setShowInvoiceDetails(false);
      setSelectedInvoice(null);
      fetchLedgerData();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      alert("Failed to delete invoice. Please try again.");
      throw error;
    }
  };

  return (
    <motion.div
      className="bg-[radial-gradient(ellipse_at_center,_#a7f3d0_0%,_#ffffff_70%)] text-slate-900 min-h-screen p-6 md:p-12 flex flex-col items-center"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="w-full max-w-6xl mb-10">
        <button
          onClick={() => navigate("/home/dashboard")}
          className="mb-4 flex items-center text-[#0ea5a4] hover:text-[#0b8b8b] font-semibold transition-colors duration-300 group px-3 py-2 rounded-lg hover:bg-white/50 backdrop-blur-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 mr-2 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
          Back
        </button>

        <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent border-b-[3px] border-[#0ea5a4] w-fit mx-auto text-center">
          Ledger Report — {decodedName}
        </h2>
        {/* --- MODIFIED: Removed conditional '&&' --- */}
        <p className="text-center text-lg font-semibold text-[#056b66] mt-2">
          For Financial Year: {selectedYear}
        </p>
      </div>

      <LedgerTable
        decodedName={decodedName}
        ledgerEntries={ledgerEntries}
        totals={totals}
        handleViewInvoiceClick={handleViewInvoiceClick}
        handleEditClick={handleEditClick}
        isLoadingInvoice={isLoadingInvoice}
      />

      {/* --- (All Modals and FABs are unchanged) --- */}
      <AnimatePresence>
        {showPaymentModal && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={closePaymentModal}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl w-full max-w-md border-2 border-[#0ea5a4]/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-[#056b66] mb-4">
                {isEditingPayment ? "Edit Payment Entry" : "New Payment Entry"}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date:
                </label>
                <input
                  type="date"
                  value={paymentEntry.date}
                  onChange={(e) =>
                    setPaymentEntry({ ...paymentEntry, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0ea5a4]"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount:
                </label>
                <input
                  type="text"
                  value={paymentEntry.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      setPaymentEntry({ ...paymentEntry, amount: value });
                    }
                  }}
                  placeholder="Enter amount"
                  className="w-full border border-gray-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0ea5a4]"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Method:
                </label>
                <select
                  value={paymentEntry.method}
                  onChange={(e) =>
                    setPaymentEntry({ ...paymentEntry, method: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-xl p-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0ea5a4]"
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex justify-between items-center gap-2">
                <button
                  onClick={closePaymentModal}
                  className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg"
                >
                  <X size={18} />
                  <span>Cancel</span>
                </button>
                {isEditingPayment && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    onClick={handleDeleteFromPaymentModal}
                    className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg"
                    title="Delete Payment"
                  >
                    <Trash2 size={18} />
                    <span>Delete</span>
                  </motion.button>
                )}
                <button
                  onClick={handlePaymentSubmit}
                  className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] text-white font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg"
                >
                  <Check size={18} />
                  <span>{isEditingPayment ? "Update" : "Add"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showGeneralEntryModal && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={closeGeneralEntryModal}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl w-full max-w-md border-2 border-[#0ea5a4]/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-[#056b66] mb-4">
                {isEditingGeneralEntry
                  ? "Edit General Entry"
                  : "New General Entry"}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date:
                </label>
                <input
                  type="date"
                  value={generalEntry.date}
                  onChange={(e) =>
                    setGeneralEntry({ ...generalEntry, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0ea5a4]"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Particulars:
                </label>
                <input
                  type="text"
                  value={generalEntry.particulars}
                  onChange={(e) =>
                    setGeneralEntry({
                      ...generalEntry,
                      particulars: e.target.value,
                    })
                  }
                  placeholder="e.g., Opening Balance"
                  className="w-full border border-gray-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0ea5a4]"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount:
                </label>
                <input
                  type="text"
                  value={generalEntry.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      setGeneralEntry({ ...generalEntry, amount: value });
                    }
                  }}
                  placeholder="Enter amount"
                  className="w-full border border-gray-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0ea5a4]"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Entry Type:
                </label>
                <select
                  value={generalEntry.type}
                  onChange={(e) =>
                    setGeneralEntry({ ...generalEntry, type: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-xl p-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0ea5a4]"
                >
                  <option value="dr">Debit (Dr.)</option>
                  <option value="cr">Credit (Cr.)</option>
                </select>
              </div>
              <div className="flex justify-between items-center gap-2">
                <button
                  onClick={closeGeneralEntryModal}
                  className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg"
                >
                  <X size={18} />
                  <span>Cancel</span>
                </button>
                {isEditingGeneralEntry && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    onClick={handleDeleteFromGeneralEntryModal}
                    className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg"
                    title="Delete Entry"
                  >
                    <Trash2 size={18} />
                    <span>Delete</span>
                  </motion.button>
                )}
                <button
                  onClick={handleGeneralEntrySubmit}
                  className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] text-white font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg"
                >
                  <Check size={18} />
                  <span>{isEditingGeneralEntry ? "Update" : "Add"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={closeDeleteConfirm}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl w-full max-w-md border-2 border-red-500/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-red-700 mb-4 flex items-center gap-2">
                <AlertTriangle size={24} />
                Confirm Deletion
              </h3>
              <p className="text-slate-800 mb-6">
                Are you sure you want to delete this entry? This action cannot
                be undone.
              </p>
              <div className="flex justify-between">
                <button
                  onClick={closeDeleteConfirm}
                  className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg"
                >
                  <X size={18} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg"
                >
                  <Trash2 size={18} />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showInvoiceDetails && selectedInvoice && (
          <DisplayInvoiceDetails
            invoice={selectedInvoice}
            onClose={() => {
              setShowInvoiceDetails(false);
              setSelectedInvoice(null);
            }}
            onDelete={handleDeleteInvoiceFromDetails}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isFabOpen && (
            <>
              <motion.button
                onClick={() => {
                  setShowGeneralEntryModal(true);
                  setIsFabOpen(false);
                }}
                className="bg-white text-[#0ea5a4] border-2 border-[#0ea5a4] font-semibold px-6 py-3 rounded-full flex items-center justify-center gap-2 shadow-lg"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
              >
                <BookUser size={20} />
                <span>Add General Entry</span>
              </motion.button>
              <motion.button
                onClick={() => {
                  setShowPaymentModal(true);
                  setIsFabOpen(false);
                }}
                className="bg-white text-[#0ea5a4] border-2 border-[#0ea5a4] font-semibold px-6 py-3 rounded-full flex items-center justify-center gap-2 shadow-lg"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { delay: 0.05 },
                }}
                exit={{
                  opacity: 0,
                  y: 20,
                  scale: 0.8,
                  transition: { duration: 0.15 },
                }}
                whileHover={{ scale: 1.05 }}
              >
                <Plus size={20} />
                <span>Add Payment Entry</span>
              </motion.button>
            </>
          )}
        </AnimatePresence>
        <motion.button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] text-white p-5 rounded-full shadow-xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isFabOpen ? 135 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Plus size={28} strokeWidth={3} />
        </motion.button>
      </div>
    </motion.div>
  );
}
