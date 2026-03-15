import Offer from "../models/Offer.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { sendResponse } from "../utils/response.js";

export const listOffers = asyncHandler(async (_req, res) => {
  const now = new Date();
  const offers = await Offer.find({ isActive: true, validFrom: { $lte: now }, validTill: { $gte: now } });
  sendResponse(res, 200, "Offers", offers);
});

export const createOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.create(req.body);
  sendResponse(res, 201, "Offer created", offer);
});

export const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!offer) throw new ApiError(404, "Offer not found");
  sendResponse(res, 200, "Offer updated", offer);
});
