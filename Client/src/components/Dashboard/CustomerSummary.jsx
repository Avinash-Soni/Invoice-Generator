import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Pdf from "./Pdf.jsx"; // Make sure this path is correct
import api from "../../api"; // <-- IMPORT THE API HELPER

// --- MODIFIED: Helper to generate financial year options ---
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11

  // Financial year starts in April (month 3)
  // If it's Jan-Mar (0, 1, 2), the *current* financial year is the *previous* calendar year
  let latestFinYearStart = currentMonth < 3 ? currentYear - 1 : currentYear;

  // --- MODIFIED: Removed "All" from options ---
  const options = [];

  // Go back 10 years
  for (let i = 0; i < 10; i++) {
    const start = latestFinYearStart - i;
    const end = (start + 1).toString().slice(-2);
    options.push(`${start}-${end}`);
  }
  return options;
};

const CustomerSummary = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState({ id: null, field: "", value: "" });

  // --- NEW: State for year filter ---
  const [yearOptions] = useState(generateYearOptions());

  // --- MODIFIED: Default to the first year in the list (which is now the current one) ---
  const [selectedYear, setSelectedYear] = useState(yearOptions[0]);
  const [isLoading, setIsLoading] = useState(true);
  // ---

  // --- MODIFIED: useEffect now depends on selectedYear ---
  useEffect(() => {
    fetchCustomers();
  }, [selectedYear]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      // --- MODIFIED: API call now includes the 'year' query parameter ---
      const data = await api.get(`/customers?year=${selectedYear}`);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoubleClick = (id, field, value) => {
    // ... (This function is unchanged) ...
    if (field === "balance") {
      return;
    }
    setEditing({ id, field, value });
  };

  const handleChange = (e) => {
    // ... (This function is unchanged) ...
    setEditing((prev) => ({ ...prev, value: e.target.value }));
  };

  const handleBlur = async () => {
    // ... (This function is unchanged) ...
    if (editing.id !== null && editing.field === "name") {
      const customerToUpdate = customers.find((c) => c.id === editing.id);
      if (customerToUpdate.name === editing.value) {
        setEditing({ id: null, field: "", value: "" });
        return;
      }

      try {
        await api.put(`/customers`, {
          id: editing.id,
          name: editing.value,
        });

        setCustomers((prev) =>
          prev.map((cust) =>
            cust.id === editing.id
              ? { ...cust, [editing.field]: editing.value }
              : cust
          )
        );
      } catch (error) {
        console.error("Failed to update customer:", error);
      }
    }
    setEditing({ id: null, field: "", value: "" });
  };

  return (
    <>
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

      <div className="animate-fadeIn">
        <div className="max-w-5xl mx-auto mt-5 ">
          {/* --- NEW: Header container for Back button and Year Filter --- */}
          <div className="flex justify-between items-center mb-4 px-3">
            <button
              onClick={() => navigate("/home/features")}
              className="flex items-center text-[#0ea5a4] hover:text-[#0b8b8b] font-semibold transition-colors duration-300 group py-2 rounded-lg hover:bg-white/50 backdrop-blur-sm"
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

            {/* --- NEW: Year Filter Dropdown --- */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="year-select"
                className="font-semibold text-[#056b66]"
              >
                Financial Year:
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white/80 backdrop-blur-sm border border-[#0ea5a4]/50 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0ea5a4]"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl overflow-hidden border-2 border-[#0ea5a4]/50">
            <div className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] text-white text-center py-4 text-2xl font-bold tracking-wide shadow-md">
              CUSTOMER SUMMARY
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
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

                {/* --- NEW: Show loading or no customers message --- */}
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center p-8 text-slate-600 font-medium"
                      >
                        Loading customer data...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center p-8 text-slate-600 font-medium"
                      >
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((cust, index) => (
                      <tr
                        key={cust.id}
                        className={`${
                          index % 2 === 0 ? "bg-white/50" : "bg-slate-50/50"
                        } hover:bg-teal-50/50 transition-all duration-150 border-b border-[#0ea5a4]/20`}
                      >
                        <td className="p-3 text-center font-medium border-r border-[#0ea5a4]/20 text-slate-800">
                          {index + 1}
                        </td>

                        {/* Editable Name (Unchanged) */}
                        <td
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
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleBlur()
                              }
                              autoFocus
                              className="border border-gray-300 px-2 py-1 w-full rounded-md focus:ring-2 focus:ring-[#0ea5a4] focus:outline-none"
                            />
                          ) : (
                            cust.name
                          )}
                        </td>

                        {/* NON-Editable Balance (Unchanged) */}
                        <td
                          className={`p-3 text-center border-r border-[#0ea5a4]/20 ${
                            parseFloat(cust.balance?.replace(/,/g, "")) > 0
                              ? "text-red-700 font-bold"
                              : "text-green-800 font-semibold"
                          }`}
                        >
                          {cust.balance || "-"}
                        </td>

                        {/* View Ledger */}
                        <td className="p-3 text-center border-r border-[#0ea5a4]/20">
                          <button
                            onClick={() =>
                              // --- MODIFIED: Pass selectedYear as query param ---
                              navigate(
                                `/home/ledger/${encodeURIComponent(
                                  cust.name
                                )}?year=${selectedYear}`
                              )
                            }
                            className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] text-white font-semibold px-4 py-2 rounded-full shadow-md transition-transform transform hover:scale-105"
                          >
                            View Full Ledger
                          </button>
                        </td>

                        {/* PDF Download */}
                        <td className="p-3 text-center">
                          {/* --- MODIFIED: Pass selectedYear as a prop --- */}
                          <Pdf
                            customerName={cust.name}
                            selectedYear={selectedYear}
                          />
                        </td>
                      </tr>
                    ))
                  )}
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
