import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_center,#0ea5a4_0%,#056b66_70%)] text-white">
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
