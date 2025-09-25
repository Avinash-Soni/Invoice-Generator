import React from "react";
import { Button, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Filter, Plus } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { setFilter } from "../../store/InvoiceSlice";
import { motion } from "framer-motion";

const status = ["all", "paid", "pending", "draft"];

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

const menuItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

function Header({ onNewInvoice }) {
  const { invoices, filter } = useSelector((state) => state.invoices);
  const dispatch = useDispatch();

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
        <Menu as="div" className="relative">
          <MenuButton as={motion.button} variants={buttonVariants} whileHover="whileHover" whileTap="whileTap" className="flex items-center space-x-2 bg-[#056b66]/20 text-white px-4 py-2 rounded-full hover:bg-[#0ea5a4]/30 transition-all focus:outline-none focus:ring-2 focus:ring-[#0bd1c5] shadow-lg" aria-label="Filter by Status">
            <Filter size={20} className="text-white group-hover:text-[#0bd1c5] transition-colors" />
            <span>Filter by Status</span>
          </MenuButton>
          <MenuItems className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg p-3 z-10 border-2 border-[#0ea5a4]/50">
            {status.map((s, index) => (
              <MenuItem key={s}>
                {({ active }) => (
                  <motion.button
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    className={`w-full text-left px-4 py-2 rounded-lg capitalize ${active ? "bg-[#056b66]/30" : ""} ${filter === s ? "text-[#0bd1c5] font-semibold" : "text-white"} transition-colors`}
                    onClick={() => dispatch(setFilter(s))}
                  >
                    {s}
                  </motion.button>
                )}
              </MenuItem>
            ))}
          </MenuItems>
        </Menu>
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