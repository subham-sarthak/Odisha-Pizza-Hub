import { Router } from "express";
import { customerDetails, dashboardCounts, deleteUser, peakHourHeatmap, revenueSummary } from "../controllers/adminController.js";
import { auth, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/revenue", auth, authorize("admin"), revenueSummary);
router.get("/peak-hours", auth, authorize("admin"), peakHourHeatmap);
router.get("/counts", auth, authorize("admin"), dashboardCounts);
router.get("/users", auth, authorize("admin"), customerDetails);
router.delete("/users/:id", auth, authorize("admin"), deleteUser);

export default router;
