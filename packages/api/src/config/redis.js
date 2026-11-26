let redisClient;

if (process.env.NODE_ENV === "test") {
  redisClient = {
    get: () => Promise.resolve(null),
    setex: () => Promise.resolve("OK"),
    ping: () => Promise.resolve("PONG"),
  };
} else {
  const Redis = (await import("ioredis")).default;
  const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
  redisClient = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });
  redisClient.on("error", (err) => console.error("Redis error:", err));
}

export { redisClient };
