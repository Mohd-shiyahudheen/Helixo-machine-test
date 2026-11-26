import { redisClient } from "../config/redis.js";

const TTL_SECONDS = 60;
const KEY_PREFIX = "timer:";
const VERSION_PREFIX = "timer_ver:";

export function cacheKey(shopDomain, productId, collectionIds = []) {
  const shop = shopDomain.replace(/\.myshopify\.com$/, "");
  const base = `${KEY_PREFIX}${shop}:${productId}`;
  if (Array.isArray(collectionIds) && collectionIds.length > 0) {
    const normalized = [...collectionIds].map(String).sort().join(",");
    return `${base}:c=${normalized}`;
  }
  return base;
}

async function getShopVersion(shopDomain) {
  try {
    const shop = shopDomain.replace(/\.myshopify\.com$/, "");
    const ver = await redisClient.get(`${VERSION_PREFIX}${shop}`);
    return ver || "0";
  } catch {
    return "0";
  }
}

export async function invalidateShopCache(shopDomain) {
  try {
    const shop = shopDomain.replace(/\.myshopify\.com$/, "");
    await redisClient.incr(`${VERSION_PREFIX}${shop}`);
  } catch {
    // Ignore cache invalidation errors if Redis is unavailable
  }
}

export async function getCachedTimer(shopDomain, productId, collectionIds = []) {
  const ver = await getShopVersion(shopDomain);
  const key = `${cacheKey(shopDomain, productId, collectionIds)}:v${ver}`;
  const raw = await redisClient.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setCachedTimer(shopDomain, productId, data, collectionIds = []) {
  const ver = await getShopVersion(shopDomain);
  const key = `${cacheKey(shopDomain, productId, collectionIds)}:v${ver}`;
  await redisClient.setex(key, TTL_SECONDS, JSON.stringify(data));
}
