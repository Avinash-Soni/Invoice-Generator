import React, { useEffect, useState, useMemo, useRef } from "react";
import { Plus, Trash2, X, Settings2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addInvoice, updateInvoice, toggleForm } from "../../store/InvoiceSlice";
import { fetchCustomers } from "../../store/CustomerSlice";
import { fetchItemSuggestions } from "../../store/itemSlice";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import ClientManagerModal from "./ClientManagerModal";

// --- CONSTANTS --- (Unchanged)
const BILL_FROM = {
  name: "Designer Square",
  streetAddress: "Second Floor, LIG-405, Dindayal Nagar",
  city: "Bhilai",
  postCode: "490020",
  country: "India (C.G.)",
  gstin: "22DPRPS5517H3ZG",
  email: "designersquarebhilai@gmail.com",
};

const getInitialFormData = () => ({
  // ... (Your initial data logic is unchanged)
  status: "pending",
  billFrom: { ...BILL_FROM },
  billTo: {
    clientEmail: "",
    streetAddress: "",
    city: "",
    postCode: "",
    country: "",
    gstin: "",
  },
  clientName: "",
  items: [],
  projectDescription: "",
  suppliersRef: "",
  termsOfPayment: "",
  otherRef: "",
  invoiceDate: format(new Date(), "yyyy-MM-dd"),
  hsn: "",
  subtotal: 0,
  gstAmount: 0,
  total: 0,
  gstMode: "auto",
  gstPercent: 18,
});

// --- ANIMATION VARIANTS --- (Unchanged)
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

// --- STYLING --- (Unchanged)
const labelClass = "block text-sm font-medium text-gray-700 mb-2";
const inputClass =
  "w-full bg-white/60 border border-gray-300/70 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-[#0ea5a4] focus:border-[#0ea5a4] placeholder:text-gray-400 shadow-sm transition-colors backdrop-blur-sm";
const itemInputClass =
  "w-full bg-white/60 border border-gray-300/70 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-[#0ea5a4] focus:border-[#0ea5a4] placeholder:text-gray-400 text-sm shadow-sm transition-colors backdrop-blur-sm";

