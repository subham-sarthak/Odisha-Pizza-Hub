import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/apiError.js";
import { sendResponse } from "../utils/response.js";

export const revenueSummary = asyncHandler(async (_req, res) => {
  const now = new Date();

  // Start of today (midnight)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Start of this week (Sunday midnight)
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

  // Start of this month (1st)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Yearly period starts March 2; if today is before March 2 use previous year's March 2
  let yearStart = new Date(now.getFullYear(), 2, 2);
  if (now < yearStart) yearStart = new Date(now.getFullYear() - 1, 2, 2);

  const [daily, weekly, monthly, yearly] = await Promise.all([
    Order.aggregate([{ $match: { createdAt: { $gte: startOfDay }, status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: startOfWeek }, status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: startOfMonth }, status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: yearStart }, status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }])
  ]);

  sendResponse(res, 200, "Revenue summary", {
    daily: daily[0]?.total ?? 0,
    weekly: weekly[0]?.total ?? 0,
    monthly: monthly[0]?.total ?? 0,
    yearly: yearly[0]?.total ?? 0
  });
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

export const customerDetails = asyncHandler(async (_req, res) => {
  const customers = await User.find()
    .select("name email phone role createdAt")
    .sort({ createdAt: -1 })
    .lean();

  if (customers.length === 0) {
    sendResponse(res, 200, "Customer details", []);
    return;
  }

  const customerIds = customers.map((customer) => customer._id);
  const stats = await Order.aggregate([
    { $match: { userId: { $in: customerIds } } },
    {
      $group: {
        _id: "$userId",
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
        lastOrderAt: { $max: "$createdAt" }
      }
    }
  ]);

  const statsMap = new Map(stats.map((entry) => [String(entry._id), entry]));
  const payload = customers.map((customer) => {
    const customerStats = statsMap.get(String(customer._id));
    return {
      ...customer,
      totalOrders: customerStats?.totalOrders || 0,
      totalSpent: customerStats?.totalSpent || 0,
      lastOrderAt: customerStats?.lastOrderAt || null
    };
  });

  sendResponse(res, 200, "Customer details", payload);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent the currently logged-in admin from deleting themselves.
  if (String(req.user._id) === String(id)) {
    return sendResponse(res, 400, "You cannot delete your own account.", null);
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return sendResponse(res, 404, "User not found.", null);
  }

  sendResponse(res, 200, "User deleted successfully.", { id });
});
