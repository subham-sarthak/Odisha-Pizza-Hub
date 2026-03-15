import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../api";
import "./auth-pages.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const token = params.get("token") || "";

  const handleSubmit = async () => {
    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await authApi.resetPassword({ token, password });
      setSuccess(data.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card-enterprise">
        <p className="auth-kicker">Password Reset</p>
        <h1 className="auth-headline">Set a new password</h1>
        <p className="auth-copy">Choose a strong password with at least 8 characters.</p>

        <div className="auth-form-grid">
          <div className="auth-field">
            <label htmlFor="reset-password">New password</label>
            <input id="reset-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>

          <div className="auth-field">
            <label htmlFor="reset-confirm-password">Confirm password</label>
            <input
              id="reset-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <button type="button" className="auth-primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Reset password"}
          </button>

          {error ? <div className="auth-error-banner">{error}</div> : null}
          {success ? <div className="auth-success-banner">{success}</div> : null}
        </div>

        <div className="auth-link-row">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </section>
  );
}
