import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  listCategories,
  listProducts,
  updateProduct
} from "../controllers/productController.js";
import { auth, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", listProducts);
router.get("/categories", listCategories);
router.post("/", auth, authorize("admin"), createProduct);
router.put("/:id", auth, authorize("admin"), updateProduct);
router.delete("/:id", auth, authorize("admin"), deleteProduct);

export default router;
