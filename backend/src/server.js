import http from "http";
import { Server } from "socket.io";
import { startOrderReportCronJobs } from "../cron/generateDailyReport.js";
import { startRevenueResetCronJobs } from "../cron/revenueReset.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import "./config/redis.js";
import { setupSocket } from "./sockets/index.js";

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.frontendUrl,
      methods: ["GET", "POST", "PATCH"]
    }
  });

  setupSocket(io);
  startOrderReportCronJobs();
  startRevenueResetCronJobs();

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start().catch((err) => {
  console.error("Server failed to start", err);
  process.exit(1);
});
