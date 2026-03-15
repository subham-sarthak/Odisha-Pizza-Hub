import { Router } from "express";
import { createOffer, listOffers, updateOffer } from "../controllers/offerController.js";
import { auth, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", listOffers);
router.post("/", auth, authorize("admin"), createOffer);
router.put("/:id", auth, authorize("admin"), updateOffer);

export default router;
