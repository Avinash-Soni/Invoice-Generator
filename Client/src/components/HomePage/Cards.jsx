import { motion } from "framer-motion";
import { FaFileInvoiceDollar, FaTable } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const cardVariants = {
  hidden: { opacity: 0, rotateY: 90 },
  visible: {
    opacity: 1,
    rotateY: 0,
    transition: { duration: 0.9, ease: "easeOut" },
  },
};

const Cards = () => {

  const navigate = useNavigate();
  
  return (
    <>
      {/* Invoice Generator Card */}
      <motion.div
        variants={cardVariants}
        whileHover={{
          scale: 1.05,
          rotate: 1,
          filter: "drop-shadow(0px 8px 20px rgba(0,0,0,0.25))",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl flex flex-col gap-4 items-center justify-center p-6 w-full max-w-sm border-2 border-[#0ea5a4]/50 text-gray-900"
      >
        <div className="text-5xl text-[#056b66]">
          <FaFileInvoiceDollar />
        </div>
        <h1 className="text-xl font-bold text-[#0ea5a4]">Invoice Generator</h1>
        <p className="text-sm text-gray-700 text-center">
          Build and customize invoices in seconds with our powerful editor.
        </p>
        <button className="mt-3 bg-[#056b66] text-white font-semibold px-5 py-2.5 rounded-full hover:bg-[#0ea5a4] transition-all" onClick={() => navigate("/home/invoiceStart")} >
          Create Invoice
        </button>
      </motion.div>

      {/* All Invoices Card */}
      <motion.div
        variants={cardVariants}
        whileHover={{
          scale: 1.05,
          rotate: -1,
          filter: "drop-shadow(0px 8px 20px rgba(0,0,0,0.25))",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl flex flex-col gap-4 items-center justify-center p-6 w-full max-w-sm border-2 border-[#0ea5a4]/50 text-gray-900"
      >
        <div className="text-5xl text-[#056b66]">
          <FaTable />
        </div>
        <h1 className="text-xl font-bold text-[#0ea5a4]">All Invoices</h1>
        <p className="text-sm text-gray-700 text-center">
          Track and manage all your invoices in one organized dashboard.
        </p>
        <button className="mt-3 bg-[#056b66] text-white font-semibold px-5 py-2.5 rounded-full hover:bg-[#0ea5a4] transition-all" onClick={() => navigate("/home/dashboard")}>
          View Dashboard
        </button>
      </motion.div>
    </>
  );
};

export default Cards;
