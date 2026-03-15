import { RateLimiterMemory } from "rate-limiter-flexible";
import { env } from "../config/env.js";
import { sendMail } from "../config/mailer.js";
import { issueCsrfToken } from "../middleware/csrfProtection.js";
import User from "../models/User.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import {
    generateRandomToken,
    hashToken,
    issueAccessToken,
    issueRefreshToken,
    refreshCookieOptions,
    verifyRefreshToken
} from "../utils/generateToken.js";
import { generateOtp } from "../utils/otpGenerator.js";
import { sendResponse } from "../utils/response.js";

const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15,
  blockDuration: 60 * 15
});

const referral = () => generateRandomToken().slice(0, 8).toUpperCase();

const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  emailVerified: user.emailVerified,
  rewardPoints: user.rewardPoints,
  referralCode: user.referralCode,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const buildVerificationEmail = (token) => `${env.frontendUrl}/verify-email?token=${token}`;
const buildResetEmail = (token) => `${env.frontendUrl}/reset-password?token=${token}`;

const attachRefreshToken = async (user, res) => {
  const refreshToken = issueRefreshToken({ userId: user._id.toString(), role: user.role, email: user.email });
  const hashedRefreshToken = hashToken(refreshToken);

  user.refreshTokens = (user.refreshTokens || [])
    .filter((entry) => entry.expiresAt > new Date())
    .slice(-4);
  user.refreshTokens.push({
    token: hashedRefreshToken,
    expiresAt: new Date(Date.now() + sevenDaysInMs)
  });

  await user.save({ validateBeforeSave: false });
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

const createSessionPayload = async (user, res) => {
  const accessToken = issueAccessToken({ userId: user._id.toString(), role: user.role, email: user.email });
  await attachRefreshToken(user, res);

  return {
    accessToken,
    user: sanitizeUser(user)
  };
};

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = buildVerificationEmail(token);
  await sendMail({
    to: user.email,
    subject: "Verify your Odisha Pizza Hub account",
    text: `Verify your account by opening ${verifyUrl}`,
    html: `<p>Welcome to Odisha Pizza Hub.</p><p>Verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`
  });
};

const sendResetEmail = async (user, token) => {
  const resetUrl = buildResetEmail(token);
  await sendMail({
    to: user.email,
    subject: "Reset your Odisha Pizza Hub password",
    text: `Reset your password by opening ${resetUrl}`,
    html: `<p>Reset your password by clicking <a href="${resetUrl}">this secure link</a>.</p>`
  });
};

const sendOtpEmail = async (user, otp) => {
  await sendMail({
    to: user.email,
    subject: "Your Odisha Pizza Hub login OTP",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    html: `<p>Your login OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`
  });
};

const withDevData = (payload) => (env.nodeEnv === "production" ? {} : payload);

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const exists = await User.findOne({ $or: [{ email }, { phone }] });
  if (exists) throw new ApiError(409, "User already exists");

  const verificationToken = generateRandomToken();
  const user = await User.create({
    name,
    email,
    phone,
    password,
    referralCode: referral(),
    emailVerificationToken: hashToken(verificationToken),
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await sendVerificationEmail(user, verificationToken);
  sendResponse(res, 201, "Registration successful. Verify your email before logging in.", {
    user: sanitizeUser(user),
    ...withDevData({ verificationToken })
  });
});

export const loginWithEmail = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const rateKey = `${req.ip}:${String(email).toLowerCase()}`;

  try {
    await loginLimiter.consume(rateKey);
  } catch (_error) {
    throw new ApiError(429, "Too many login attempts. Try again later.");
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password +emailVerificationToken +emailVerificationExpires +refreshTokens");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.emailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const session = await createSessionPayload(user, res);
  sendResponse(res, 200, "Login successful", session);
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await User.findById(payload.userId).select("+refreshTokens");
      if (user) {
        const hashed = hashToken(refreshToken);
        user.refreshTokens = user.refreshTokens.filter((entry) => entry.token !== hashed);
        await user.save({ validateBeforeSave: false });
      }
    } catch (_error) {
      // Ignore invalid refresh tokens during logout cleanup.
    }
  }

  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: undefined });
  sendResponse(res, 200, "Logout successful");
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId).select("+refreshTokens");
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const hashedRefreshToken = hashToken(refreshToken);
  const tokenRecord = user.refreshTokens.find((entry) => entry.token === hashedRefreshToken && entry.expiresAt > new Date());
  if (!tokenRecord) {
    throw new ApiError(401, "Refresh token expired or revoked");
  }

  user.refreshTokens = user.refreshTokens.filter((entry) => entry.token !== hashedRefreshToken);
  const session = await createSessionPayload(user, res);
  sendResponse(res, 200, "Token refreshed", session);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  const user = await User.findOne({
    emailVerificationToken: hashToken(String(token)),
    emailVerificationExpires: { $gt: new Date() }
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save({ validateBeforeSave: false });

  sendResponse(res, 200, "Email verified successfully", { user: sanitizeUser(user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+passwordResetToken +passwordResetExpires");
  if (!user) {
    sendResponse(res, 200, "If that email exists, a reset link has been sent");
    return;
  }

  const resetToken = generateRandomToken();
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendResetEmail(user, resetToken);
  sendResponse(res, 200, "If that email exists, a reset link has been sent", withDevData({ resetToken }));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    passwordResetToken: hashToken(String(token)),
    passwordResetExpires: { $gt: new Date() }
  }).select("+password +passwordResetToken +passwordResetExpires +refreshTokens");

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshTokens = [];
  await user.save();

  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: undefined });
  sendResponse(res, 200, "Password reset successful");
});

export const sendEmailOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+otpCode +otpExpires");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.emailVerified) {
    throw new ApiError(403, "Verify your email before requesting an OTP");
  }

  const otp = generateOtp();
  user.otpCode = hashToken(otp);
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendOtpEmail(user, otp);
  sendResponse(res, 200, "OTP sent successfully", withDevData({ otp }));
});

export const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+otpCode +otpExpires +refreshTokens");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.otpCode || !user.otpExpires || user.otpExpires < new Date()) {
    throw new ApiError(400, "OTP expired. Request a new one.");
  }

  if (user.otpCode !== hashToken(String(otp))) {
    throw new ApiError(400, "Invalid OTP");
  }

  user.otpCode = null;
  user.otpExpires = null;
  const session = await createSessionPayload(user, res);
  sendResponse(res, 200, "OTP login successful", session);
});

export const csrfToken = asyncHandler(async (req, res) => {
  const csrfTokenValue = issueCsrfToken(req, res);
  sendResponse(res, 200, "CSRF token created", { csrfToken: csrfTokenValue });
});

export const me = asyncHandler(async (req, res) => {
  sendResponse(res, 200, "Profile", sanitizeUser(req.user));
});
