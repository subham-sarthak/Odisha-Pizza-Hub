import { Router } from "express";
import { getStoreStatus, updateStoreStatus } from "../controllers/storeController.js";
import { auth, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/status", getStoreStatus);
router.patch("/status", auth, authorize("admin"), updateStoreStatus);

export default router;
