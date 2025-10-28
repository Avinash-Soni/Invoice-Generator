import React, { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addInvoice, setSelectedInvoice, toggleForm, updateInvoice } from "../../store/InvoiceSlice";
import { format } from "date-fns";
import { motion } from "framer-motion";

const BILL_FROM = {
  name: "Designer Square",
  streetAddress: "Second Floor, LIG-405, Dindayal Nagar",
  city: "Bhilai",
  postCode: "490020",
  country: "India (C.G.)",
  gstin: "22DPRPS5517H3ZG",
  email: "designersquarebhilai@gmail.com",
};

const CLIENTS = [
  {
    clientName: "Sparsh Multispeciality Hospital Pvt. Ltd.",
    clientEmail: "",
    streetAddress: "Shriram Market, Sirsa Road, Ram Nagar",
    city: "Bhilai(C.G.)",
    postCode: "",
    country: "India",
    gstin: "22AADCP8009N2Z9",
  },
];

const getFinancialYear = () => {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = (startYear + 1).toString().slice(-2);
  return `${startYear}-${endYear}`;
};

const generateInvoiceId = (invoices) => {
  const fy = getFinancialYear();
  const prefix = `DS/${fy}/`;
  const invoicesInYear = invoices.filter((inv) => inv.id && inv.id.startsWith(prefix));
  const nextNumber = invoicesInYear.length + 1;
  const padded = String(nextNumber).padStart(4, "0");
  return `${prefix}${padded}`;
};


const getInitialFormData = () => ({
  billFrom: { ...BILL_FROM },
  billTo: { clientEmail: "", streetAddress: "", city: "", postCode: "", country: "", gstin: "" },
  clientName: "",
  items: [],
  projectDescription: "",
  suppliersRef: "",
  termsOfPayment: "",
  otherRef: "",
  invoiceDate: format(new Date(), "yyyy-MM-dd"),
  subtotal: 0,
  gstAmount: 0,
  total: 0,
});

// ... (formVariants, itemVariants, buttonVariants remain the same) ...
const formVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
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


