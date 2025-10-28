import React from "react";
import { ChevronRight, FileText } from "lucide-react"; 
import { useDispatch, useSelector } from "react-redux";
import { format, parseISO } from "date-fns";
import { setSelectedInvoice } from "../../store/InvoiceSlice";
import { motion } from "framer-motion";

const listVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

function InvoiceList() {
  const dispatch = useDispatch();
  const { invoices } = useSelector((state) => state.invoices);
  console.log("Invoices in store:", invoices); // Debug log

  const formatDate = (date) => {
    try {
      return format(parseISO(date), "dd MMM yyyy");
    } catch (err) {
      console.error("Date parsing error:", err);
      return "Invalid Date";
    }
  };

  const handleInvoiceClick = (invoice) => {
    dispatch(setSelectedInvoice(invoice));
  };

  if (invoices.length === 0) {
    return (
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
        // CHANGED: Light theme for "No Invoices"
        className="text-center py-12 bg-white backdrop-blur-lg rounded-xl border border-[#0ea5a4]/50 shadow-lg"
      >
        <motion.div variants={itemVariants}>
          <FileText size={48} className="mx-auto text-[#0bd1c5] mb-4" />
          <p className="text-xl font-semibold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
            No Invoices Found
          </p>
          {/* CHANGED: Light theme text */}
          <p className="text-sm text-slate-700 mt-2">
            Create a new invoice to get started.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {invoices.map((invoice) => (
        <motion.div
          variants={itemVariants}
          key={invoice.id}
          // CHANGED: Light theme for list item
          className="bg-white backdrop-blur-lg rounded-xl p-6 flex items-center justify-between hover:bg-teal-50/50 transition-all duration-200 cursor-pointer border border-[#0ea5a4]/50 shadow-lg"
          onClick={() => handleInvoiceClick(invoice)}
          role="button"
          tabIndex={0}
          aria-label={`View invoice ${invoice.id}`}
        >
          {/* CHANGED: Adjusted grid for better spacing */}
          <div className="flex-1 grid grid-cols-3 items-center gap-x-4">
            <span className="text-[#0bd1c5] font-semibold">{invoice.id}</span>
            {/* CHANGED: Swapped dueDate for invoiceDate and updated text/color */}
            <span className="text-slate-700">
              Created {formatDate(invoice.invoiceDate)}
            </span>
            {/* CHANGED: Light theme text */}
            <span className="text-slate-900 font-medium">{invoice.clientName}</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent w-32 text-right">
              ₹{Number(invoice.total || 0).toFixed(2)}
            </span>
            <ChevronRight className="text-[#0bd1c5]" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default InvoiceList;