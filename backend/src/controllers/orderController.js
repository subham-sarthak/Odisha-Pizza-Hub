import fs from "fs";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import OrderArchive from "../models/OrderArchive.js";
import Product from "../models/Product.js";
import Stats from "../models/Stats.js";
import StoreStatus from "../models/StoreStatus.js";
import User from "../models/User.js";
import { notifyOrderEvent } from "../services/notificationService.js";
import { createOrdersPdfBuffer } from "../services/orderArchiveService.js";
import { calculateRewardEarned, maxRewardRedeem } from "../services/rewardService.js";
import { emitNewOrder, emitOrderUpdate } from "../sockets/index.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { sendResponse } from "../utils/response.js";

const getNextToken = async () => {
  const latest = await Order.findOne().sort({ tokenNumber: -1 }).select("tokenNumber");
  return latest ? latest.tokenNumber + 1 : 1001;
};

const allowedStatuses = new Set(["pending", "accepted", "rejected", "preparing", "ready", "completed", "cancelled"]);

const serializeOrderForRealtime = async (orderId) =>
  Order.findById(orderId).populate("userId", "name phone email");

const shapeRealtimeOrder = (orderDoc) => {
  if (!orderDoc) return null;

  const plain = typeof orderDoc.toObject === "function" ? orderDoc.toObject() : orderDoc;
  return {
    ...plain,
    customerName: plain.userId?.name || "Customer",
    totalPrice: plain.totalAmount
  };
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod, pickupTime, tableBooking, couponCode, rewardToRedeem = 0, razorpayOrderId } = req.body;
  if (!items?.length) throw new ApiError(400, "Items required");

  const storeStatus = await StoreStatus.findOneAndUpdate(
    { key: "primary" },
    { $setOnInsert: { key: "primary", isOpen: true } },
    { new: true, upsert: true }
  );
  if (!storeStatus.isOpen) throw new ApiError(403, "Store is currently closed");

  const user = await User.findById(req.user._id);
  let subtotal = 0;
  const normalizedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isAvailable || product.stock < item.qty) {
      throw new ApiError(400, `Unavailable product: ${item.productId}`);
    }

    const sizeInfo = product.sizes.find((s) => s.label === item.size);
    if (!sizeInfo) throw new ApiError(400, `Invalid size for ${product.name}`);

    const addonList = [];
    if (Array.isArray(item.addons)) {
      for (const addonName of item.addons) {
        const addon = product.addons.find((a) => a.name === addonName);
        if (addon) addonList.push({ name: addon.name, price: addon.price });
      }
    }

    const addonTotal = addonList.reduce((acc, a) => acc + a.price, 0);
    const lineTotal = (sizeInfo.price + addonTotal) * item.qty;
    subtotal += lineTotal;

    normalizedItems.push({
      product: product._id,
      productName: product.name,
      size: item.size,
      qty: item.qty,
      basePrice: sizeInfo.price,
      addons: addonList,
      lineTotal
    });

    product.stock -= item.qty;
    await product.save();
  }

  let couponDiscount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && coupon.expiry >= new Date() && subtotal >= coupon.minOrderValue) {
      couponDiscount = Math.min((subtotal * coupon.discountPercent) / 100, coupon.maxDiscount || Infinity);
    }
  }

  const maxRedeem = maxRewardRedeem(user.rewardPoints, subtotal - couponDiscount);
  const rewardUsed = Math.min(rewardToRedeem, maxRedeem);
  const totalAmount = Math.max(0, subtotal - couponDiscount - rewardUsed);

  user.rewardPoints = Math.max(0, user.rewardPoints - rewardUsed) + calculateRewardEarned(totalAmount);
  await user.save();

  const tokenNumber = await getNextToken();
  const order = await Order.create({
    userId: user._id,
    items: normalizedItems,
    totalAmount,
    rewardUsed,
    couponCode: couponCode || null,
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
    pickupTime,
    tableBooking,
    tokenNumber,
    status: "pending",
    razorpayOrderId: razorpayOrderId || null
  });

  const liveOrderDoc = await serializeOrderForRealtime(order._id);
  const liveOrder = shapeRealtimeOrder(liveOrderDoc);

  // Update persistent revenue stats (fire-and-forget, non-blocking)
  Stats.findOneAndUpdate(
    { key: "primary" },
    {
      $inc: {
        dailyRevenue: totalAmount,
        weeklyRevenue: totalAmount,
        monthlyRevenue: totalAmount,
        yearlyRevenue: totalAmount,
        totalOrders: 1
      }
    },
    { upsert: true }
  ).catch((err) => console.error("[Stats] Failed to update revenue stats:", err));

  emitNewOrder(liveOrder);
  emitOrderUpdate({ userId: user._id.toString(), order: liveOrder });
  await notifyOrderEvent({ user, order, event: "order_created" });

  sendResponse(res, 201, "Order placed", liveOrder);
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  sendResponse(res, 200, "My orders", orders);
});

export const listOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().populate("userId", "name phone email").sort({ createdAt: -1 });
  sendResponse(res, 200, "All orders", orders);
});

