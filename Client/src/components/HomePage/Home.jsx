import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_center,_#a7f3d0_0%,_#ffffff_70%)] text-slate-900">
      <Navbar />
      <div className="flex-1">
        {/* Dynamic content goes here */}
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Home;