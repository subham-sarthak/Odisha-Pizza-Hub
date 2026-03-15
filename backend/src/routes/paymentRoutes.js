import { Router } from "express";
import { createRazorpayOrder, razorpayWebhook } from "../controllers/paymentController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/razorpay/create-order", auth, createRazorpayOrder);
router.post("/razorpay/webhook", razorpayWebhook);

export default router;
