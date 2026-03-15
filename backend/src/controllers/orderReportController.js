import fs from "fs";
import path from "path";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { getOrderReportsDir } from "../utils/pdfGenerator.js";
import { sendResponse } from "../utils/response.js";

const safeDateFromFileName = (fileName) => {
  const match = String(fileName || "").match(/^orders-(\d{4})-(\d{2})-(\d{2})\.pdf$/i);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const listOrderReports = asyncHandler(async (req, res) => {
  const reportsDir = await getOrderReportsDir();
  const retention = String(req.query.retention || "all").toLowerCase();

  const files = await fs.promises.readdir(reportsDir);
  const onlyPdf = files.filter((fileName) => fileName.toLowerCase().endsWith(".pdf"));

  const now = Date.now();
  const retentionMap = {
    "7": 7,
    "30": 30,
    "365": 365,
    all: null
  };
  const retentionDays = Object.prototype.hasOwnProperty.call(retentionMap, retention)
    ? retentionMap[retention]
    : null;

  const reports = await Promise.all(
    onlyPdf.map(async (fileName) => {
      const absolutePath = path.join(reportsDir, fileName);
      const stats = await fs.promises.stat(absolutePath);
      const reportDate = safeDateFromFileName(fileName) || stats.mtime;

      return {
        fileName,
        reportDate,
        sizeInBytes: stats.size,
        downloadUrl: `/api/order-reports/${encodeURIComponent(fileName)}`,
        viewUrl: `/api/order-reports/${encodeURIComponent(fileName)}?inline=true`
      };
    })
  );

  const filtered = reports
    .filter((item) => {
      if (!retentionDays) return true;
      const diffInDays = (now - new Date(item.reportDate).getTime()) / (24 * 60 * 60 * 1000);
      return diffInDays <= retentionDays;
    })
    .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());

  sendResponse(res, 200, "Order reports", filtered);
});

export const getOrderReportFile = asyncHandler(async (req, res) => {
  const reportsDir = await getOrderReportsDir();
  const requestedFile = path.basename(String(req.params.file || ""));

  if (!requestedFile.toLowerCase().endsWith(".pdf")) {
    throw new ApiError(400, "Only PDF report files are allowed");
  }

  const filePath = path.join(reportsDir, requestedFile);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "Report file not found");
  }

  const inline = String(req.query.inline || "false").toLowerCase() === "true";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${inline ? "inline" : "attachment"}; filename=\"${requestedFile}\"`
  );

  return res.sendFile(filePath);
});