// --- MAIN COMPONENT ---
function InvoiceForm({ invoice }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.invoices);
  const { customers, status: customerStatus } = useSelector(
    (state) => state.customers
  );
  const { names: allItemNames, status: itemStatus } = useSelector(
    (state) => state.items
  );

  const [formData, setFormData] = useState(getInitialFormData());
  const [formError, setFormError] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [activeSuggestion, setActiveSuggestion] = useState({
    index: null,
    query: "",
  });

  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] =
    useState(0);
  const suggestionsContainerRef = useRef(null);

  // --- All Logic (Unchanged) ---
  useEffect(() => {
    if (customerStatus === "idle") {
      dispatch(fetchCustomers());
    }
    if (itemStatus === "idle") {
      dispatch(fetchItemSuggestions());
    }
  }, [customerStatus, itemStatus, dispatch]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        ...invoice,
        billFrom: { ...BILL_FROM },
        hsn: invoice.hsn || "",
        gstMode: invoice.gstMode || "auto",
        gstPercent: invoice.gstPercent || 18,
        billTo: invoice.billTo || getInitialFormData().billTo,
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

  const subtotal = formData.items.reduce(
    (sum, item) => sum + (item.total || 0),
    0
  );
  const activeGstPercent = parseFloat(formData.gstPercent) || 0;
  const gstAmount = subtotal * (activeGstPercent / 100);
  const grandTotal = subtotal + gstAmount;

  const filteredSuggestions = useMemo(() => {
    if (
      activeSuggestion.index === null ||
      !activeSuggestion.query ||
      allItemNames.length === 0
    ) {
      return [];
    }
    const query = activeSuggestion.query.toLowerCase();
    return allItemNames
      .filter(
        (name) =>
          name.toLowerCase().includes(query) && name.toLowerCase() !== query
      )
      .slice(0, 5);
  }, [allItemNames, activeSuggestion]);

  useEffect(() => {
    setHighlightedSuggestionIndex(0);
  }, [activeSuggestion.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.clientName.trim())
      return setFormError("Client name is required");
    if (!formData.invoiceDate.trim())
      return setFormError("Invoice date is required");
    if (!formData.hsn.trim()) return setFormError("HSN/SAC code is required");
    if (
      formData.items.length === 0 ||
      formData.items.some((i) => !i.name.trim() || i.quantity <= 0 || i.rate < 0)
    )
      return setFormError(
        "At least one valid item is required (with Name, Qty > 0, and Rate)."
      );
    if (
      formData.gstMode === "manual" &&
      (isNaN(activeGstPercent) || activeGstPercent < 0)
    ) {
      return setFormError("Manual GST % must be a valid, positive number.");
    }

    const finalData = {
      ...formData,
      subtotal,
      gstAmount: gstAmount,
      total: grandTotal,
      gstPercent: activeGstPercent,
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

    try {
      if (invoice) {
        await dispatch(updateInvoice(finalData)).unwrap();
      } else {
        await dispatch(addInvoice(finalData)).unwrap();
      }

      dispatch(fetchItemSuggestions());
      dispatch(toggleForm());
    } catch (err) {
      setFormError(err.message || "Failed to save invoice");
    }
  };

  const addItem = () =>
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { name: "", quantity: "1", rate: "", total: 0, unit: "unit" },
      ],
    });

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    const item = { ...items[index] };
    if (field === "quantity")
      item.quantity = value === "" ? "" : Math.max(1, parseInt(value, 10) || 1);
    else if (field === "rate")
      item.rate = value === "" ? "" : Math.max(0, parseFloat(value) || 0);
    else item[field] = value;
    item.total = (item.quantity || 1) * (item.rate || 0);
    items[index] = item;
    setFormData({ ...formData, items });
  };

  const removeItem = (index) =>
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });

  const handleSuggestionKeyDown = (e, itemIndex) => {
    if (filteredSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedSuggestionIndex((prev) => {
        const newIndex = (prev + 1) % filteredSuggestions.length;
        const container = suggestionsContainerRef.current;
        const item = container?.children[newIndex];
        item?.scrollIntoView({ block: "nearest" });
        return newIndex;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedSuggestionIndex((prev) => {
        const newIndex =
          (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length;
        const container = suggestionsContainerRef.current;
        const item = container?.children[newIndex];
        item?.scrollIntoView({ block: "nearest" });
        return newIndex;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const suggestion = filteredSuggestions[highlightedSuggestionIndex];
      if (suggestion) {
        updateItem(itemIndex, "name", suggestion);
        setActiveSuggestion({ index: null, query: "" });
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveSuggestion({ index: null, query: "" });
    }
  };
  // --- End of Unchanged Logic ---

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4 z-50">
        {/* --- MODIFIED: Added border-2 border-black --- */}
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl border-2 border-black shadow-2xl w-full max-w-4xl my-8 text-slate-900"
        >
          {/* --- Header (Unchanged) --- */}
          <div className="flex justify-between items-center p-6 md:p-8 border-b border-gray-200">
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

          {/* --- Error (Unchanged) --- */}
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 text-red-700 p-4 rounded-lg border border-red-300 mx-6 md:mx-8 mt-6"
            >
              {formError}
            </motion.div>
          )}

          {/* --- Form (Unchanged) --- */}
          <form onSubmit={handleSubmit}>
            {/* --- Section 1 (Billing) (Unchanged) --- */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#056b66]">Bill From</h3>
                  <div className="p-4 bg-gray-50/50 border border-gray-200/70 backdrop-blur-sm rounded-lg text-gray-700 text-sm shadow-sm">
                    <p className="font-bold text-lg text-slate-900">
                      {BILL_FROM.name}
                    </p>
                    <p>{BILL_FROM.streetAddress}</p>
                    <p>{`${BILL_FROM.city}, ${BILL_FROM.country} - ${BILL_FROM.postCode}`}</p>
                    <p className="mt-2">
                      <strong>GSTIN:</strong> {BILL_FROM.gstin}
                    </p>
                    <p>
                      <strong>Email:</strong> {BILL_FROM.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#056b66]">Bill To</h3>
                  <label>
                    <div className="flex justify-between items-center mb-2">
                      <span className={labelClass.replace(" mb-2", "")}>
                        Client
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsClientModalOpen(true)}
                        className="text-xs flex items-center gap-1 text-[#0ea5a4] hover:text-[#056b66] font-medium"
                      >
                        <Settings2 size={12} />
                        Manage Clients
                      </button>
                    </div>
                    <select
                      className={inputClass}
                      value={formData.clientName}
                      onChange={(e) => {
                        const selected = customers.find(
                          (c) => c.name === e.target.value
                        );
                        setFormData({
                          ...formData,
                          clientName: selected?.name || "",
                          billTo: selected
                            ? {
                                clientEmail: selected.clientEmail || "",
                                streetAddress: selected.streetAddress || "",
                                city: selected.city || "",
                                postCode: selected.postCode || "",
                                country: selected.country || "",
                                gstin: selected.gstin || "",
                              }
                            : getInitialFormData().billTo,
                        });
                      }}
                      required
                    >
                      <option value="">Select a Client</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={labelClass}>Invoice Date</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={formData.invoiceDate}
                      onChange={(e) =>
                        setFormData({ ...formData, invoiceDate: e.target.value })
                      }
                      required
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* --- Section 2 (Details) (Unchanged) --- */}
            <div className="p-6 md:p-8 border-t border-gray-200 space-y-4">
              <h3 className="text-xl font-bold text-[#056b66]">
                Details & References
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label>
                  <span className={labelClass}>Delivery Note</span>
                  <input
                    type="text"
                    placeholder="e.g., Project materials"
                    value={formData.projectDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectDescription: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>HSN / SAC Code</span>
                  <input
                    type="text"
                    placeholder="e.g., 9989"
                    value={formData.hsn}
                    onChange={(e) =>
                      setFormData({ ...formData, hsn: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label>
                  <span className={labelClass}>Mode/Terms of Payment</span>
                  <input
                    type="text"
                    placeholder="e.g., Bank Transfer"
                    value={formData.termsOfPayment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        termsOfPayment: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Supplier's Ref.</span>
                  <input
                    type="text"
                    placeholder="e.g., PO #123"
                    value={formData.suppliersRef}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        suppliersRef: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="md:col-span-2">
                  <span className={labelClass}>Other Reference(s)</span>
                  <input
                    type="text"
                    placeholder="Any other details"
                    value={formData.otherRef}
                    onChange={(e) =>
                      setFormData({ ...formData, otherRef: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            {/* --- Section 3 (Item List) (Unchanged) --- */}
            <div className="p-6 md:p-8 border-t border-gray-200 space-y-3">
              <h3 className="text-xl font-bold text-[#056b66]">Item List</h3>

              <div className="grid grid-cols-12 gap-x-4 gap-y-2 px-2 pb-2 border-b border-gray-300/80 hidden md:grid">
                <span className="col-span-5 text-sm font-medium text-gray-700">
                  Item Name
                </span>
                <span className="col-span-2 text-sm font-medium text-gray-700">
                  Qty
                </span>
                <span className="col-span-2 text-sm font-medium text-gray-700">
                  Rate
                </span>
                <span className="col-span-2 text-sm font-medium text-gray-700 text-right">
                  Total
                </span>
                <span className="col-span-1"></span>
              </div>

              {formData.items.map((item, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-12 gap-x-4 gap-y-2 items-start py-4 border-b border-gray-200/70 last:border-b-0 hover:bg-slate-50 rounded-lg transition-colors duration-150 -mx-2 px-2"
                >
                  <div className="col-span-12 md:col-span-5 relative">
                    <label className="md:hidden text-xs font-medium text-gray-600 mb-1 block">
                      Item
                    </label>
                    <input
                      type="text"
                      placeholder="Item Name"
                      className={itemInputClass}
                      value={item.name}
                      autoComplete="off"
                      onFocus={() =>
                        setActiveSuggestion({ index: i, query: item.name })
                      }
                      onChange={(e) => {
                        updateItem(i, "name", e.target.value);
                        setActiveSuggestion({
                          index: i,
                          query: e.target.value,
                        });
                      }}
                      onBlur={() => {
                        setTimeout(
                          () =>
                            setActiveSuggestion({ index: null, query: "" }),
                          150
                        );
                      }}
                      onKeyDown={(e) => handleSuggestionKeyDown(e, i)}
                    />
                    <AnimatePresence>
                      {filteredSuggestions.length > 0 &&
                        activeSuggestion.index === i && (
                          <motion.div
                            ref={suggestionsContainerRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl z-20"
                          >
                            {filteredSuggestions.map((suggestion, idx) => (
                              <div
                                key={idx}
                                className={`p-3 text-sm text-slate-800 hover:bg-[#0ea5a4]/10 cursor-pointer ${
                                  idx === highlightedSuggestionIndex
                                    ? "bg-[#0ea5a4]/20"
                                    : ""
                                }`}
                                onMouseDown={() => {
                                  updateItem(i, "name", suggestion);
                                  setActiveSuggestion({
                                    index: null,
                                    query: "",
                                  });
                                }}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <label className="md:hidden text-xs font-medium text-gray-600 mb-1 block">
                      Qty
                    </label>
                    <input
                      type="text"
                      placeholder="Qty"
                      className={itemInputClass}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(i, "quantity", e.target.value)
                      }
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <label className="md:hidden text-xs font-medium text-gray-600 mb-1 block">
                      Rate
                    </label>
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
                    <span className="md:hidden text-sm font-medium text-gray-600">
                      Total:{" "}
                    </span>
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
                className="w-full bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] rounded-full p-3 flex items-center justify-center text-white font-semibold shadow-lg gap-2 transition-all mt-4"
              >
                <Plus size={20} />
                <span>Add New Item</span>
              </motion.button>
            </div>

            {/* --- Section 4 (Totals) (Unchanged) --- */}
            <div className="p-6 md:p-8 border-t border-gray-200 bg-slate-50 rounded-b-2xl">
              <div className="space-y-5">
                <div className="space-y-3 pb-4 border-b border-dashed border-[#0ea5a4]/30">
                  <span className={labelClass}>GST Options</span>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <label className="flex items-center gap-2 p-3 rounded-lg bg-white border border-gray-200 flex-1 cursor-pointer hover:border-[#0ea5a4]/50 transition-all">
                      <input
                        type="radio"
                        name="gstMode"
                        value="auto"
                        checked={formData.gstMode === "auto"}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            gstMode: "auto",
                            gstPercent: 18,
                          }))
                        }
                        className="h-5 w-5 text-[#0ea5a4] focus:ring-[#0ea5a4] border-gray-300"
                      />
                      <span className="font-medium text-slate-800 text-sm sm:text-base">
                        GST 18%
                      </span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-lg bg-white border border-gray-200 flex-1 cursor-pointer hover:border-[#0ea5a4]/50 transition-all">
                      <input
                        type="radio"
                        name="gstMode"
                        value="none"
                        checked={formData.gstMode === "none"}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            gstMode: "none",
                            gstPercent: 0,
                          }))
                        }
                        className="h-5 w-5 text-[#0ea5a4] focus:ring-[#0ea5a4] border-gray-300"
                      />
                      <span className="font-medium text-slate-800 text-sm sm:text-base">
                        No GST
                      </span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-lg bg-white border border-gray-200 flex-1 cursor-pointer hover:border-[#0ea5a4]/50 transition-all">
                      <input
                        type="radio"
                        name="gstMode"
                        value="manual"
                        checked={formData.gstMode === "manual"}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            gstMode: "manual",
                          }))
                        }
                        className="h-5 w-5 text-[#0ea5a4] focus:ring-[#0ea5a4] border-gray-300"
                      />
                      <span className="font-medium text-slate-800 text-sm sm:text-base">
                        Manual %
                      </span>
                    </label>
                  </div>

                  <AnimatePresence>
                    {formData.gstMode === "manual" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <label className="block pt-3">
                          <span className={labelClass}>
                            Manual GST Percentage (%)
                          </span>
                          <input
                            type="text"
                            placeholder="e.g., 5 or 12.5"
                            value={formData.gstPercent}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*\.?\d*$/.test(val)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  gstPercent: val,
                                }));
                              }
                            }}
                            className={inputClass}
                          />
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex justify-between text-lg">
                  <span className="font-medium text-gray-700">Subtotal</span>
                  <span className="font-bold text-slate-900">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-medium text-gray-700">
                    GST ({activeGstPercent}%)
                  </span>
                  <span className="font-bold text-slate-900">
                    ₹{gstAmount.toFixed(2)}
                  </span>
                </div>

                <div className="pt-5 border-t-2 border-dashed border-[#0ea5a4]/30">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-extrabold text-slate-900">
                      Grand Total
                    </span>
                    <span className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-2 italic">
                    Inclusive of all taxes
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center">
                  <motion.button
                    variants={simpleButtonVariants}
                    whileHover="whileHover"
                    whileTap="whileTap"
                    type="button"
                    onClick={() => dispatch(toggleForm())}
                    disabled={status === "loading"}
                    className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-slate-800 rounded-full px-8 py-3 font-semibold shadow-md transition-all"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    variants={simpleButtonVariants}
                    whileHover="whileHover"
                    whileTap="whileTap"
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] text-white rounded-full px-8 py-3 font-bold shadow-lg transition-all disabled:opacity-50"
                  >
                    {status === "loading"
                      ? "Saving..."
                      : invoice
                      ? "Save Changes"
                      : "Create Invoice"}
                  </motion.button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* --- RENDER THE MODAL (Unchanged) --- */}
      <AnimatePresence>
        {isClientModalOpen && (
          <ClientManagerModal onClose={() => setIsClientModalOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

export default InvoiceForm;