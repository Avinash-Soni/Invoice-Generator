import React from "react";
import { Plus } from 'lucide-react'; 
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

// Animation variants
const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const buttonVariants = {
  whileHover: {
    scale: [1, 1.05, 1.03, 1.05, 1.03],
    boxShadow: "0px 0px 15px rgba(14, 165, 164, 0.5)",
    transition: { duration: 0.6, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
  },
  whileTap: {
    scale: 0.9,
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
};

function Header({ onNewInvoice }) {
  const { invoices } = useSelector((state) => state.invoices);

  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col sm:flex-row items-center justify-between py-6"
    >
      <div className="mb-4 sm:mb-0">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
          Invoices
        </h1>
        <p className="text-white/70 text-sm mt-1">
          {invoices.length === 0 ? "No Invoices" : `There are ${invoices.length} Total Invoices`}
        </p>
      </div>
      <div className="flex items-center space-x-6">

        <motion.button
          variants={buttonVariants}
          whileHover="whileHover"
          whileTap="whileTap"
          type="button"
          className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] text-white px-6 py-2 rounded-full flex items-center space-x-2 shadow-lg transition-all"
          onClick={onNewInvoice}
          aria-label="Create New Invoice"
        >
          <div className="bg-gradient-to-r from-[#056b66] to-[#0ea5a4] rounded-full p-2">
            <Plus size={16} className="text-white" />
          </div>
          <span>New Invoice</span>
        </motion.button>
      </div>
    </motion.header>
  );
}

export default Header;