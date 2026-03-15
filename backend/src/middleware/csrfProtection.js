import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const cookieSameSite = env.nodeEnv === "production" ? "strict" : "lax";

export const issueCsrfToken = (_req, res) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  res.cookie("csrf-token", csrfToken, {
    httpOnly: false,
    secure: env.nodeEnv === "production",
    sameSite: cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000
  });

  return csrfToken;
};

export const csrfProtection = (req, _res, next) => {
  if (safeMethods.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies["csrf-token"];
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new ApiError(403, "Invalid CSRF token"));
  }

  next();
};
