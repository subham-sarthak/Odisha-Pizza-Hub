import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    size: { type: String, enum: ["S", "M", "L", "XL"], required: true },
    qty: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true },
    addons: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true }
      }
    ],
    lineTotal: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    rewardUsed: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    paymentMethod: { type: String, enum: ["cod", "online"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    pickupTime: { type: String, required: true },
    tableBooking: { type: String, default: null },
    tokenNumber: { type: Number, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
      index: true
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    refundStatus: { 
      type: String, 
      enum: ["none", "requested", "approved", "rejected", "completed"], 
      default: "none" 
    },
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String, default: null },
    refundRequestedAt: { type: Date, default: null },
    refundCompletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
