import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const cookieSameSite = env.nodeEnv === "production" ? "strict" : "lax";

export const issueAccessToken = ({ userId, role, email }) =>
  jwt.sign({ userId, role, email, type: "access" }, env.jwtSecret, {
    expiresIn: env.accessTokenExpiresIn
  });

export const issueRefreshToken = ({ userId, role, email }) =>
  jwt.sign({ userId, role, email, type: "refresh" }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiresIn
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.refreshTokenSecret);

export const hashToken = (value) => crypto.createHash("sha256").update(value).digest("hex");
export const generateRandomToken = () => crypto.randomBytes(32).toString("hex");

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: cookieSameSite,
  path: "/api/auth/refresh-token",
  maxAge: 7 * 24 * 60 * 60 * 1000
};
