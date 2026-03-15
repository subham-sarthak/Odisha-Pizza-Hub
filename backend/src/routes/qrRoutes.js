import { Router } from "express";
import { orderQr } from "../controllers/qrController.js";

const router = Router();

router.get("/order-link", orderQr);

export default router;
