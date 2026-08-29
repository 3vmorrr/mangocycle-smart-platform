/**
 * In-Memory IoT Ingestion Rate Limiter
 * 
 * Enforces canonical 60 requests/minute/device per 24-API-SPECIFICATION.md §9.1 & 22-IOT-ARCHITECTURE.md §5.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const deviceRateLimits = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

/**
 * Checks and increments the rate limit counter for a device.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds: number }.
 */
export function checkDeviceRateLimit(deviceCode: string): {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  let record = deviceRateLimits.get(deviceCode);

  if (!record || now > record.resetAt) {
    record = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    deviceRateLimits.set(deviceCode, record);
    return {
      allowed: true,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
    };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
  };
}

/**
 * Periodically purge stale records to prevent memory growth.
 */
export function cleanupStaleRateLimits(): void {
  const now = Date.now();
  deviceRateLimits.forEach((record, key) => {
    if (now > record.resetAt) {
      deviceRateLimits.delete(key);
    }
  });
}
