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

const isLastDayOfMonth = () => {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow.getDate() === 1;
};

export const startRevenueResetCronJobs = () => {
  // Daily reset — every day at 23:59 (11:59 PM)
  cron.schedule("59 23 * * *", () => resetField("dailyRevenue"));

  // Weekly reset — every Sunday at 23:59 (11:59 PM)
  cron.schedule("59 23 * * 0", () => resetField("weeklyRevenue"));

  // Monthly reset — last day of every month at 23:59 (11:59 PM)
  cron.schedule("59 23 * * *", () => {
    if (isLastDayOfMonth()) resetField("monthlyRevenue");
  });

  // Yearly reset — March 2nd every year at 23:59 (11:59 PM)
  cron.schedule("59 23 2 3 *", () => resetField("yearlyRevenue"));

  console.log("[RevenueReset] Revenue reset cron jobs scheduled");
};
