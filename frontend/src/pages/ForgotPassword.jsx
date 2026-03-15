import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api";
import "./auth-pages.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setResetToken("");

    try {
      const { data } = await authApi.forgotPassword({ email });
      setSuccess(data.message);
      setResetToken(data.data?.resetToken || "");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to process password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card-enterprise">
        <p className="auth-kicker">Password Recovery</p>
        <h1 className="auth-headline">Forgot your password?</h1>
        <p className="auth-copy">We will send a secure reset link to the email address attached to your account.</p>

        <div className="auth-form-grid">
          <div className="auth-field">
            <label htmlFor="forgot-email">Email</label>
            <input id="forgot-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          <button type="button" className="auth-primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Sending link..." : "Send reset link"}
          </button>

          {error ? <div className="auth-error-banner">{error}</div> : null}
          {success ? <div className="auth-success-banner">{success}</div> : null}
          {resetToken ? (
            <div className="auth-success-banner">
              Development reset link: <Link className="auth-inline-link" to={`/reset-password?token=${resetToken}`}>Reset now</Link>
            </div>
          ) : null}
        </div>

        <div className="auth-link-row">
          <Link to="/login">Back to login</Link>
          <Link to="/register">Create account</Link>
        </div>
      </div>
    </section>
  );
}
