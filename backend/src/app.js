import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { csrfProtection } from "./middleware/csrfProtection.js";
import { errorHandler } from "./middleware/errorHandler.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import orderReportRoutes from "./routes/orderReportRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";

const app = express();

app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(csrfProtection);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-reports", orderReportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/store", storeRoutes);

app.use(errorHandler);

export default app;
