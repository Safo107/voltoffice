/** Simple in-memory rate limiter.
 *  Per Vercel instance – gut genug für Login/2FA Schutz.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

/**
 * @param key      e.g. "login:1.2.3.4" or "2fa:uid123"
 * @param limit    max requests per window
 * @param windowMs window in ms (default 60 000 = 1 min)
 * @returns true if allowed, false if rate-limited
 */
export function rateLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count++;
  return true;
}
