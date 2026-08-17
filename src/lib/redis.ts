import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis };

function createRedis() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const r = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
  r.on("error", () => {
    // Không crash app khi Redis chết — caller fallback sang chế độ không cache.
  });
  return r;
}

export const redis = globalForRedis.redis || createRedis();
if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
