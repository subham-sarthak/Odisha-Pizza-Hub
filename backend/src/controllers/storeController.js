import StoreStatus from "../models/StoreStatus.js";
import { emitStoreStatusUpdated } from "../sockets/index.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { sendResponse } from "../utils/response.js";

const getOrCreateStoreStatus = async () =>
  StoreStatus.findOneAndUpdate(
    { key: "primary" },
    { $setOnInsert: { key: "primary", isOpen: true } },
    { new: true, upsert: true }
  );

export const getStoreStatus = asyncHandler(async (_req, res) => {
  const status = await getOrCreateStoreStatus();
  sendResponse(res, 200, "Store status fetched", status);
});

export const updateStoreStatus = asyncHandler(async (req, res) => {
  const { isOpen } = req.body;

  if (typeof isOpen !== "boolean") {
    throw new ApiError(400, "isOpen must be a boolean");
  }

  const status = await StoreStatus.findOneAndUpdate(
    { key: "primary" },
    { $set: { isOpen } },
    { new: true, upsert: true }
  );

  emitStoreStatusUpdated(status);
  sendResponse(res, 200, "Store status updated", status);
});