export const exportOrdersPdf = asyncHandler(async (_req, res) => {
  const orders = await Order.find().populate("userId", "name phone email").sort({ createdAt: -1 }).lean();

  const generatedAt = new Date();
  const pdfBuffer = await createOrdersPdfBuffer({
    title: "Odisha Pizza Hub",
    orders,
    generatedAt
  });

  const fileStamp = generatedAt.toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=all-orders-${fileStamp}.pdf`);
  res.send(pdfBuffer);
});

export const exportFullHistoryOrdersPdf = asyncHandler(async (_req, res) => {
  const [activeOrders, archives] = await Promise.all([
    Order.find().populate("userId", "name phone email").sort({ createdAt: -1 }).lean(),
    OrderArchive.find().sort({ archiveDate: -1, createdAt: -1 }).lean()
  ]);

  const archivedOrders = archives.flatMap((archive) => {
    if (Array.isArray(archive.archivedOrders) && archive.archivedOrders.length) {
      return archive.archivedOrders.map((order) => ({
        _id: order.orderId,
        tokenNumber: order.tokenNumber,
        isArchiveSummary: false,
        customerName: order.customerName,
        userId: { name: order.customerName },
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        totalPrice: order.totalPrice,
        items: Array.isArray(order.items)
          ? order.items.map((item) => ({
            productName: item.name,
            name: item.name,
            qty: item.qty
          }))
          : [],
        createdAt: order.createdAt
      }));
    }

    const fallbackOrder = {
      _id: `legacy-${archive._id}`,
      tokenNumber: null,
      isArchiveSummary: true,
      archiveLabel: `Legacy Archive Summary (${new Date(archive.archiveDate || archive.generatedAt).toLocaleDateString("en-IN")})`,
      customerName: "Legacy Archive",
      userId: { name: "Legacy Archive" },
      status: "archive-summary",
      paymentMethod: "mixed",
      paymentStatus: "summary",
      totalAmount: Number(archive.totalAmount || 0),
      totalPrice: Number(archive.totalAmount || 0),
      items: [{ productName: "Legacy archive total", name: "Legacy archive total", qty: 1 }],
      createdAt: archive.toDate || archive.archiveDate || archive.generatedAt
    };

    return [fallbackOrder];
  });

  const activeIds = new Set(activeOrders.map((order) => String(order._id)));
  const historicalOnlyOrders = archivedOrders.filter((order) => !activeIds.has(String(order._id)));
  const orders = [...activeOrders, ...historicalOnlyOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const generatedAt = new Date();
  const pdfBuffer = await createOrdersPdfBuffer({
    title: "Odisha Pizza Hub Full History",
    orders,
    generatedAt
  });

  const fileStamp = generatedAt.toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=all-orders-full-history-${fileStamp}.pdf`);
  res.send(pdfBuffer);
});

export const listOrderArchives = asyncHandler(async (_req, res) => {
  const archives = await OrderArchive.find()
    .sort({ archiveDate: -1, createdAt: -1 })
    .select("_id fileName archiveDate orderCount totalAmount fromDate toDate generatedAt")
    .lean();

  sendResponse(res, 200, "Order archives", archives);
});

export const downloadOrderArchive = asyncHandler(async (req, res) => {
  const archive = await OrderArchive.findById(req.params.id).lean();
  if (!archive) throw new ApiError(404, "Archive not found");
  if (!archive.filePath || !fs.existsSync(archive.filePath)) {
    throw new ApiError(404, "Archive file not found on server");
  }

  res.download(archive.filePath, archive.fileName);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const status = String(req.body.status || "").toLowerCase();
  if (!allowedStatuses.has(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");

  order.status = status;
  if (status === "completed" && order.paymentMethod === "cod") {
    order.paymentStatus = "paid";
  }
  await order.save();

  const liveOrderDoc = await serializeOrderForRealtime(order._id);
  const liveOrder = shapeRealtimeOrder(liveOrderDoc);

  emitOrderUpdate({ userId: order.userId.toString(), order: liveOrder });

  const user = await User.findById(order.userId);
  await notifyOrderEvent({ user, order, event: "order_status_updated" });

  sendResponse(res, 200, "Order updated", liveOrder);
});

export const requestRefund = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
  
  if (!order) throw new ApiError(404, "Order not found");
  if (order.refundStatus !== "none") throw new ApiError(400, "Refund already requested");
  if (order.paymentStatus !== "paid") throw new ApiError(400, "Only paid orders can be refunded");

  order.refundStatus = "requested";
  order.refundReason = reason;
  order.refundAmount = order.totalAmount;
  order.refundRequestedAt = new Date();
  await order.save();

  sendResponse(res, 200, "Refund requested successfully", order);
});

export const processRefund = asyncHandler(async (req, res) => {
  const { status, amount } = req.body; // status: "approved" or "rejected"
  const order = await Order.findById(req.params.id);
  
  if (!order) throw new ApiError(404, "Order not found");
  if (order.refundStatus !== "requested") throw new ApiError(400, "No refund request found");

  if (status === "approved") {
    order.refundStatus = "completed";
    order.refundAmount = amount || order.totalAmount;
    order.refundCompletedAt = new Date();
    
    // Return reward points if used
    if (order.rewardUsed > 0) {
      const user = await User.findById(order.userId);
      user.rewardPoints += order.rewardUsed;
      await user.save();
    }
  } else if (status === "rejected") {
    order.refundStatus = "rejected";
  }

  await order.save();
  sendResponse(res, 200, "Refund processed", order);
});

export const listRefunds = asyncHandler(async (_req, res) => {
  const refunds = await Order.find({ 
    refundStatus: { $in: ["requested", "approved", "completed", "rejected"] }
  })
  .populate("userId", "name phone email")
  .sort({ refundRequestedAt: -1 });
  
  sendResponse(res, 200, "Refund requests", refunds);
});
