import React, { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addInvoice, updateInvoice, toggleForm } from "../../store/InvoiceSlice";
import { format } from "date-fns";
import { motion } from "framer-motion";

// --- CONSTANTS ---
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
  {
    clientName: "Avinash",
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
  const maxNum = invoicesInYear.reduce((max, inv) => {
    const parts = inv.id.split("/");
    const num = parseInt(parts[parts.length - 1], 10);
    return Math.max(max, isNaN(num) ? 0 : num);
  }, 0);

  const nextNumber = maxNum + 1;
  const padded = String(nextNumber).padStart(4, "0");
  return `${prefix}${padded}`;
};

const getInitialFormData = () => ({
  status: "pending",
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

// --- ANIMATION VARIANTS ---
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

const hoverTapSpring = { type: "spring", stiffness: 400, damping: 17 };
const simpleButtonVariants = {
  whileHover: { scale: 1.05, transition: hoverTapSpring },
  whileTap: { scale: 0.95, transition: hoverTapSpring },
};

const iconButtonVariants = {
  whileHover: { scale: 1.1, color: "#ef4444" },
  whileTap: { scale: 0.9, ...hoverTapSpring },
};

// --- STYLING ---
const labelClass = "block text-sm font-medium text-gray-700 mb-2";
// CHANGED: Made inputs semi-transparent to match the glassmorphism style
const inputClass =
  "w-full bg-white/60 border border-gray-300/70 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-[#0ea5a4] focus:border-[#0ea5a4] placeholder:text-gray-400 shadow-sm transition-colors backdrop-blur-sm";
const itemInputClass =
  "w-full bg-white/60 border border-gray-300/70 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-[#0ea5a4] focus:border-[#0ea5a4] placeholder:text-gray-400 text-sm shadow-sm transition-colors backdrop-blur-sm";

// --- MAIN COMPONENT ---
function InvoiceForm({ invoice }) {
  const dispatch = useDispatch();
  const { invoices, status, error } = useSelector((state) => state.invoices);
  const [formData, setFormData] = useState(getInitialFormData());
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (invoice) {
      setFormData({
        ...invoice,
        billFrom: { ...BILL_FROM },
        items: invoice.items.map((item) => ({
          ...item,
          total: item.total || item.quantity * item.rate,
          unit: item.unit || "unit",
        })),
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [invoice]);

  useEffect(() => {
    if (status === "failed" && error) setFormError(error);
  }, [status, error]);

  const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const gstAmount = subtotal * 0.18;
  const grandTotal = subtotal + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.clientName.trim()) return setFormError("Client name is required");
    if (!formData.invoiceDate.trim()) return setFormError("Invoice date is required");
    if (
      formData.items.length === 0 ||
      formData.items.some((i) => !i.name.trim() || i.quantity <= 0 || i.rate < 0)
    )
      return setFormError("At least one valid item is required");

    const finalData = {
      ...formData,
      id: invoice ? invoice.id : generateInvoiceId(invoices),
      subtotal,
      gstAmount,
      total: grandTotal,
      billFrom: { ...BILL_FROM },
    };

    try {
      if (invoice) await dispatch(updateInvoice(finalData)).unwrap();
      else await dispatch(addInvoice(finalData)).unwrap();
      dispatch(toggleForm());
    } catch (err) {
      setFormError(err.message || "Failed to save invoice");
    }
  };

  const addItem = () =>
    setFormData({
      ...formData,
      items: [...formData.items, { name: "", quantity: "1", rate: "", total: 0, unit: "unit" }],
    });

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    const item = { ...items[index] };
    if (field === "quantity") item.quantity = value === "" ? "" : Math.max(1, parseInt(value, 10) || 1);
    else if (field === "rate") item.rate = value === "" ? "" : Math.max(0, parseFloat(value) || 0);
    else item[field] = value;
    item.total = (item.quantity || 1) * (item.rate || 0);
    items[index] = item;
    setFormData({ ...formData, items });
  };

  const removeItem = (index) =>
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });

  return (
    // CHANGED: Backdrop to match Navbar modal
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4 z-50">
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        // CHANGED: Form card to match Navbar modal/Card style
        className="bg-white/80 backdrop-blur-lg rounded-2xl border border-[#0ea5a4]/50 shadow-2xl p-6 md:p-8 w-full max-w-4xl my-8 text-slate-900"
      >
        {/* --- HEADER --- */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
            {invoice ? `Edit #${invoice.id}` : "New Invoice"}
          </h2>
          <motion.button
            variants={iconButtonVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            onClick={() => dispatch(toggleForm())}
            className="text-gray-500"
          >
            <X size={28} />
          </motion.button>
        </div>

        {/* --- FORM ERROR --- */}
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 border border-red-300"
          >
            {formError}
          </motion.div>
        )}

        {/* --- FORM --- */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* --- BILL FROM --- */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-[#056b66]">Bill From</h3>
              {/* CHANGED: Made this box semi-transparent */}
              <div className="p-4 bg-gray-50/50 border border-gray-200/70 backdrop-blur-sm rounded-lg text-gray-700 text-sm shadow-sm">
                <p className="font-bold text-lg text-slate-900">{BILL_FROM.name}</p>
                <p>{BILL_FROM.streetAddress}</p>
                <p>{`${BILL_FROM.city}, ${BILL_FROM.country} - ${BILL_FROM.postCode}`}</p>
                <p className="mt-2"><strong>GSTIN:</strong> {BILL_FROM.gstin}</p>
                <p><strong>Email:</strong> {BILL_FROM.email}</p>
              </div>
            </div>

            {/* --- BILL TO & DATE --- */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#056b66]">Bill To</h3>
              <label>
                <span className={labelClass}>Client</span>
                <select
                  className={inputClass}
                  value={formData.clientName}
                  onChange={(e) => {
                    const selected = CLIENTS.find((c) => c.clientName === e.target.value);
                    setFormData({
                      ...formData,
                      clientName: selected?.clientName || "",
                      billTo: selected || getInitialFormData().billTo,
                    });
                  }}
                  required
                >
                  <option value="">Select a Client</option>
                  {CLIENTS.map((c, i) => (
                    <option key={i} value={c.clientName}>{c.clientName}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className={labelClass}>Invoice Date</span>
                <input
                  type="date"
                  className={inputClass}
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  required
                />
              </label>
            </div>
          </div>

          {/* --- PROJECT / REFS --- */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <label>
              <span className={labelClass}>Delivery Note</span>
              <input
                type="text"
                placeholder="e.g., Project materials"
                value={formData.projectDescription}
                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label>
                <span className={labelClass}>Mode/Terms of Payment</span>
                <input
                  type="text"
                  placeholder="e.g., Bank Transfer"
                  value={formData.termsOfPayment}
                  onChange={(e) => setFormData({ ...formData, termsOfPayment: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Supplier's Ref.</span>
                <input
                  type="text"
                  placeholder="e.g., PO #123"
                  value={formData.suppliersRef}
                  onChange={(e) => setFormData({ ...formData, suppliersRef: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="md:col-span-2">
                <span className={labelClass}>Other Reference(s)</span>
                <input
                  type="text"
                  placeholder="Any other details"
                  value={formData.otherRef}
                  onChange={(e) => setFormData({ ...formData, otherRef: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          {/* --- ITEM LIST --- */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="text-2xl font-bold text-[#056b66]">Item List</h3>
            <div className="grid grid-cols-12 gap-x-4 gap-y-2 px-2 pb-2 border-b border-gray-200 hidden md:grid">
              <span className="col-span-5 text-sm font-medium text-gray-700">Item Name</span>
              <span className="col-span-2 text-sm font-medium text-gray-700">Qty</span>
              <span className="col-span-2 text-sm font-medium text-gray-700">Rate</span>
              <span className="col-span-2 text-sm font-medium text-gray-700 text-right">Total</span>
              <span className="col-span-1"></span>
            </div>

            {formData.items.map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-12 gap-x-4 gap-y-2 items-start py-4 border-b border-gray-200 last:border-b-0"
              >
                <div className="col-span-12 md:col-span-5">
                  <label className="md:hidden text-xs font-medium text-gray-600 mb-1 block">Item</label>
                  <input
                    type="text"
                    placeholder="Item Name"
                    className={itemInputClass}
                    value={item.name}
                    onChange={(e) => updateItem(i, "name", e.target.value)}
                  />
                </div>

                <div className="col-span-4 md:col-span-2">
                  <label className="md:hidden text-xs font-medium text-gray-600 mb-1 block">Qty</label>
                  <input
                    type="text"
                    placeholder="Qty"
                    className={itemInputClass}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  />
                </div>

                <div className="col-span-4 md:col-span-2">
                  <label className="md:hidden text-xs font-medium text-gray-600 mb-1 block">Rate</label>
                  <input
                    type="text"
                    placeholder="Rate"
                    className={itemInputClass}
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateItem(i, "rate", e.target.value)}
                  />
                </div>

                <div className="col-span-3 md:col-span-2 text-right font-bold text-slate-900 self-center pt-5 md:pt-2">
                  <span className="md:hidden text-sm font-medium text-gray-600">Total: </span>
                  ₹{item.total.toFixed(2)}
                </div>

                <motion.button
                  variants={iconButtonVariants}
                  whileHover="whileHover"
                  whileTap="whileTap"
                  type="button"
                  onClick={() => removeItem(i)}
                  className="col-span-1 text-gray-500 justify-self-end self-center pt-5 md:pt-2"
                >
                  <Trash2 size={20} />
                </motion.button>
              </motion.div>
            ))}

            <motion.button
              variants={simpleButtonVariants}
              whileHover="whileHover"
              whileTap="whileTap"
              type="button"
              onClick={addItem}
              // CHANGED: Gradient to match the primary action buttons
              className="w-full bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] rounded-full p-3 flex items-center justify-center text-white font-semibold shadow-lg gap-2 transition-all"
            >
              <Plus size={20} />
              <span>Add New Item</span>
            </motion.button>
          </div>

          {/* --- FINAL ATTRACTIVE TOTALS + BUTTONS CARD --- */}
          {/* This card already matches the new theme perfectly, so no changes needed here. */}
          <div className="mt-8 p-6 w-full md:p-8 bg-gradient-to-br from-[#0ea5a4]/5 via-white to-[#0bd1c5]/5 rounded-2xl border border-[#0ea5a4]/20 shadow-xl backdrop-blur-sm">
            <div className="space-y-5">
              {/* Subtotal & GST */}
              <div className="flex justify-between text-lg">
                <span className="font-medium text-gray-700">Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-medium text-gray-700">GST (18%)</span>
                <span className="font-bold text-slate-900">₹{gstAmount.toFixed(2)}</span>
              </div>

              {/* Grand Total */}
              <div className="pt-5 border-t-2 border-dashed border-[#0ea5a4]/30">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-extrabold text-slate-900">Grand Total</span>
                  <span className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-center text-xs text-gray-500 mt-2 italic">Inclusive of all taxes</p>
              </div>

              {/* Action Buttons - BELOW Grand Total */}
              {/* These buttons already match the Navbar modal buttons, so no changes needed. */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center">
                <motion.button
                  variants={simpleButtonVariants}
                  whileHover="whileHover"
                  whileTap="whileTap"
                  type="button"
                  onClick={() => dispatch(toggleForm())}
                  disabled={status === 'loading'}
                  className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-slate-800 rounded-full px-8 py-3 font-semibold shadow-md transition-all"
                >
                  Cancel
                </motion.button>

                <motion.button
                  variants={simpleButtonVariants}
                  whileHover="whileHover"
                  whileTap="whileTap"
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] text-white rounded-full px-8 py-3 font-bold shadow-lg transition-all disabled:opacity-50"
                >
                  {status === 'loading' ? "Saving..." : invoice ? "Save Changes" : "Create Invoice"}
                </motion.button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default InvoiceForm;