import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./auth-pages.css";

const getDestination = (user, fallbackPath) => {
  if (user.role === "admin") {
    return fallbackPath?.startsWith("/admin") ? fallbackPath : "/admin-dashboard";
  }
  return fallbackPath || "/menu";
};

export default function LoginPage({ mode = "customer" }) {
  const [authMode, setAuthMode] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const expectedRole = mode === "admin" ? "admin" : null;
  const fallbackPath = location.state?.from?.pathname;

  const submitPasswordLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const user = await login({ email, password }, expectedRole);
      navigate(getDestination(user, fallbackPath), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await requestOtp(email);
      setMessage(data?.otp ? `Development OTP: ${data.otp}` : "OTP sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const user = await verifyOtp({ email, otp }, expectedRole);
      navigate(getDestination(user, fallbackPath), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card-enterprise auth-card-wide">
        <p className="auth-kicker">Odisha Pizza Hub Security</p>
        <h1 className="auth-headline">{mode === "admin" ? "Admin Access" : "Customer Login"}</h1>
        <p className="auth-copy">
          {mode === "admin"
            ? "Access is limited to verified admin accounts with role-based enforcement."
            : "Sign in with your password or request an email OTP to continue ordering."}
        </p>

        <div className="auth-chip-row" style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            className={`auth-chip-btn ${authMode === "password" ? "active" : ""}`}
            onClick={() => setAuthMode("password")}
          >
            Password Login
          </button>
          <button
            type="button"
            className={`auth-chip-btn ${authMode === "otp" ? "active" : ""}`}
            onClick={() => setAuthMode("otp")}
          >
            Email OTP
          </button>
        </div>

        <div className="auth-form-grid">
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder={mode === "admin" ? "admin@odishapizza.com" : "you@example.com"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          {authMode === "password" ? (
            <>
              <div className="auth-field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <button type="button" className="auth-primary-btn" onClick={submitPasswordLogin} disabled={loading}>
                {loading ? "Signing in..." : mode === "admin" ? "Login as Admin" : "Sign In"}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="auth-secondary-btn" onClick={handleSendOtp} disabled={loading || !email}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
              <div className="auth-field">
                <label htmlFor="login-otp">One-Time Password</label>
                <input
                  id="login-otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                />
              </div>
              <button type="button" className="auth-primary-btn" onClick={handleVerifyOtp} disabled={loading || !otp}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          {error ? <div className="auth-error-banner">{error}</div> : null}
          {message ? <div className="auth-success-banner">{message}</div> : null}
        </div>

        <div className="auth-link-row">
          {mode !== "admin" ? <Link to="/register">Create account</Link> : <Link to="/login">Customer login</Link>}
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </div>
    </section>
  );
}
