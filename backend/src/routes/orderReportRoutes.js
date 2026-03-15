import { Router } from "express";
import { getOrderReportFile, listOrderReports } from "../controllers/orderReportController.js";
import { auth, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", auth, authorize("admin"), listOrderReports);
router.get("/:file", auth, authorize("admin"), getOrderReportFile);

export default router;
