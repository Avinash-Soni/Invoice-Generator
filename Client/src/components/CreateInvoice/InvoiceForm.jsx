import React, { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addInvoice, setSelectedInvoice, toggleForm, updateInvoice } from "../../store/InvoiceSlice";
import { format, addDays } from "date-fns";

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
  status: "pending",
  billFrom: { ...BILL_FROM },
  billTo: { clientEmail: "", streetAddress: "", city: "", postCode: "", country: "", gstin: "" },
  clientName: "",
  items: [],
  paymentTerms: "Net 30 Days",
  projectDescription: "",
  suppliersRef: "",
  termsOfPayment: "",
  otherRef: "",
  invoiceDate: format(new Date(), "yyyy-MM-dd"),
  dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
  subtotal: 0,
  gstAmount: 0,
  total: 0,
});

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
           billTo: invoice.billTo || {
             clientEmail: invoice.billTo?.clientEmail || "",
             streetAddress: invoice.billTo?.streetAddress || "",
             city: invoice.billTo?.city || "",
             postCode: invoice.billTo?.postCode || "",
             country: invoice.billTo?.country || "",
             gstin: invoice.billTo?.gstin || ""
           },
           items: invoice.items.map(item => ({
             ...item,
             unit: item.unit || "unit",
             total: item.total || item.quantity * item.rate
           }))
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

       // Validate form data
       if (!formData.clientName || formData.clientName.trim() === "") {
         setFormError("Client name is required");
         return;
       }
       if (!formData.dueDate || formData.dueDate.trim() === "") {
         setFormError("Due date is required");
         return;
       }
       if (!formData.invoiceDate || formData.invoiceDate.trim() === "") {
         setFormError("Invoice date is required");
         return;
       }
       if (formData.items.length === 0 || formData.items.some(item => !item.name || item.name.trim() === "" || item.quantity <= 0 || item.rate < 0)) {
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
         items: formData.items.map(item => ({
           name: item.name,
           quantity: item.quantity,
           rate: item.rate,
           total: item.total,
           unit: item.unit || "unit"
         })),
         billFrom: { ...BILL_FROM }, // Ensure billFrom is fully populated
         billTo: {
           clientEmail: formData.billTo.clientEmail || "",
           streetAddress: formData.billTo.streetAddress || "",
           city: formData.billTo.city || "",
           postCode: formData.billTo.postCode || "",
           country: formData.billTo.country || "",
           gstin: formData.billTo.gstin || ""
         }
       };

       try {
         if (invoice) {
           console.log("Updating invoice with payload:", JSON.stringify(finalData, null, 2));
           await dispatch(updateInvoice(finalData)).unwrap();
         } else {
           console.log("Creating invoice with payload:", JSON.stringify(finalData, null, 2));
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
      items: [...formData.items, { name: "", quantity: 1, rate: 0, total: 0, unit: "unit" }],
    });
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    const item = { ...items[index] };

    if (field === "quantity") {
      item.quantity = Math.max(1, parseInt(value, 10) || 1);
    } else if (field === "rate") {
      item.rate = Math.max(0, parseFloat(value) || 0);
    } else {
      item[field] = value;
    }

    item.total = item.quantity * item.rate;
    items[index] = item;
    setFormData({ ...formData, items });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handlePaymentTermsChange = (e) => {
    const terms = e.target.value;
    const days = terms === "Net 60 Days" ? 60 : 30;
    setFormData({
      ...formData,
      paymentTerms: terms,
      dueDate: format(addDays(new Date(formData.invoiceDate), days), "yyyy-MM-dd"),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-y-auto">
      <div className="bg-slate-800 p-8 rounded-lg w-full max-w-2xl mt-8 mb-8 text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {invoice ? `Edit #${invoice.id}` : "New Invoice"}
          </h2>
          <button type="button" onClick={() => dispatch(toggleForm())}>
            <X size={24} />
          </button>
        </div>
        {formError && (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-4">
            {formError}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <h3 className="text-violet-500 font-bold">Bill From</h3>
            <div className="p-4 bg-slate-900 rounded-lg text-slate-300 text-sm">
              <p className="font-bold text-base text-white">{BILL_FROM.name}</p>
              <p>{BILL_FROM.streetAddress}</p>
              <p>{`${BILL_FROM.city}, ${BILL_FROM.country} - ${BILL_FROM.postCode}`}</p>
              <p className="mt-2"><strong>GSTIN:</strong> {BILL_FROM.gstin}</p>
              <p><strong>Email:</strong> {BILL_FROM.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-violet-500 font-bold">Bill To</h3>
            <select
              className="w-full bg-slate-900 rounded-lg p-3"
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
              <option value="">Select a Client</option>
              {CLIENTS.map((client, i) => (
                <option key={i} value={client.clientName}>
                  {client.clientName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                className="bg-slate-900 rounded-lg p-3"
                value={formData.invoiceDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const days = formData.paymentTerms === "Net 60 Days" ? 60 : 30;
                  setFormData({
                    ...formData,
                    invoiceDate: newDate,
                    dueDate: format(addDays(new Date(newDate), days), "yyyy-MM-dd"),
                  });
                }}
                required
                aria-label="Invoice Date"
              />
              <select
                className="bg-slate-900 rounded-lg p-3"
                value={formData.paymentTerms}
                onChange={handlePaymentTermsChange}
                required
                aria-label="Payment Terms"
              >
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Delivery Note"
              value={formData.projectDescription}
              onChange={(e) =>
                setFormData({ ...formData, projectDescription: e.target.value })
              }
              className="w-full bg-slate-900 rounded-lg p-3"
              aria-label="Delivery Note"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Mode/Terms of Payment"
                value={formData.termsOfPayment}
                onChange={(e) =>
                  setFormData({ ...formData, termsOfPayment: e.target.value })
                }
                className="w-full bg-slate-900 rounded-lg p-3"
                aria-label="Mode or Terms of Payment"
              />
              <input
                type="text"
                placeholder="Supplier's Ref."
                value={formData.suppliersRef}
                onChange={(e) =>
                  setFormData({ ...formData, suppliersRef: e.target.value })
                }
                className="w-full bg-slate-900 rounded-lg p-3"
                aria-label="Supplier's Reference"
              />
              <input
                type="text"
                placeholder="Other Ref."
                value={formData.otherRef}
                onChange={(e) =>
                  setFormData({ ...formData, otherRef: e.target.value })
                }
                className="w-full bg-slate-900 rounded-lg p-3 md:col-span-2"
                aria-label="Other Reference"
              />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-400">Item List</h3>
            {formData.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 items-center">
                <input
                  type="text"
                  placeholder="Item Name"
                  className="bg-slate-900 rounded-lg p-3 col-span-5"
                  value={item.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                  required
                  aria-label={`Item ${i + 1} Name`}
                />
                <input
                  type="number"
                  placeholder="Qty."
                  className="bg-slate-900 rounded-lg p-3 col-span-2"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  required
                  aria-label={`Item ${i + 1} Quantity`}
                />
                <input
                  type="number"
                  placeholder="Rate"
                  className="bg-slate-900 rounded-lg p-3 col-span-2"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => updateItem(i, "rate", e.target.value)}
                  required
                  aria-label={`Item ${i + 1} Rate`}
                />
                <div className="col-span-2 text-right font-bold">
                  ₹{item.total.toFixed(2)}
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-red-500"
                  onClick={() => removeItem(i)}
                  aria-label={`Remove Item ${i + 1}`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="w-full bg-slate-700 hover:bg-slate-600 rounded-lg p-3 flex items-center justify-center space-x-2"
              onClick={addItem}
            >
              <Plus size={20} />
              <span>Add New Item</span>
            </button>
          </div>
          <div className="flex flex-col space-y-4 pt-4">
            <div className="bg-slate-900/70 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>GST (18%)</span>
                <span className="font-bold">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white border-t border-slate-700 pt-2 mt-2">
                <span className="text-lg font-bold">Grand Total</span>
                <span className="text-xl font-bold">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="bg-slate-700 hover:bg-slate-600 rounded-full px-6 py-3 font-semibold"
                onClick={() => dispatch(toggleForm())}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-violet-500 hover:bg-violet-600 rounded-full px-6 py-3 font-semibold text-white"
              >
                {invoice ? "Save Changes" : "Create Invoice"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InvoiceForm;