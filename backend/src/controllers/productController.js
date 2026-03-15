import Product from "../models/Product.js";
import {
    getCachedProducts,
    invalidateProductCache,
    setCachedProducts
} from "../services/cacheService.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { sendResponse } from "../utils/response.js";

export const listProducts = asyncHandler(async (req, res) => {
  const { category, type, search } = req.query;

  const canUseCache = !category && !type && !search;
  if (canUseCache) {
    const cached = await getCachedProducts();
    if (cached) return sendResponse(res, 200, "Products", cached);
  }

  const filter = { isAvailable: true, stock: { $gt: 0 } };
  
  // Case-insensitive category matching
  if (category) {
    filter.category = { $regex: `^${category.trim()}$`, $options: "i" };
  }
  
  if (type) filter.type = type;
  if (search) filter.name = { $regex: search, $options: "i" };

  console.log("Product filter:", filter); // DEBUG LOG
  
  const products = await Product.find(filter).sort({ category: 1, name: 1 });
  
  console.log(`Found ${products.length} products for category: ${category}`); // DEBUG LOG
  
  if (canUseCache) await setCachedProducts(products);
  sendResponse(res, 200, "Products", products);
});

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Product.distinct("category", { isAvailable: true });
  sendResponse(res, 200, "Categories", categories.sort());
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  await invalidateProductCache();
  sendResponse(res, 201, "Product created", product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) throw new ApiError(404, "Product not found");
  await invalidateProductCache();
  sendResponse(res, 200, "Product updated", product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  await invalidateProductCache();
  sendResponse(res, 200, "Product deleted", product);
});
