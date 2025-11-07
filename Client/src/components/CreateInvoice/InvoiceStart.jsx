import React from "react";
import AppContent from "./AppContent";
import { Provider } from "react-redux";
import { store } from "../../store/store";
import { useNavigate } from "react-router-dom";

function InvoiceStart() {
  const navigate = useNavigate();

  return (
    <Provider store={store}>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_#a7f3d0_0%,_#ffffff_70%)] text-slate-900">
        {/* --- Back Button --- */}
        <div className="max-w-10xl mx-auto pt-8 px-4 sm:px-6 lg:px-6 -mb-20">
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
        </div>

        {/* --- Main Invoice App --- */}
        <AppContent />
      </div>
    </Provider>
  );
}

export default InvoiceStart;
