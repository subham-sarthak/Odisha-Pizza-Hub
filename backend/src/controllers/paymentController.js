import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { sendResponse } from "../utils/response.js";
import Order from "../models/Order.js";

const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, receipt } = req.body;
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt
  });
  sendResponse(res, 201, "Razorpay order created", order);
});

export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const digest = crypto
    .createHmac("sha256", env.razorpayWebhookSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature !== digest) throw new ApiError(400, "Invalid webhook signature");

  const event = req.body.event;
  if (event === "payment.captured") {
    const entity = req.body.payload.payment.entity;
    await Order.findOneAndUpdate(
      { razorpayOrderId: entity.order_id },
      { paymentStatus: "paid", razorpayPaymentId: entity.id }
    );
  }

  sendResponse(res, 200, "Webhook processed", { event });
});
