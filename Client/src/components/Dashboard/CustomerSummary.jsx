import React, { useState, useEffect } from "react";

const CustomerSummary = () => {
  const defaultCustomers = [
    { id: 1, name: "SPARSH HOSPITAL", balance: "59,555.60", link: "#" },
    { id: 2, name: "AAROGYAM HOSPITAL", balance: "", link: "#" },
    { id: 3, name: "AAROGYAM AYUSHMAN", balance: "", link: "#" },
    { id: 4, name: "SITA DEVI HOSPITAL", balance: "", link: "#" },
    { id: 5, name: "SHRI RAM HOSPITAL", balance: "", link: "#" },
    { id: 6, name: "SAI NAMAN HOSPITAL", balance: "", link: "#" },
  ];

  const [customers, setCustomers] = useState(defaultCustomers);
  const [editing, setEditing] = useState({ id: null, field: "", value: "" });

  // 🧠 Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("customers");
    if (savedData) setCustomers(JSON.parse(savedData));
  }, []);

  // 💾 Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("customers", JSON.stringify(customers));
  }, [customers]);

  const handleDoubleClick = (id, field, value) => {
    setEditing({ id, field, value });
  };

  const handleChange = (e) => {
    setEditing((prev) => ({ ...prev, value: e.target.value }));
  };

  const handleBlur = () => {
    if (editing.id !== null) {
      setCustomers((prev) =>
        prev.map((cust) =>
          cust.id === editing.id
            ? { ...cust, [editing.field]: editing.value }
            : cust
        )
      );
      setEditing({ id: null, field: "", value: "" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-12 bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white text-center py-4 text-2xl font-bold tracking-wide shadow-md">
        CUSTOMER SUMMARY
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-900 text-white text-left border-b border-gray-700">
              <th className="p-3 w-12 text-center border-r border-gray-700">S.No.</th>
              <th className="p-3 border-r border-gray-700">CUSTOMER NAME</th>
              <th className="p-3 text-center border-r border-gray-700">ACCOUNT BALANCE</th>
              <th className="p-3 text-center">DETAILS</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((cust, index) => (
              <tr
                key={cust.id}
                className={`${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                } hover:bg-blue-50 transition-all duration-150 border-b border-gray-200`}
              >
                <td className="p-3 text-center font-medium border-r border-gray-300">
                  {cust.id}
                </td>

                {/* Editable Name */}
                <td
                  className="p-3 font-semibold border-r border-gray-300 cursor-pointer hover:bg-gray-100"
                  onDoubleClick={() =>
                    handleDoubleClick(cust.id, "name", cust.name)
                  }
                >
                  {editing.id === cust.id && editing.field === "name" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyDown={(e) => e.key === "Enter" && handleBlur()}
                      autoFocus
                      className="border border-gray-400 px-2 py-1 w-full rounded-md focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    cust.name
                  )}
                </td>

                {/* Editable Balance */}
                <td
                  className="p-3 text-center border-r border-gray-300 cursor-pointer hover:bg-gray-100"
                  onDoubleClick={() =>
                    handleDoubleClick(cust.id, "balance", cust.balance)
                  }
                >
                  {editing.id === cust.id && editing.field === "balance" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyDown={(e) => e.key === "Enter" && handleBlur()}
                      autoFocus
                      className="border border-gray-400 px-2 py-1 w-full rounded-md text-center focus:ring-2 focus:ring-blue-400"
                    />
                  ) : cust.balance ? (
                    `INR ${cust.balance}`
                  ) : (
                    ""
                  )}
                </td>

                {/* Ledger Link */}
                <td className="p-3 text-center">
                  <a
                    href={cust.link}
                    className="text-blue-700 underline hover:text-blue-900 font-semibold transition-all duration-150"
                  >
                    CLICK HERE FULL LEDGER
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerSummary;