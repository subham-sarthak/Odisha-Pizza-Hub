import { redis } from "../config/redis.js";

const PRODUCT_KEY = "products:list";

export const getCachedProducts = async () => {
  try {
    const raw = await redis.get(PRODUCT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Cache read failed:", err.message);
    return null;
  }
};

export const setCachedProducts = async (products) => {
  try {
    await redis.set(PRODUCT_KEY, JSON.stringify(products), "EX", 300);
  } catch (err) {
    console.warn("Cache write failed:", err.message);
  }
};

export const invalidateProductCache = async () => {
  try {
    await redis.del(PRODUCT_KEY);
  } catch (err) {
    console.warn("Cache invalidation failed:", err.message);
  }
};
