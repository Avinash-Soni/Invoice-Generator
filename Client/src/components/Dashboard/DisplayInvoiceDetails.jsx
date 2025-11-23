import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "../CreateInvoice/InvoicePDF"; // (Adjust path if needed)

// --- Modal animation variants ---
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

// --- Invoice Details animation variants ---
const detailsVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.95,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

const DisplayInvoiceDetails = ({ invoice, onClose, onDelete }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const confirmDelete = async () => {
    setActionError(null);
    setIsDeleting(true);
    try {
      await onDelete(invoice.id);
      // onClose will be called by the parent after deletion
    } catch (err) {
      setActionError(err.message || "Failed to delete invoice");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false); // Close modal on success or error
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd MMM, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  // --- CORRECTED TAX LOGIC ---
  // 1. Get GST percentage from invoice, default to 18
  //    We check isNaN because parseFloat(0) is 0 (which is falsy)
  //    This logic correctly handles 0, null, and undefined.
  const parsedGst = parseFloat(invoice.gstPercent);
  const gstPercent = isNaN(parsedGst) ? 18 : parsedGst;
  const gstRate = gstPercent / 100; // This will be 0.00 if gstPercent is 0
  // --- END OF FIX ---

  // 2. Calculate values
  const taxableValue =
    invoice.subtotal ||
    invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);

  // This will now correctly use gstRate (e.g., 0.00) if invoice.gstAmount is not present
  const gstAmount = invoice.gstAmount ?? taxableValue * gstRate; // Use ?? for 0
  const totalAmount = invoice.total ?? taxableValue + gstAmount; // Use ?? for 0
  const centralTax = gstAmount / 2;
  const stateTax = gstAmount / 2;

  // 3. Define labels needed for sub-components
  // For the main total (e.g., "0%" or "18%")
  const formattedGstPercent =
    gstPercent % 1 === 0 ? gstPercent.toFixed(0) : gstPercent.toFixed(2);

  // For the GstTable (e.g., "0%" or "9%")
  const rate = gstPercent / 2;
  const formattedRate = rate % 1 === 0 ? rate.toFixed(0) : rate.toFixed(2);
  const rateLabel = `${formattedRate}%`;

  const InvoiceHeader = () => (
    <div className="text-center border-b-2 border-black pb-4 mb-4">
      <h2 className="text-3xl font-bold text-[#056b66]">TAX INVOICE</h2>
    </div>
  );

  const CloseButton = () => (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-1 hover:bg-red-100/50"
      aria-label="Close Invoice"
    >
      <X size={28} />
    </button>
  );

  const InfoSection = () => (
    <div className="flex flex-col md:flex-row border-b-2 border-black">
      {/* LEFT - Seller */}
      <div className="w-full md:w-1/2 border-r-0 md:border-r border-black p-4 text-sm">
        <h3 className="font-bold text-base text-[#056b66] mb-1">
          DESIGNER'S SQUARE
        </h3>
        <p>
          {invoice.billFrom?.streetAddress ||
            "Second Floor, LIG-405, Dindayal Nagar, Bhilai"}
        </p>
        <p>
          {invoice.billFrom?.city || "Distt. Durg (C.G.)"} Pin -{" "}
          {invoice.billFrom?.postCode || "490020"}
        </p>
        <p className="mt-2">Mo. No. : 77228 28880, 86029 48880</p>
        <p>GSTIN : {invoice.billFrom?.gstin || "22DPRPS5517H3ZG"}</p>
        <p>
          E-MAIL : {invoice.billFrom?.email || "designersquarebhilai@gmail.com"}
        </p>
      </div>

      {/* RIGHT - Invoice Meta */}
      <div className="w-full md:w-1/2 text-sm">
        <div className="flex border-b border-black">
          <div className="w-1/2 border-r border-black p-3">
            <p className="font-semibold">Invoice No.</p>
            <p className="text-gray-700">{invoice.id}</p>
          </div>
          <div className="w-1/2 p-3">
            <p className="font-semibold">Dated</p>
            <p className="text-gray-700">{formatDate(invoice.invoiceDate)}</p>
          </div>
        </div>
        <div className="flex border-b border-black">
          <div className="w-1/2 border-r border-black p-3">
            <p className="font-semibold">Delivery Note</p>
            <p className="text-gray-700">
              {invoice.projectDescription || "N/A"}
            </p>
          </div>
          <div className="w-1/2 p-3">
            <p className="font-semibold">Mode/Terms of Payment</p>
            <p className="text-gray-700">{invoice.termsOfPayment || "N/A"}</p>
          </div>
        </div>
        <div className="flex">
          <div className="w-1/2 border-r border-black p-3">
            <p className="font-semibold">Supplier's Ref.</p>
            <p className="text-gray-700">{invoice.suppliersRef || "N/A"}</p>
          </div>
          <div className="w-1/2 p-3">
            <p className="font-semibold">Other Reference(s)</p>
            <p className="text-gray-700">{invoice.otherRef || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const BuyerBankSection = () => (
    <div className="flex flex-col md:flex-row border-b-2 border-black">
      {/* Buyer */}
      <div className="w-full md:w-1/2 border-r-0 md:border-r border-black p-4 text-sm">
        <p className="font-bold text-[#056b66] mb-1">BUYER:</p>
        <p className="font-bold text-base text-gray-900">
          {invoice.clientName}
        </p>
        <p className="text-gray-700">
          {invoice.billTo?.streetAddress || "N/A"}
        </p>
        <p className="text-gray-700">
          {invoice.billTo?.city}, {invoice.billTo?.postCode}
        </p>
        <p className="mt-2">
          <span className="font-semibold text-gray-800">GST No. :</span>{" "}
          {invoice.billTo?.gstin || "N/A"}
        </p>
      </div>
      {/* Bank */}
      <div className="w-full md:w-1/2 p-4 text-sm">
        <p className="font-bold text-[#056b66] mb-1">BANK DETAILS</p>
        <p>
          <span className="font-semibold text-gray-800">BANK NAME :</span>{" "}
          DESIGNER SQUARE
        </p>
        <p>
          <span className="font-semibold text-gray-800">ACCOUNT NUMBER :</span>{" "}
          3451935031
        </p>
        <p>
          <span className="font-semibold text-gray-800">IFSC CODE :</span>{" "}
          CBIN0283481
        </p>
        <p>
          <span className="font-semibold text-gray-800">BRANCH NAME :</span>{" "}
          CENTRAL BANK OF INDIA
        </p>
      </div>
    </div>
  );

  const ItemsTable = () => (
    <div className="overflow-x-auto border-b-2 border-black">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-gray-50">
          <tr className="border-b border-black">
            <th className="border-r border-black py-3 px-3 text-left font-medium">
              S.NO.
            </th>
            <th className="border-r border-black py-3 px-3 text-left font-medium">
              PARTICULARS
            </th>
            <th className="border-r border-black py-3 px-3 text-center font-medium">
              QTY.
            </th>
            <th className="border-r border-black py-3 px-3 text-right font-medium">
              RATE
            </th>
            <th className="py-3 px-3 text-right font-medium">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, index) => (
            <tr key={index} className="border-b border-black last:border-b-0">
              <td className="border-r border-black py-2.5 px-3">
                {String(index + 1).padStart(2, "0")}.
              </td>
              <td className="border-r border-black py-2.5 px-3">{item.name}</td>
              <td className="border-r border-black py-2.5 px-3 text-center">
                {item.quantity}
              </td>
              <td className="border-r border-black py-2.5 px-3 text-right">
                {item.rate.toFixed(2)}
              </td>
              <td className="py-2.5 px-3 text-right">
                {item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const TotalsSection = () => (
    <div className="flex justify-end border-b-2 border-black">
      <div className="w-full md:w-2/5 border-l-0 md:border-l border-black text-sm">
        <div className="flex justify-between border-b border-black px-4 py-2">
          <span className="font-semibold">Taxable Value</span>
          <span>{taxableValue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-b border-black px-4 py-2">
          <span className="font-semibold">GST ({formattedGstPercent}%)</span>
          <span>{gstAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between px-4 py-3 bg-gray-50">
          <span className="font-bold text-base text-[#056b66]">
            TOTAL AMOUNT
          </span>
          <span className="font-bold text-base text-[#056b66]">
            ₹{totalAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  const GstTable = () => (
    <div className="mt-4">
      <p className="text-xs font-semibold mb-1">Tax Summary (Amount in INR):</p>
      <div className="border border-black rounded-md overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-50 border-b border-black text-center">
            <tr className="border-b border-black">
              <th
                rowSpan={2}
                className="border-r border-black py-2 px-1 font-medium align-middle"
              >
                HSN/SAC
              </th>
              <th
                rowSpan={2}
                className="border-r border-black py-2 px-1 font-medium align-middle"
              >
                TAXABLE VALUE
              </th>
              <th
                colSpan={2}
                className="border-r border-black py-2 px-1 font-medium"
              >
                CENTRAL TAX (CGST)
              </th>
              <th colSpan={2} className="py-2 px-1 font-medium">
                STATE TAX (SGST)
              </th>
            </tr>
            <tr className="bg-gray-100/50">
              <th className="border-r border-black py-1 px-1 font-normal">
                RATE
              </th>
              <th className="border-r border-black py-1 px-1 font-normal">
                AMOUNT
              </th>
              <th className="border-r border-black py-1 px-1 font-normal">
                RATE
              </th>
              <th className="py-1 px-1 font-normal">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="text-center">
            <tr>
              <td className="border-r border-black py-2 px-1">
                {invoice.hsn || "N/A"}
              </td>
              <td className="border-r border-black py-2 px-1">
                {taxableValue.toFixed(2)}
              </td>
              <td className="border-r border-black py-2 px-1">{rateLabel}</td>
              <td className="border-r border-black py-2 px-1">
                {centralTax.toFixed(2)}
              </td>
              <td className="border-r border-black py-2 px-1">{rateLabel}</td>
              <td className="py-2 px-1">{stateTax.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const ActionButtons = () => (
    <div className="flex flex-col items-center justify-center gap-4 mt-8 border-t border-black pt-6">
      <div className="flex gap-4">
        <PDFDownloadLink
          document={<InvoicePDF invoice={invoice} />}
          fileName={`invoice-${invoice?.id || "unknown"}.pdf`}
        >
          {({ loading }) => (
            <button
              disabled={loading}
              className="bg-[#0ea5a4] text-white font-bold px-7 py-2.5 rounded-full shadow-lg hover:bg-[#056b66] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={18} />
              {loading ? "Preparing..." : "Download PDF"}
            </button>
          )}
        </PDFDownloadLink>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-7 py-2.5 rounded-full shadow-lg transition-all flex items-center gap-2"
        >
          <Trash2 size={18} />
          Delete
        </button>
      </div>
    </div>
  );

  const DeleteConfirmationModal = () => (
    <AnimatePresence>
      {isDeleteModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white/80 backdrop-blur-lg rounded-xl border border-red-500/50 shadow-lg p-6 max-w-sm mx-4 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-red-700">
              Confirm Deletion
            </h2>
            <p className="mb-6 text-slate-700">
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </p>

            {actionError && (
              <p className="text-red-600 text-sm mb-4">{actionError}</p>
            )}

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="bg-gray-200 hover:bg-gray-300 text-slate-800 px-6 py-2 rounded-full font-medium transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium shadow-lg transition-all disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4 z-40">
      <motion.div
        variants={detailsVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative bg-white/80 backdrop-blur-lg rounded-2xl flex flex-col border-2 border-black text-slate-900 shadow-xl w-full max-w-6xl p-6 md:p-8"
      >
        <CloseButton />
        <InvoiceHeader />
        <InfoSection />
        <BuyerBankSection />
        <ItemsTable />
        <TotalsSection />
        <GstTable />
        <ActionButtons />
        <DeleteConfirmationModal />
      </motion.div>
    </div>
  );
};

export default DisplayInvoiceDetails;
