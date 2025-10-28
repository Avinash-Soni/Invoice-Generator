import { format, parseISO } from "date-fns";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteInvoice, setSelectedInvoice, toggleForm } from "../../store/InvoiceSlice"; 
import InvoicePDF from "./InvoicePDF";
import { Download, X, Check, Clock } from "lucide-react";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { motion } from "framer-motion";

// ... (variants definitions remain the same)
const detailsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 },
  },
};

const buttonVariants = {
  whileHover: {
    scale: [1, 1.05, 1.03, 1.05, 1.03],
    boxShadow: "0px 0px 15px rgba(11, 209, 197, 0.5)",
    transition: { duration: 0.6, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
  },
  whileTap: {
    scale: 0.9,
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};
// ...

function InvoiceDetails({ invoice }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.invoices);
  const [actionError, setActionError] = useState(null);

  // State for new modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const handleDelete = async () => {
    setActionError(null);
    try {
      console.log("Attempting to delete invoice with ID:", invoice.id);
      await dispatch(deleteInvoice(invoice.id)).unwrap();
      setIsDeleteModalOpen(false); // Close modal on success
      dispatch(setSelectedInvoice(null)); // This will unmount the component
    } catch (err) {
      console.error("Delete Invoice Error:", err);
      setActionError(err.message || "Failed to delete invoice");
      setIsDeleteModalOpen(false); // Close modal on error to show banner
    }
  };

  const handleEdit = () => {
    dispatch(toggleForm());
  };

  const formatDate = (dateString) => {
    // ... (function logic remains the same)
    try {
      const date = parseISO(dateString);
      return format(date, "dd MMM yyyy");
    } catch (err) {
      return "Invalid Date";
    }
  };

  const isPaid = invoice?.status === "paid";

  // Wrapped return in a React Fragment <> to add modals
  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-start justify-center overflow-y-auto py-8">
        <motion.div
          variants={detailsVariants}
          initial="hidden"
          animate="visible"
          className="bg-slate-800/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-5xl mt-8 mb-8 text-white border-2 border-[#0bd1c5]/50 shadow-2xl"
        >
          {actionError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 text-red-300 p-4 rounded-xl mb-6 border border-red-400/50 backdrop-blur-lg flex items-center justify-center"
            >
              {actionError}
            </motion.div>
          )}
          {status === "loading" && (
             // ... (loading indicator JSX remains the same)
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/10 text-white p-4 rounded-xl mb-6 border border-[#0bd1c5]/50 backdrop-blur-lg flex items-center justify-center space-x-2"
            >
              <svg
                className="animate-spin h-5 w-5 text-[#0bd1c5]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent font-semibold">
                Processing...
              </span>
            </motion.div>
          )}
          <div className="bg-slate-800/10 backdrop-blur-lg rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center mb-6 border border-[#0bd1c5]/50 shadow-lg">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
               {/* ... (Status display logic) ... */}
              <span className="text-white/70 font-semibold">Status</span>
              <div
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 font-bold bg-gradient-to-r ${isPaid ? "from-[#056b66] to-[#0ea5a4]" : "from-[#0ea5a4] to-[#0bd1c5]"} text-white shadow-md`}
              >
                {isPaid ? (
                  <Check size={16} className="text-[#0bd1c5]" />
                ) : (
                  <Clock size={16} className="text-[#0bd1c5]" />
                )}
                <span className="capitalize">{invoice?.status || "N/A"}</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <motion.button
                variants={buttonVariants}
                whileHover="whileHover"
                whileTap="whileTap"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] flex items-center space-x-2 text-white font-semibold shadow-lg"
                onClick={() => setIsDownloadModalOpen(true)}
                aria-label="Download Invoice"
              >
                <Download size={20} className="text-white" />
                <span>Download</span>
              </motion.button>
              
              {!isPaid && (
                <>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="whileHover"
                    whileTap="whileTap"
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-[#056b66] to-[#0ea5a4] hover:from-[#0ea5a4] hover:to-[#0bd1c5] font-semibold text-white shadow-lg"
                    onClick={handleEdit}
                    aria-label="Edit Invoice"
                  >
                    Edit
                  </motion.button>
                  {/* REMOVED: "Mark as Paid" button */}
                </>
              )}
              
              <motion.button
                variants={buttonVariants}
                whileHover="whileHover"
                whileTap="whileTap"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-semibold text-white shadow-lg"
                onClick={() => setIsDeleteModalOpen(true)}
                aria-label="Delete Invoice"
              >
                Delete
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="whileHover"
                whileTap="whileTap"
                type="button"
                className="text-white hover:text-[#0bd1c5] p-3 rounded-full bg-[#056b66]/20"
                onClick={() => dispatch(setSelectedInvoice(null))}
                aria-label="Close Invoice Details"
              >
                <X size={24} />
              </motion.button>
            </div>
          </div>
          <motion.div
            variants={detailsVariants}
            className="bg-slate-800/10 backdrop-blur-lg rounded-xl p-8 border border-[#0bd1c5]/50 shadow-lg"
          >
            {/* ... (All invoice table details remain the same) ... */}
             <div className="flex flex-col sm:flex-row justify-between mb-8">
              <div>
                <h2 className="text-xl font-extrabold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
                  <span className="text-[#0bd1c5]">#</span>{invoice?.id || "N/A"}
                </h2>
                <p className="text-white/70 text-sm">{invoice?.projectDescription || "No Description"}</p>
              </div>
              <div className="text-right text-white/70 text-sm mt-4 sm:mt-0">
                <p>{invoice?.billFrom?.streetAddress || "N/A"}</p>
                <p>
                  {invoice?.billFrom?.city && invoice?.billFrom?.postCode
                    ? `${invoice.billFrom.city}, ${invoice.billFrom.postCode}`
                    : "N/A"}
                </p>
                <p>{invoice?.billFrom?.country || "N/A"}</p>
              </div>
            </div>
            {/* ... (Rest of the invoice details JSX) ... */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {/* ... */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 border-t border-[#0bd1c5]/50 pt-6">
                {/* ... */}
            </div>
            <div className="bg-[#056b66]/20 rounded-xl overflow-hidden shadow-inner">
                {/* ... (Table) ... */}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Download Confirmation Modal (Light Theme) */}
      {isDownloadModalOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsDownloadModalOpen(false)} 
        >
          <div 
            className="bg-white/80 backdrop-blur-lg rounded-xl border border-[#0ea5a4]/50 shadow-lg p-6 max-w-sm mx-4 text-slate-900"
            onClick={(e) => e.stopPropagation()} 
          >
            <h2 className="text-2xl font-bold mb-4">Confirm Download</h2>
            <p className="mb-6 text-slate-700">Do you want to download this invoice as a PDF?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-slate-800 px-6 py-2 rounded-full font-medium transition-all"
              >
                Cancel
              </button>
              <PDFDownloadLink
                document={<InvoicePDF invoice={invoice} />}
                fileName={`invoice-${invoice?.id || "unknown"}.pdf`}
                className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] text-white px-6 py-2 rounded-full font-medium shadow-lg transition-all flex items-center space-x-2"
                onClick={() => setIsDownloadModalOpen(false)}
              >
                {({ loading }) => (
                  loading ? (
                    <span>Loading...</span>
                  ) : (
                    <>
                      <Download size={18} className="mr-1" />
                      <span>Download</span>
                    </>
                  )
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Light Theme) */}
      {isDeleteModalOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsDeleteModalOpen(false)} 
        >
          <div 
            className="bg-white/80 backdrop-blur-lg rounded-xl border border-[#0ea5a4]/50 shadow-lg p-6 max-w-sm mx-4 text-slate-900"
            onClick={(e) => e.stopPropagation()} 
          >
            <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6 text-slate-700">Are you sure you want to delete invoice #{invoice?.id}? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-slate-800 px-6 py-2 rounded-full font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-full font-medium shadow-lg transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InvoiceDetails;