import cron from "node-cron";
import Order from "../src/models/Order.js";
import { generateDailyOrdersPdf } from "../src/utils/pdfGenerator.js";

const DAILY_REPORT_CRON = "0 59 23 * * *";

const buildDayRange = (dateValue = new Date()) => {
  const baseDate = new Date(dateValue);
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const generateReportForDay = async (dateValue = new Date()) => {
  const { start, end } = buildDayRange(dateValue);

  const orders = await Order.find({
    createdAt: {
      $gte: start,
      $lte: end
    }
  })
    .populate("userId", "name")
    .sort({ createdAt: 1 })
    .lean();

  return generateDailyOrdersPdf({
    reportDate: start,
    orders
  });
};

export const startOrderReportCronJobs = () => {
  // Create today's file at startup so admins can access the running day's report immediately.
  generateReportForDay().catch((error) => {
    console.error("Failed to generate startup daily report", error);
  });

  const reportTask = cron.schedule(DAILY_REPORT_CRON, async () => {
    try {
      const report = await generateReportForDay(new Date());
      console.log(`Order report generated: ${report.fileName} (${report.orderCount} orders)`);
    } catch (error) {
      console.error("Daily order report generation failed", error);
    }
  });

  return { reportTask };
};
