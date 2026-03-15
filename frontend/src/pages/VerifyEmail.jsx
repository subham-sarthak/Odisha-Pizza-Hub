import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../api";
import "./auth-pages.css";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    authApi
      .verifyEmail(token)
      .then(({ data }) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error.response?.data?.message || "Email verification failed.");
      });
  }, [params]);

  return (
    <section className="auth-shell">
      <div className="auth-card-enterprise">
        <p className="auth-kicker">Email Verification</p>
        <h1 className="auth-headline">{status === "success" ? "Email verified" : status === "error" ? "Verification failed" : "Please wait"}</h1>
        <p className="auth-copy">{message}</p>

        <div className="auth-form-grid">
          <div className={status === "success" ? "auth-success-banner" : status === "error" ? "auth-error-banner" : "auth-success-banner"}>
            {message}
          </div>
        </div>

        <div className="auth-link-row">
          <Link to="/login">Go to login</Link>
          <Link to="/register">Create another account</Link>
        </div>
      </div>
    </section>
  );
}
