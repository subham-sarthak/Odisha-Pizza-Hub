import Redis from "ioredis";
import { env } from "./env.js";

const redisDisabled = env.nodeEnv === "development" && !env.redisEnabled;

let redisClient;
if (redisDisabled) {
  redisClient = {
    get: async () => null,
    set: async () => {},
    del: async () => {}
  };
} else {
  redisClient = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy: () => null // Don't retry if connection fails initially
  });

  redisClient.on("connect", () => console.log("✅ Redis connected"));
  redisClient.on("error", (err) => {
    console.warn("⚠️  Redis error:", err.message);
    console.warn("⚠️  Continuing without Redis cache. Features will work but may be slower.");
  });

  // Try to connect, but don't crash if it fails
  redisClient.connect().catch(() => {
    console.warn("⚠️  Redis not available. Running without cache.");
  });
}

export const redis = redisClient;
