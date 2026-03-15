import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./styles.css";

// Clear all caches on app start
if ('caches' in window) {
  caches.keys().then(names => names.forEach(name => caches.delete(name)));
}

console.log('%c✨ LOADING FRESH VERSION - ' + new Date().toLocaleTimeString(), 'color: blue; font-size: 14px; font-weight: bold');

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
