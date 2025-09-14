import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage/LoginPage.jsx";
import Home from "./components/HomePage/Home.jsx";
import Hero from "./components/HomePage/Hero.jsx";
import Features from "./components/HomePage/Features.jsx";
import Contact from "./components/HomePage/Contact.jsx";
import { AuthProvider } from "./components/LoginPage/AuthContext";
import PrivateRoute from "./components/LoginPage/PrivateRoute";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/home" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }>
            <Route index element={<><Hero /><Features /></>} />
            <Route path="features" element={<Features />} />
            <Route path="contact" element={<Contact />} />
          </Route>
        </Routes>
    </AuthProvider>
  );
}
