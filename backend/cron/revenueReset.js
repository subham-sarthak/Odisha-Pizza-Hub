import cron from "node-cron";
import Stats from "../src/models/Stats.js";

const resetField = async (field) => {
  try {
    await Stats.findOneAndUpdate(
      { key: "primary" },
      { $set: { [field]: 0 } },
      { upsert: true, new: true }
    );
    console.log(`[RevenueReset] ${field} reset to 0 at ${new Date().toISOString()}`);
  } catch (err) {
    console.error(`[RevenueReset] Failed to reset ${field}:`, err);
  }
};

export const startRevenueResetCronJobs = () => {
  // Daily reset — every day at 1:00 AM
  cron.schedule("0 1 * * *", () => resetField("dailyRevenue"));

  // Weekly reset — every Monday at 1:00 AM
  cron.schedule("0 1 * * 1", () => resetField("weeklyRevenue"));

  // Monthly reset — 1st of every month at 1:00 AM
  cron.schedule("0 1 1 * *", () => resetField("monthlyRevenue"));

  // Yearly reset — March 2nd every year at 1:00 AM
  cron.schedule("0 1 2 3 *", () => resetField("yearlyRevenue"));

  console.log("[RevenueReset] Revenue reset cron jobs scheduled");
};
