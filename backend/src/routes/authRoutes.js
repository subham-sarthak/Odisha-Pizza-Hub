import { Router } from "express";
import { body } from "express-validator";
import { RateLimiterMemory } from "rate-limiter-flexible";
import {
    csrfToken,
    forgotPassword,
    loginWithEmail,
    logout,
    me,
    refreshAccessToken,
    register,
    resetPassword,
    sendEmailOtp,
    verifyEmail,
    verifyEmailOtp
} from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ApiError } from "../utils/apiError.js";

const router = Router();

const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15,
  blockDuration: 60 * 15
});

const otpLimiter = new RateLimiterMemory({
  points: 3,
  duration: 60 * 10,
  blockDuration: 60 * 10
});

const consumeLimiter = (limiter, keyBuilder) => async (req, _res, next) => {
  try {
    await limiter.consume(keyBuilder(req));
    next();
  } catch (_error) {
    next(new ApiError(429, "Too many requests. Try again later."));
  }
};

router.post(
  "/register",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("phone").optional({ values: "falsy" }).isLength({ min: 10, max: 15 }),
    body("password").isLength({ min: 8 })
  ],
  validate,
  register
);

router.get("/csrf-token", csrfToken);
router.get("/verify-email", verifyEmail);
router.post(
  "/login",
  consumeLimiter(authLimiter, (req) => `${req.ip}:${String(req.body.email || "").toLowerCase()}`),
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  loginWithEmail
);
router.post("/logout", logout);
router.post("/refresh-token", refreshAccessToken);
router.post(
  "/forgot-password",
  consumeLimiter(authLimiter, (req) => `${req.ip}:${String(req.body.email || "").toLowerCase()}:forgot`),
  [body("email").isEmail().normalizeEmail()],
  validate,
  forgotPassword
);
router.post(
  "/reset-password",
  [body("token").notEmpty(), body("password").isLength({ min: 8 })],
  validate,
  resetPassword
);
router.post(
  "/send-otp",
  consumeLimiter(otpLimiter, (req) => `${req.ip}:${String(req.body.email || "").toLowerCase()}:otp`),
  [body("email").isEmail().normalizeEmail()],
  validate,
  sendEmailOtp
);
router.post(
  "/verify-otp",
  [body("email").isEmail().normalizeEmail(), body("otp").isLength({ min: 6, max: 6 })],
  validate,
  verifyEmailOtp
);
router.get("/me", auth, me);

export default router;
