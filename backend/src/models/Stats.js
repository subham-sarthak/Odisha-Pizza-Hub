import mongoose from "mongoose";

const statsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "primary", unique: true },
    dailyRevenue: { type: Number, default: 0 },
    weeklyRevenue: { type: Number, default: 0 },
    monthlyRevenue: { type: Number, default: 0 },
    yearlyRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Stats = mongoose.model("Stats", statsSchema);

export default Stats;
