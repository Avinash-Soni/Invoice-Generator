import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./AuthContext";
import logoImage from '../../assets/Logo1.png';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:8080/login",
        { email, password },
        { withCredentials: true } // important to send cookies
      );
      login(); // update context: user is now logged in
      navigate("/home"); // redirect to home page
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Login failed. Try again.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8080/signup",
        { name, email, password, mobileNumber },
        { withCredentials: true }
      );
      alert(response.data.message);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.error || "Sign up failed.");
      } else {
        alert("Could not connect to the server.");
      }
    }
  };



  return (
    <div className={`container ${isSignUp ? "sign-up-mode" : ""}`}>
      <div className="forms-container">
        <div className="signin-signup">
          {/* Sign in form */}
          <form action="#" className="sign-in-form" onSubmit={handleLogin}>
            <h2 className="title">Sign in</h2>
            <div className="input-field">
              <i className="fas fa-user"></i>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <input type="submit" value="Login" className="btn solid" />
          </form>

          {/* Sign up form */}
          <form action="#" className="sign-up-form" onSubmit={handleSignUp}>
            <h2 className="title">Sign up</h2>
            <div className="input-field">
              <i className="fas fa-user"></i>
              <input
                type="text"
                placeholder="Username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-field">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-field">
              <i className="fas fa-phone-alt"></i>
              <input
                type="tel"
                placeholder="Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
              />
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <input type="submit" className="btn" value="Sign up" />
          </form>
        </div>
      </div>

      {/* Panels */}
      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
            <div className="flex items-center justify-center">
              {/* REPLACED this: <DesignerSquareLogo size={250} /> */}
              <img src={logoImage} alt="Designer Square Logo" className="w-64 h-auto" />
            </div>
            <h3>Don't have an account?</h3>
            <p>
              Sign up now and get started with all our features in just a few clicks.
            </p>
            <button
              className="btn transparent"
              onClick={() => setIsSignUp(true)}
            >
              Sign up
            </button>
          </div>
        </div>

        <div className="panel right-panel">
          <div className="content">
            <div className="flex items-center justify-center">
              {/* REPLACED this: <DesignerSquareLogo size={250} /> */}
              <img src={logoImage} alt="Designer Square Logo" className="w-64 h-auto" />
            </div>
            <h3>Join Our Community</h3>
            <p>Sign in to access your account and explore more features</p>
            <button
              className="btn transparent"
              onClick={() => setIsSignUp(false)}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>

      {/* Optional notification display */}
      {notification && (
        <div
          className={`notification ${notification.type}`}
          style={{ marginTop: "1rem", textAlign: "center" }}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}