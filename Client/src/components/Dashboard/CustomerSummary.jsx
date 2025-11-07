import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Pdf from "./Pdf.jsx";
import api from "../../api"; // <-- IMPORT THE API HELPER

const CustomerSummary = () => {
  const navigate = useNavigate();

  // Remove defaultCustomers. State starts empty.
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState({ id: null, field: "", value: "" });

  // Load customers from backend
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api.get("/customers");
      // Format the balance from the backend
      const formattedData = data.map((cust) => ({
        ...cust,
        balance: cust.balance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }));
      setCustomers(formattedData);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      // Handle error (e.g., show a message, redirect to login)
    }
  };

  const handleDoubleClick = (id, field, value) => {
    // PREVENT editing the calculated balance
    if (field === "balance") {
      return;
    }
    setEditing({ id, field, value });
  };

  const handleChange = (e) => {
    setEditing((prev) => ({ ...prev, value: e.target.value }));
  };

  const handleBlur = async () => {
    if (editing.id !== null && editing.field === "name") {
      const customerToUpdate = customers.find((c) => c.id === editing.id);
      if (customerToUpdate.name === editing.value) {
        // No change, just exit editing mode
        setEditing({ id: null, field: "", value: "" });
        return;
      }

      try {
        // Send PUT request to backend
        await api.put(`/customers`, {
          id: editing.id,
          name: editing.value,
        });

        // Update state locally for immediate feedback
        setCustomers((prev) =>
          prev.map((cust) =>
            cust.id === editing.id
              ? { ...cust, [editing.field]: editing.value }
              : cust
          )
        );
      } catch (error) {
        console.error("Failed to update customer:", error);
        // Optionally revert state or show error
      }
    }
    setEditing({ id: null, field: "", value: "" });
  };

  return (
    <>
      {/* ADDED: Style tag for page load animation */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(15px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out forwards;
          }
        `}
      </style>

      {/* ADDED: Wrapper div for animation */}
      <div className="animate-fadeIn">
        {/* CHANGED: This div now wraps the button and the card for alignment */}
        <div className="max-w-5xl mx-auto mt-5 ">
          {/* ADDED: Back button */}
          <button
            onClick={() => navigate("/home/features")}
            className="mb-4 flex items-center text-[#0ea5a4] hover:text-[#0b8b8b] font-semibold transition-colors duration-300 group px-3 py-2 rounded-lg hover:bg-white/50 backdrop-blur-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 mr-2 transition-transform duration-300 group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
            Back 
          </button>

          {/* Original Card */}
          <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl overflow-hidden border-2 border-[#0ea5a4]/50">
            {/* CHANGED: Header gradient to match theme */}
            <div className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] text-white text-center py-4 text-2xl font-bold tracking-wide shadow-md">
              CUSTOMER SUMMARY
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  {/* CHANGED: Table header to light theme */}
                  <tr className="bg-slate-100/80 text-slate-900 text-left border-b-2 border-[#0ea5a4]/50">
                    <th className="p-3 w-12 text-center border-r border-[#0ea5a4]/20 font-semibold">
                      S.No.
                    </th>
                    <th className="p-3 border-r border-[#0ea5a4]/20 font-semibold">
                      CUSTOMER NAME
                    </th>
                    <th className="p-3 text-center border-r border-[#0ea5a4]/20 font-semibold">
                      ACCOUNT BALANCE
                    </th>
                    <th className="p-3 text-center border-r border-[#0ea5a4]/20 font-semibold">
                      DETAILS
                    </th>
                    <th className="p-3 text-center font-semibold">DOWNLOAD</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((cust, index) => (
                    <tr
                      key={cust.id}
                      // CHANGED: Row colors and borders for light glassmorphism
                      className={`${
                        index % 2 === 0 ? "bg-white/50" : "bg-slate-50/50"
                      } hover:bg-teal-50/50 transition-all duration-150 border-b border-[#0ea5a4]/20`}
                    >
                      <td className="p-3 text-center font-medium border-r border-[#0ea5a4]/20 text-slate-800">
                        {index + 1} {/* Use index for S.No. */}
                      </td>

                      {/* Editable Name */}
                      <td
                        // CHANGED: Row borders
                        className="p-3 font-semibold border-r border-[#0ea5a4]/20 cursor-pointer hover:bg-gray-100/50 text-slate-900"
                        onDoubleClick={() =>
                          handleDoubleClick(cust.id, "name", cust.name)
                        }
                      >
                        {editing.id === cust.id &&
                        editing.field === "name" ? (
                          <input
                            type="text"
                            value={editing.value}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
                            autoFocus
                            // CHANGED: Input style to match theme
                            className="border border-gray-300 px-2 py-1 w-full rounded-md focus:ring-2 focus:ring-[#0ea5a4] focus:outline-none"
                          />
                        ) : (
                          cust.name
                        )}
                      </td>

                      {/* NON-Editable Balance */}
                      <td
                        // CHANGED: Row borders and "good" balance color
                        // REMOVED onDoubleClick handler
                        className={`p-3 text-center border-r border-[#0ea5a4]/20 ${
                          parseFloat(cust.balance?.replace(/,/g, "")) > 0
                            ? "text-red-700 font-bold"
                            : "text-green-800 font-semibold" // Matched "paid" color
                        }`}
                      >
                        {cust.balance || "-"}
                      </td>

                      {/* View Ledger */}
                      <td className="p-3 text-center border-r border-[#0ea5a4]/20">
                        <button
                          onClick={() =>
                            navigate(
                              `/home/ledger/${encodeURIComponent(cust.name)}`
                            )
                          }
                          // CHANGED: Button style to match primary gradient button
                          className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] text-white font-semibold px-4 py-2 rounded-full shadow-md transition-transform transform hover:scale-105"
                        >
                          View Full Ledger
                        </button>
                      </td>

                      {/* PDF Download */}
                      <td className="p-3 text-center">
                        <Pdf customerName={cust.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerSummary;
