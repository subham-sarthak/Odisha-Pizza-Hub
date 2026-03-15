import { ApiError } from "../utils/apiError.js";

export const roleMiddleware = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  next();
};
