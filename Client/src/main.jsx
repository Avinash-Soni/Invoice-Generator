import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// --- 1. Import Provider and store ---
import { Provider } from "react-redux";
import { store } from "./store/store"; // Adjust path if needed

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* --- 2. Wrap your ENTIRE app in the Provider --- */}
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
