import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const register = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      saveAuth(data.data.token, data.data.user);
      navigate("/menu");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      saveAuth(data.data.token, data.data.user);
      navigate("/menu");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = isLogin ? login : register;

  return (
    <section className="auth-page-new">
      {/* Left Side - Food Image */}
      <motion.div 
        className="auth-left"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-logo-wrapper">
          <h1 className="auth-logo">🍕 food</h1>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=700&fit=crop" 
          alt="Delicious Food" 
          className="auth-food-image"
        />
      </motion.div>

      {/* Right Side - Form */}
      <motion.div 
        className="auth-right"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-form-wrapper">
          <h2 className="auth-title">{isLogin ? "Login" : "Register"}</h2>

          <div className="auth-inputs">
            {!isLogin && (
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={onChange}
                className="auth-input"
              />
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={onChange}
              className="auth-input"
            />
            {!isLogin && (
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={onChange}
                className="auth-input"
              />
            )}
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={onChange}
              className="auth-input"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <motion.button
            className="auth-signin-btn"
            onClick={handleSubmit}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? "Processing..." : isLogin ? "Sign in" : "Register"}
          </motion.button>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="auth-social">
            <button className="social-btn" title="Google">
              <span>G</span>
            </button>
            <button className="social-btn" title="GitHub">
              <span>⚙️</span>
            </button>
            <button className="social-btn" title="Facebook">
              <span>f</span>
            </button>
          </div>

          <p className="auth-toggle">
            {isLogin ? "Don't have an account yet? " : "Already have an account? "}
            <button 
              className="auth-link"
              onClick={() => {
                setIsLogin(!isLogin);
                setForm({ name: "", email: "", phone: "", password: "" });
                setError("");
              }}
            >
              {isLogin ? "Register for free" : "Login here"}
            </button>
          </p>
        </div>
      </motion.div>
    </section>
  );
}
