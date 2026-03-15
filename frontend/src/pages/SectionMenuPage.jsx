import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

export default function SectionMenuPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { items } = useCart();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productApi.categories();
        setCategories(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const categoryEmojis = {
    "PIZZA": "🍕",
    "BURGER": "🍔",
    "BIRIYANI": "🍚",
    "PASTA": "🍝",
    "HOT CAKE": "🥞",
    "MOMOS": "🥟",
    "FRIED CHICKEN": "🍗",
    "DRINKS (MILK SHAKE)": "🥤",
    "ICE CREAM": "🍦",
    "SOFT DRINKS": "🥤",
    "VEG FRIES": "🍟",
    "APPETIZERS": "🍖",
    "SALAD": "🥗",
    "DESSERTS": "🍰"
  };

  return (
    <section className="section-menu-page">
      {/* Header */}
      <header className="menu-header">
        <div className="container">
          <div className="header-topbar">
            <div className="header-brand">
              <span className="logo-badge">OPH</span>
              <h1>Menu Sections</h1>
            </div>
            <div className="header-actions">
              <button
                className="outline-btn"
                onClick={toggleTheme}
                title="Toggle theme"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <Link to="/menu">All Items</Link>
              {!user ? (
                <Link className="solid-btn" to="/auth">Sign in</Link>
              ) : (
                <button className="solid-btn" onClick={logout}>Logout</button>
              )}
              <Link className="cart-mini" to="/cart">🛒 {items.length}</Link>
            </div>
          </div>

          <motion.div
            className="section-title-section"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Browse Our Menu</h2>
            <p>Select a section to explore our delicious offerings</p>
          </motion.div>
        </div>
      </header>

      {/* Content */}
      <section className="section-content">
        <div className="container">
          {loading ? (
            <motion.div
              className="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="spinner"></div>
              <p>Loading menu sections...</p>
            </motion.div>
          ) : categories.length === 0 ? (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="empty-icon">📋</div>
              <h3>No Sections Found</h3>
              <p>We're updating our menu. Please check back soon!</p>
            </motion.div>
          ) : (
            <motion.div
              className="sections-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {categories.map((category, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  onClick={() => navigate(`/category/${encodeURIComponent(category)}`)}
                  className="section-card"
                >
                  <div className="section-icon">
                    {categoryEmojis[category] || "🍽️"}
                  </div>
                  <h3>{category}</h3>
                  <p className="item-count">See our items</p>
                  <motion.div
                    className="view-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Items →
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </section>
  );
}
