import dotenv from "dotenv";

dotenv.config();

const required = ["PORT", "MONGO_URI", "JWT_SECRET", "REDIS_URL", "FRONTEND_URL"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || `${process.env.JWT_SECRET}-refresh`,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  redisUrl: process.env.REDIS_URL,
  redisEnabled: process.env.REDIS_ENABLED === "true",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
  smsProvider: process.env.SMS_PROVIDER || "mock",
  whatsappProvider: process.env.WHATSAPP_PROVIDER || "mock",
  emailProvider: process.env.EMAIL_PROVIDER || "mock",
  mailFrom: process.env.MAIL_FROM || "Odisha Pizza Hub <no-reply@odishapizza.com>",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS
};
