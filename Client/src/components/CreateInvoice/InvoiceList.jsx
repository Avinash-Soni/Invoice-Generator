import React from "react";
import { ChevronRight, FileText, Check, Clock } from "lucide-react";
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
  const { invoices, filter } = useSelector((state) => state.invoices);
  console.log("Invoices in store:", invoices); // Debug log

  const filteredInvoices = invoices.filter((invoice) => {
    if (filter === "all") return true;
    return invoice.status === filter;
  });

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

  if (filteredInvoices.length === 0) {
    return (
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="text-center py-12 bg-white/10 backdrop-blur-lg rounded-xl border border-[#0ea5a4]/50 shadow-lg"
      >
        <motion.div variants={itemVariants}>
          <FileText size={48} className="mx-auto text-[#0bd1c5] mb-4" />
          <p className="text-xl font-semibold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
            No Invoices Found
          </p>
          <p className="text-sm text-white/70 mt-2">
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
      {filteredInvoices.map((invoice) => (
        <motion.div
          variants={itemVariants}
          key={invoice.id}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 flex items-center justify-between hover:bg-white/20 transition-all duration-200 cursor-pointer border border-[#0ea5a4]/50 shadow-lg"
          onClick={() => handleInvoiceClick(invoice)}
          role="button"
          tabIndex={0}
          aria-label={`View invoice ${invoice.id}`}
        >
          <div className="flex items-center space-x-6">
            <span className="text-[#0bd1c5] font-semibold">{invoice.id}</span>
            <span className="text-white/70">Due {formatDate(invoice.dueDate)}</span>
            <span className="text-white font-medium">{invoice.clientName}</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
              ₹{Number(invoice.total || 0).toFixed(2)}
            </span>
            <div
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 font-bold ${
                invoice.status === "paid"
                  ? "bg-[#056b66]/20 text-[#0bd1c5]"
                  : invoice.status === "pending"
                  ? "bg-[#0ea5a4]/20 text-[#0bd1c5]"
                  : "bg-slate-700/20 text-white/70"
              }`}
            >
              {invoice.status === "paid" ? (
                <Check size={16} className="text-[#0bd1c5]" />
              ) : (
                <Clock size={16} className="text-[#056b66]" />
              )}
              <span className="capitalize">{invoice.status}</span>
            </div>
            <ChevronRight className="text-[#0bd1c5]" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default InvoiceList;