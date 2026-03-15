import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <motion.nav 
      className="top-nav"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <Link to="/menu" style={{ textDecoration: 'none' }}>
        <motion.h1
          whileHover={{ scale: 1.05 }}
          style={{ 
            background: 'linear-gradient(135deg, var(--brand), var(--accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          🍕 Odisha Pizza Hub
        </motion.h1>
      </Link>
      <div className="links">
        <Link className={location.pathname === "/menu" ? "active" : ""} to="/menu">
          <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>Menu</motion.span>
        </Link>
        <Link className={location.pathname === "/cart" ? "active" : ""} to="/cart">
          <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>Cart</motion.span>
        </Link>
        {user && (
          <Link className={location.pathname === "/dashboard" ? "active" : ""} to="/dashboard">
            <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>Dashboard</motion.span>
          </Link>
        )}
        {!user ? (
          <Link to="/auth">
            <motion.span 
              style={{ 
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, var(--brand), var(--accent))',
                borderRadius: '0.5rem',
                fontWeight: '600'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.span>
          </Link>
        ) : (
          <motion.button 
            onClick={logout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        )}
      </div>
    </motion.nav>
  );
}
