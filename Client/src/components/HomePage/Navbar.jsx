import { Link, useNavigate } from "react-router-dom";
import DesignerSquareLogo from "../logo/DesignerSquareLogo";
import { useAuth } from "../LoginPage/AuthContext";

const Navbar = () => {
  const { logout } = useAuth(); // get logout function from context
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); // calls backend to destroy session and updates context
      navigate("/login"); // redirect to login page
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="flex items-center justify-between px-10 py-4 bg-transparent text-white">
      <h1 className="text-3xl font-bold">
        <DesignerSquareLogo size={200} />
      </h1>
      <div className="flex gap-6 text-base font-medium">
        <Link to="/home" className="hover:text-[#0bd1c5] transition-colors">Home</Link>
        <Link to="/home/features" className="hover:text-[#0bd1c5] transition-colors">Features</Link>
        <Link to="/home/contact" className="hover:text-[#0bd1c5] transition-colors">Contact</Link>
        <button
          onClick={handleLogout}
          className="hover:text-[#0bd1c5] transition-colors font-medium bg-transparent border-none cursor-pointer"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
