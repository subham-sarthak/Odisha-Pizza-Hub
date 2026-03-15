import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./auth-pages.css";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setVerificationToken("");

    try {
      const data = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      });
      setSuccess("Registration successful. Check your email and verify the account before login.");
      setVerificationToken(data?.verificationToken || "");
      setForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card-enterprise auth-card-wide">
        <p className="auth-kicker">Customer Onboarding</p>
        <h1 className="auth-headline">Create your account</h1>
        <p className="auth-copy">Register as a customer. Email verification is required before you can log in.</p>

        <div className="auth-form-grid">
          <div className="auth-grid-two">
            <div className="auth-field">
              <label htmlFor="register-name">Full name</label>
              <input id="register-name" name="name" value={form.name} onChange={onChange} />
            </div>
            <div className="auth-field">
              <label htmlFor="register-phone">Phone</label>
              <input id="register-phone" name="phone" value={form.phone} onChange={onChange} />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email</label>
            <input id="register-email" type="email" name="email" value={form.email} onChange={onChange} />
          </div>

          <div className="auth-grid-two">
            <div className="auth-field">
              <label htmlFor="register-password">Password</label>
              <input id="register-password" type="password" name="password" value={form.password} onChange={onChange} />
            </div>
            <div className="auth-field">
              <label htmlFor="register-confirm-password">Confirm password</label>
              <input
                id="register-confirm-password"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
              />
            </div>
          </div>

          <button type="button" className="auth-primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>

          {error ? <div className="auth-error-banner">{error}</div> : null}
          {success ? <div className="auth-success-banner">{success}</div> : null}
          {verificationToken ? (
            <div className="auth-success-banner">
              Development verification link: <Link className="auth-inline-link" to={`/verify-email?token=${verificationToken}`}>Verify now</Link>
            </div>
          ) : null}
        </div>

        <div className="auth-link-row">
          <Link to="/login">Already have an account?</Link>
          <Link to="/admin-login">Admin login</Link>
        </div>
      </div>
    </section>
  );
}
