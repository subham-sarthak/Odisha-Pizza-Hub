import { Router } from "express";
import {
    createOrder,
    downloadOrderArchive,
    exportFullHistoryOrdersPdf,
    exportOrdersPdf,
    listOrderArchives,
    listOrders,
    listRefunds,
    myOrders,
    processRefund,
    requestRefund,
    updateOrderStatus
} from "../controllers/orderController.js";
import { auth, authorize } from "../middleware/auth.js";

const router = Router();

router.post("/", auth, createOrder);
router.get("/mine", auth, myOrders);
router.get("/", auth, authorize("admin"), listOrders);
router.get("/export/pdf", auth, authorize("admin"), exportOrdersPdf);
router.get("/export/pdf/full-history", auth, authorize("admin"), exportFullHistoryOrdersPdf);
router.get("/archives", auth, authorize("admin"), listOrderArchives);
router.get("/archives/:id/download", auth, authorize("admin"), downloadOrderArchive);
router.patch("/:id/status", auth, authorize("admin"), updateOrderStatus);

// Refund management
router.post("/:id/refund", auth, requestRefund);
router.patch("/:id/refund", auth, authorize("admin"), processRefund);
router.get("/refunds/list", auth, authorize("admin"), listRefunds);

export default router;
