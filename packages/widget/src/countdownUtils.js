export function getRemainingFixed(endDate) {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);
  return {
    days: Math.floor(diff / (24 * 60 * 60 * 1000)),
    hours: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
    minutes: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
    seconds: Math.floor((diff % (60 * 1000)) / 1000),
    totalMs: diff,
    expired: diff <= 0,
  };
}

export function getRemainingEvergreen(endTimeMs) {
  const now = Date.now();
  const diff = Math.max(0, endTimeMs - now);
  return {
    days: Math.floor(diff / (24 * 60 * 60 * 1000)),
    hours: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
    minutes: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
    seconds: Math.floor((diff % (60 * 1000)) / 1000),
    totalMs: diff,
    expired: diff <= 0,
  };
}

export function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

export const URGENCY_THRESHOLD_MS = 15 * 60 * 1000;

export function isUrgent(totalMs, thresholdMs = URGENCY_THRESHOLD_MS) {
  return typeof totalMs === "number" && totalMs > 0 && totalMs <= thresholdMs;
}
