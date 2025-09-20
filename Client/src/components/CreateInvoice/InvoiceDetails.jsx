import { format, parseISO } from "date-fns";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { markAsPaid, deleteInvoice, setSelectedInvoice, toggleForm } from "../../store/InvoiceSlice";
import InvoicePDF from "./InvoicePDF";
import { Download, X } from "lucide-react";
import { PDFDownloadLink } from '@react-pdf/renderer';

function InvoiceDetails({ invoice }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.invoices);
  const [actionError, setActionError] = useState(null);

  const handleMarkAsPaid = async () => {
    setActionError(null);
    try {
      await dispatch(markAsPaid(invoice.id)).unwrap();
    } catch (err) {
      setActionError(err.message || "Failed to mark invoice as paid");
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      console.log("Attempting to delete invoice with ID:", invoice.id); // Debug log
      await dispatch(deleteInvoice(invoice.id)).unwrap();
      dispatch(setSelectedInvoice(null));
    } catch (err) {
      console.error("Delete Invoice Error:", err); // Debug error log
      setActionError(err.message || "Failed to delete invoice");
    }
  };

  const handleEdit = () => {
    dispatch(toggleForm());
  };

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd MMM yyyy");
    } catch (err) {
      return "Invalid Date";
    }
  };

  return (
    <div className="text-white">
      {actionError && (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-4">
          {actionError}
        </div>
      )}
      {status === "loading" && (
        <div className="bg-slate-700/50 text-white p-4 rounded-lg mb-4">
          Processing...
        </div>
      )}
      <div className="bg-slate-800 rounded-lg p-6 flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-slate-300">Status</span>
          <div
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 font-bold
              ${invoice.status === "paid" ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${invoice.status === "paid" ? "bg-green-400" : "bg-orange-400"}`}
            ></div>
            <span className="capitalize">{invoice.status}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} />}
            fileName={`invoice-${invoice.id}.pdf`}
            className="px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center space-x-2"
          >
            {({ loading }) => (
              <>
                <Download size={20} />
                <span>{loading ? "Loading..." : "Download PDF"}</span>
              </>
            )}
          </PDFDownloadLink>
          <button
            className="px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 font-semibold"
            onClick={handleEdit}
          >
            Edit
          </button>
          <button
            className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 font-semibold"
            onClick={handleDelete}
          >
            Delete
          </button>
          {invoice.status !== "paid" && (
            <button
              className="px-6 py-3 rounded-full bg-violet-500 hover:bg-violet-600 font-semibold"
              onClick={handleMarkAsPaid}
            >
              Mark as Paid
            </button>
          )}
          <button type="button" onClick={() => dispatch(setSelectedInvoice(null))}>
            <X size={24} />
          </button>
        </div>
      </div>
      <div className="bg-slate-800 rounded-lg p-8">
        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold mb-1">
              <span className="text-slate-500">#</span>{invoice.id}
            </h2>
            <p className="text-slate-400">{invoice.projectDescription}</p>
          </div>
          <div className="text-right text-slate-400 text-sm">
            <p>{invoice.billFrom.streetAddress}</p>
            <p>{invoice.billFrom.city}, {invoice.billFrom.postCode}</p>
            <p>{invoice.billFrom.country}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-slate-400 mb-2">Invoice Date</p>
              <p className="font-bold text-lg">{formatDate(invoice.invoiceDate)}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-2">Payment Due</p>
              <p className="font-bold text-lg">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Bill To</p>
            <p className="font-bold text-lg mb-2">{invoice.clientName}</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              {invoice.billTo.streetAddress}<br />
              {invoice.billTo.city}, {invoice.billTo.postCode}<br />
              {invoice.billTo.country}
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Sent To</p>
            <p className="font-bold text-lg">{invoice.billTo.clientEmail || "N/A"}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8 mb-8 border-t border-slate-700 pt-6">
          <div>
            <p className="text-slate-400 mb-2">Mode/Terms of Payment</p>
            <p className="font-bold text-lg">{invoice.termsOfPayment || "N/A"}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Supplier's Ref.</p>
            <p className="font-bold text-lg">{invoice.suppliersRef || "N/A"}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Other Reference</p>
            <p className="font-bold text-lg">{invoice.otherRef || "N/A"}</p>
          </div>
        </div>
        <div className="bg-slate-700/50 rounded-lg overflow-hidden">
          <div className="p-8">
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-sm">
                  <th className="text-left font-normal pb-4">Item Name</th>
                  <th className="text-center font-normal pb-4">QTY.</th>
                  <th className="text-right font-normal pb-4">Rate</th>
                  <th className="text-right font-normal pb-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr className="text-white font-bold" key={index}>
                    <td className="text-left py-3">{item.name}</td>
                    <td className="text-center py-3">{item.quantity}</td>
                    <td className="text-right py-3">₹{item.rate?.toFixed(2)}</td>
                    <td className="text-right py-3">₹{item.total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-900 p-6 space-y-3">
            <div className="flex justify-between items-center text-slate-300">
              <span>Subtotal</span>
              <span className="font-bold text-lg">₹{invoice.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>GST (18%)</span>
              <span className="font-bold text-lg">₹{invoice.gstAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center text-white">
              <span className="font-semibold">Amount Due</span>
              <span className="text-3xl font-bold">₹{invoice.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceDetails;
