import QRCode from "qrcode";
import { asyncHandler } from "../utils/apiError.js";
import { sendResponse } from "../utils/response.js";
import { env } from "../config/env.js";

export const orderQr = asyncHandler(async (req, res) => {
  const table = req.query.table || "T1";
  const link = `${env.frontendUrl}/menu?table=${encodeURIComponent(table)}`;
  const qrDataUrl = await QRCode.toDataURL(link);
  sendResponse(res, 200, "QR generated", { table, link, qrDataUrl });
});