function InvoiceForm({ invoice }) {
  const dispatch = useDispatch();
  const { invoices, status, error } = useSelector((state) => state.invoices);
  const [formData, setFormData] = useState(getInitialFormData());
  const [formError, setFormError] = useState(null);

  // ... (useEffect and logic functions remain the same) ...
  useEffect(() => {
    if (invoice) {
      setFormData({
        ...invoice,
        billFrom: { ...BILL_FROM },
        billTo: invoice.billTo || {
          clientEmail: invoice.billTo?.clientEmail || "",
          streetAddress: invoice.billTo?.streetAddress || "",
          city: invoice.billTo?.city || "",
          postCode: invoice.billTo?.postCode || "",
          country: invoice.billTo?.country || "",
          gstin: invoice.billTo?.gstin || "",
        },
        items: invoice.items.map((item) => ({
          ...item,
          unit: item.unit || "unit",
          total: item.total || item.quantity * item.rate,
        })),
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [invoice]);

  useEffect(() => {
    if (status === "failed" && error) {
      setFormError(error);
    }
  }, [status, error]);

  const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const gstAmount = subtotal * 0.18;
  const grandTotal = subtotal + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // ... (Validations remain the same) ...
    if (!formData.clientName || formData.clientName.trim() === "") {
      setFormError("Client name is required");
      return;
    }
    if (!formData.invoiceDate || formData.invoiceDate.trim() === "") {
      setFormError("Invoice date is required");
      return;
    }
    if (
      formData.items.length === 0 ||
      formData.items.some((item) => !item.name || item.name.trim() === "" || item.quantity <= 0 || item.rate < 0)
    ) {
      setFormError("At least one valid item is required (name, positive quantity, and non-negative rate)");
      return;
    }
    if (!formData.billFrom.name || !formData.billFrom.streetAddress || !formData.billTo.streetAddress) {
      setFormError("Bill From (name and streetAddress) and Bill To (streetAddress) are required");
      return;
    }


    const finalData = {
      ...formData,
      id: invoice ? invoice.id : generateInvoiceId(invoices),
      subtotal,
      gstAmount,
      total: grandTotal,
      items: formData.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        rate: item.rate,
        total: item.total,
        unit: item.unit || "unit",
      })),
      billFrom: { ...BILL_FROM },
      billTo: {
        clientEmail: formData.billTo.clientEmail || "",
        streetAddress: formData.billTo.streetAddress || "",
        city: formData.billTo.city || "",
        postCode: formData.billTo.postCode || "",
        country: formData.billTo.country || "",
        gstin: formData.billTo.gstin || "",
      },
    };

    delete finalData.paymentTerms;
    delete finalData.dueDate;
    delete finalData.status;

    try {
      if (invoice) {
        await dispatch(updateInvoice(finalData)).unwrap();
      } else {
        await dispatch(addInvoice(finalData)).unwrap();
      }
      dispatch(toggleForm());
    } catch (err) {
      console.error("Submit Invoice Error:", err);
      setFormError(err.message || "Failed to save invoice. Please check the form data and try again.");
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: "", quantity: "", rate: "", total: 0, unit: "unit" }],
    });
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    const item = { ...items[index] };
    if (field === "quantity") {
      item.quantity = value === "" ? "" : Math.max(1, parseInt(value, 10) || 1);
    } else if (field === "rate") {
      item.rate = value === "" ? "" : Math.max(0, parseFloat(value) || 0);
    } else {
      item[field] = value;
    }
    item.total = (item.quantity === "" ? 1 : item.quantity) * (item.rate === "" ? 0 : item.rate);
    items[index] = item;
    setFormData({ ...formData, items });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8">
      <style>
        {`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        // User confirmed this is max-w-5xl
        className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl w-full max-w-5xl mt-8 mb-8 text-slate-900 border-2 border-[#0ea5a4]/50 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
            {invoice ? `Edit #${invoice.id}` : "New Invoice"}
          </h2>
          <motion.button
            variants={buttonVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            type="button"
            onClick={() => dispatch(toggleForm())}
            className="text-slate-700 hover:text-[#0bd1c5] transition-colors"
            aria-label="Close Form"
          >
            <X size={28} />
          </motion.button>
        </div>
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100/80 text-red-800 p-4 rounded-lg mb-6 border border-red-300/50"
          >
            {formError}
          </motion.div>
        )}

        <form className="space-y-8" onSubmit={handleSubmit}>

          {/* === 2-COLUMN GRID FOR BILLING === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* --- BILL FROM (COLUMN 1) --- */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#0bd1c5]">Bill From</h3>
              {/* REMOVED: h-full class */}
              <div className="p-6 bg-teal-50 rounded-xl text-slate-700 text-sm shadow-inner">
                <p className="font-bold text-lg text-slate-900">{BILL_FROM.name}</p>
                <p>{BILL_FROM.streetAddress}</p>
                <p>{`${BILL_FROM.city}, ${BILL_FROM.country} - ${BILL_FROM.postCode}`}</p>
                <p className="mt-2"><strong>GSTIN:</strong> {BILL_FROM.gstin}</p>
                <p><strong>Email:</strong> {BILL_FROM.email}</p>
              </div>
            </div>

            {/* --- BILL TO (COLUMN 2) --- */}
            <div className="space-y-4 flex flex-col">
              {/* CHANGED: Wrapped header and dropdown in a flex container */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-[#0bd1c5]">Bill To</h3>
                <select
                  className="w-4/5 bg-white border border-slate-300 rounded-xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0bd1c5] transition-all"
                  value={formData.clientName || ""}
                  onChange={(e) => {
                    const selected = CLIENTS.find((c) => c.clientName === e.target.value);
                    setFormData({
                      ...formData,
                      clientName: selected?.clientName || "",
                      billTo: selected
                        ? {
                          clientEmail: selected.clientEmail,
                          streetAddress: selected.streetAddress,
                          city: selected.city,
                          postCode: selected.postCode,
                          country: selected.country,
                          gstin: selected.gstin,
                        }
                        : { clientEmail: "", streetAddress: "", city: "", postCode: "", country: "", gstin: "" },
                    });
                  }}
                  required
                  aria-label="Select Client"
                >
                  <option value="" className="text-black/50">Select a Client</option>
                  {CLIENTS.map((client, i) => (
                    <option key={i} value={client.clientName} className="text-black">
                      {client.clientName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client details preview box */}
              {/* REMOVED: flex-1 class */}
              <div className="p-6 bg-teal-50 rounded-xl text-slate-700 text-sm shadow-inner">
                {formData.clientName ? (
                  <>
                    <p className="font-bold text-lg text-slate-900">{formData.clientName}</p>
                    <p>{formData.billTo.streetAddress || "No street address"}</p>
                    <p>{`${formData.billTo.city || "N/A"}, ${formData.billTo.country || "N/A"} - ${formData.billTo.postCode || "N/A"}`}</p>
                    <p className="mt-2"><strong>GSTIN:</strong> {formData.billTo.gstin || "N/A"}</p>
                    <p><strong>Email:</strong> {formData.billTo.clientEmail || "N/A"}</p>
                  </>
                ) : (
                  <p className="text-slate-500">Client details will appear here.</p>
                )}
              </div>
            </div>
          </div>
          {/* === END 2-COLUMN GRID === */}


          {/* === INVOICE DETAILS SECTION === */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-[#0bd1c5]">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Row 1: 3-column layout */}
              <input
                type="date"
                className="bg-white border border-slate-300 rounded-xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0bd1c5] transition-all md:col-span-2"
                value={formData.invoiceDate}
                onChange={(e) => {
                  setFormData({ ...formData, invoiceDate: e.target.value });
                }}
                required
                aria-label="Invoice Date"
              />

              <input
                type="text"
                placeholder="Mode/Terms of Payment"
                value={formData.termsOfPayment}
                onChange={(e) =>
                  setFormData({ ...formData, termsOfPayment: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0bd1c5] transition-all md:col-span-2"
                aria-label="Mode or Terms of Payment"
              />

              <input
                type="text"
                placeholder="Supplier's Ref."
                value={formData.suppliersRef}
                onChange={(e) =>
                  setFormData({ ...formData, suppliersRef: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0bd1c5] transition-all md:col-span-2"
                aria-label="Supplier's Reference"
              />

              {/* Row 2: 2-column layout */}
              <input
                type="text"
                placeholder="Delivery Note"
                value={formData.projectDescription}
                onChange={(e) =>
                  setFormData({ ...formData, projectDescription: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0bd1c5] transition-all md:col-span-3"
                aria-label="Delivery Note"
              />

              <input
                type="text"
                placeholder="Other Ref."
                value={formData.otherRef}
                onChange={(e) =>
                  setFormData({ ...formData, otherRef: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0bd1c5] transition-all md:col-span-3"
                aria-label="Other Reference"
              />
            </div>
          </div>
          {/* === END INVOICE DETAILS SECTION === */}


          {/* ... (Item List section) ... */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-[#0bd1c5]">Item List</h3>
            {/* ... (items.map logic) ... */}
            {formData.items.map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className={`grid grid-cols-12 gap-4 items-center p-4 rounded-xl ${i % 2 === 0 ? 'bg-white' : 'bg-teal-50'}`}
              >
                <input
                  type="text"
                  placeholder="Item Name"
                  className="bg-white border border-slate-300 rounded-lg p-3 col-span-5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0bd1c5] transition-all"
                  value={item.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                  required
                  aria-label={`Item ${i + 1} Name`}
                />
                <input
                  type="number"
                  placeholder="Qty."
                  className="bg-white border border-slate-300 rounded-lg p-3 col-span-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0bd1c5] transition-all appearance-none"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  required
                  aria-label={`Item ${i + 1} Quantity`}
                />
                <input
                  type="number"
                  placeholder="Rate"
                  className="bg-white border border-slate-300 rounded-lg p-3 col-span-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0bd1c5] transition-all appearance-none"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => updateItem(i, "rate", e.target.value)}
                  required
                  aria-label={`Item ${i + 1} Rate`}
                />
                <div className="col-span-2 text-right font-bold text-slate-900">
                  ₹{item.total.toFixed(2)}
                </div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="whileHover"
                  whileTap="whileTap"
                  type="button"
                  className="text-slate-500 hover:text-red-500 transition-colors"
                  onClick={() => removeItem(i)}
                  aria-label={`Remove Item ${i + 1}`}
                >
                  <Trash2 size={20} />
                </motion.button>
              </motion.div>
            ))}
            <motion.button
              variants={buttonVariants}
              whileHover="whileHover"
              whileTap="whileTap"
              type="button"
              className="w-full bg-gradient-to-r from-[#0ea5a4] to-[#056b66] hover:from-[#056b66] hover:to-[#0bd1c5] rounded-full p-4 flex items-center justify-center space-x-2 text-white font-semibold shadow-lg"
              onClick={addItem}
            >
              <Plus size={20} />
              <span>Add New Item</span>
            </motion.button>
          </div>

          {/* ... (Totals and Buttons section) ... */}
          <div className="flex flex-col space-y-6 pt-6">
            <div className="bg-teal-50 rounded-xl p-6 space-y-3 shadow-inner">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>GST (18%)</span>
                <span className="font-bold text-slate-900">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-900 border-t border-slate-300 pt-3 mt-3">
                <span className="text-xl font-bold">Grand Total</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <motion.button
                variants={buttonVariants}
                whileHover="whileHover"
                whileTap="whileTap"
                type="button"
                className="bg-gradient-to-r from-[#056b66] to-[#0ea5a4] hover:from-[#0ea5a4] hover:to-[#0bd1c5] rounded-full px-8 py-3 font-semibold text-white shadow-lg"
                onClick={() => dispatch(toggleForm())}
                aria-label="Cancel Form"
              >
                Cancel
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="whileHover"
                whileTap="whileTap"
                type="submit"
                className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] rounded-full px-8 py-3 font-semibold text-white shadow-lg"
                aria-label={invoice ? "Save Changes" : "Create Invoice"}
              >
                {invoice ? "Save Changes" : "Create Invoice"}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default InvoiceForm;