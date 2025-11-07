import React, { useEffect } from "react";
import Header from "./Header";
import InvoiceList from "./InvoiceList";
import InvoiceForm from "./InvoiceForm";
import { useDispatch, useSelector } from "react-redux";
import { toggleForm, fetchInvoices } from "../../store/InvoiceSlice";
import InvoiceDetails from "./InvoiceDetails";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function AppContent() {
  const dispatch = useDispatch();
  const { isFormOpen, selectedInvoice, status, error } = useSelector((state) => state.invoices);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  const handleNewInvoice = () => {
    dispatch(toggleForm());
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      // CHANGED: Swapped dark bg gradient for the light radial gradient from Home.jsx
      className="bg-[radial-gradient(ellipse_at_center,_#a7f3d0_0%,_#ffffff_70%)] text-slate-900 min-h-screen"
    >
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {status === "loading" && (
          <motion.div
            variants={childVariants}
            // CHANGED: Adjusted loading indicator for light background
            className="bg-white/80 backdrop-blur-lg text-slate-900 p-4 rounded-xl mb-6 border border-[#0ea5a4]/50 shadow-lg flex items-center justify-center space-x-2"
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
              Loading invoices...
            </span>
          </motion.div>
        )}
        {status === "failed" && error && (
          <motion.div
            variants={childVariants}
            // CHANGED: Adjusted error message for light background
            className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 border border-red-400/50 backdrop-blur-lg flex items-center justify-center"
          >
            <span className="font-semibold">{error}</span>
          </motion.div>
        )}
        <motion.div variants={childVariants}>
          <Header onNewInvoice={handleNewInvoice} />
        </motion.div>
        <motion.div variants={childVariants}>
          {selectedInvoice ? <InvoiceDetails invoice={selectedInvoice} /> : <InvoiceList />}
        </motion.div>
        {isFormOpen && <InvoiceForm invoice={selectedInvoice} />}
      </div>
    </motion.div>
  );
}

export default AppContent;