import { Router } from "express";
import {
  applyCoupon,
  createCoupon,
  listCoupons,
  listPublicCoupons,
  updateCoupon
} from "../controllers/couponController.js";
import { auth, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/public", listPublicCoupons);
router.post("/apply", auth, applyCoupon);
router.get("/", auth, authorize("admin"), listCoupons);
router.post("/", auth, authorize("admin"), createCoupon);
router.put("/:id", auth, authorize("admin"), updateCoupon);

export default router;
