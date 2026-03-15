import User from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { verifyAccessToken } from "../utils/generateToken.js";

export const authMiddleware = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next(new ApiError(401, "Authentication required"));
    }

    const accessToken = authHeader.split(" ")[1];
    const payload = verifyAccessToken(accessToken);
    const user = await User.findById(payload.userId).select("-password -refreshTokens -emailVerificationToken -passwordResetToken -otpCode");

    if (!user) {
      return next(new ApiError(401, "User not found"));
    }

    req.user = user;
    req.auth = payload;
    next();
  } catch (_error) {
    next(new ApiError(401, "Invalid or expired access token"));
  }
};
