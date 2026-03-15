import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Stats from "../models/Stats.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/apiError.js";
import { sendResponse } from "../utils/response.js";

export const revenueSummary = asyncHandler(async (_req, res) => {
  const stats = await Stats.findOne({ key: "primary" }).lean();

  const daily = stats?.dailyRevenue ?? 0;
  const weekly = stats?.weeklyRevenue ?? 0;
  const monthly = stats?.monthlyRevenue ?? 0;
  const yearly = stats?.yearlyRevenue ?? 0;

  sendResponse(res, 200, "Revenue summary", { daily, weekly, monthly, yearly });
});

export const peakHourHeatmap = asyncHandler(async (_req, res) => {
  const data = await Order.aggregate([
    {
      $group: {
        _id: { $hour: "$createdAt" },
        orders: { $sum: 1 },
        revenue: { $sum: "$totalAmount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  sendResponse(res, 200, "Peak hour heatmap", data.map((d) => ({ hour: d._id, orders: d.orders, revenue: d.revenue })));
});

export const dashboardCounts = asyncHandler(async (_req, res) => {
  const [products, users, coupons, orders] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments(),
    Coupon.countDocuments(),
    Order.countDocuments()
  ]);

  sendResponse(res, 200, "Dashboard counts", { products, users, coupons, orders });
});
