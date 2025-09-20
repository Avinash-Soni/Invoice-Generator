import React, { useEffect } from "react";
import Header from "./Header";
import InvoiceList from "./InvoiceList";
import InvoiceForm from "./InvoiceForm";
import { useDispatch, useSelector } from "react-redux";
import { toggleForm, fetchInvoices } from "../../store/InvoiceSlice";
import InvoiceDetails from "./InvoiceDetails";

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
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="max-w-5xl mx-auto py-12 px-4">
        {status === "loading" && (
          <div className="bg-slate-700/50 text-white p-4 rounded-lg mb-4">
            Loading invoices...
          </div>
        )}
        {status === "failed" && error && (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        <Header onNewInvoice={handleNewInvoice} />
        {selectedInvoice ? <InvoiceDetails invoice={selectedInvoice} /> : <InvoiceList />}
        {isFormOpen && <InvoiceForm invoice={selectedInvoice} />}
      </div>
    </div>
  );
}

export default AppContent;