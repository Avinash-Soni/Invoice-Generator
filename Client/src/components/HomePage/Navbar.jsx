import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../LoginPage/AuthContext";
import logoImage from '../../assets/Logo.png';
import { useState } from "react";
// --- 1. Import Redux tools ---
import { useDispatch } from "react-redux";
import { clearCustomers } from "../../store/CustomerSlice"; // Adjust path if needed
import { clearInvoices } from "../../store/InvoiceSlice"; // Adjust path if needed

const Navbar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  // --- 2. Get the dispatch function ---
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await logout(); // Calls your AuthContext logout
      
      // --- 3. Dispatch actions to clear Redux state ---
      dispatch(clearCustomers());
      dispatch(clearInvoices());
      
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      // Also clear state on failure, just in case
      dispatch(clearCustomers());
      dispatch(clearInvoices());
      navigate("/login");
    }
  };

  return (
    <>
      <nav className="flex items-center justify-between px-10 py-4 bg-transparent text-white-800">
        <Link to="/home">
          <img
            src={logoImage}
            alt="Designer Square Logo"
            className="h-15 sm:h-15 md:h-20 lg:h-20"
            style={{ width: 'auto' }}
          />
        </Link>
        <div className="flex gap-6 text-base font-medium">
          <Link to="/home" className="hover:text-[#0bd1c5] transition-colors">Home</Link>
          <Link to="/home/features" className="hover:text-[#0bd1c5] transition-colors">Features</Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="hover:text-[#0bd1c5] transition-colors font-medium bg-transparent border-none cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </nav>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white/80 backdrop-blur-lg rounded-xl border border-[#0ea5a4]/50 shadow-lg p-6 max-w-sm mx-4 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Confirm Logout</h2>
            <p className="mb-6 text-slate-700">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-slate-800 px-6 py-2 rounded-full font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout} // This now runs your updated function
                className="bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] text-white px-6 py-2 rounded-full font-medium shadow-lg transition-all"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;