import Coupon from "../models/Coupon.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { sendResponse } from "../utils/response.js";

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, amount } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon || coupon.expiry < new Date()) throw new ApiError(400, "Invalid coupon");
  if (amount < coupon.minOrderValue) throw new ApiError(400, "Minimum order value not met");

  const rawDiscount = (amount * coupon.discountPercent) / 100;
  const discount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
  sendResponse(res, 200, "Coupon applied", { discount, coupon });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase() });
  sendResponse(res, 201, "Coupon created", coupon);
});

export const listCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  sendResponse(res, 200, "Coupons", coupons);
});

export const listPublicCoupons = asyncHandler(async (_req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({ isActive: true, expiry: { $gte: now } })
    .select("code discountPercent minOrderValue maxDiscount expiry")
    .sort({ discountPercent: -1 });
  sendResponse(res, 200, "Public coupons", coupons);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  sendResponse(res, 200, "Coupon updated", coupon);
});
