/**
 * Configuration options for the sliding window rate limiter.
 */
export interface RateLimitOptions {
  /** Maximum number of requests allowed in the given time window. */
  limit: number;
  /** Window duration in milliseconds (e.g. 60_000 for 1 minute). */
  windowMs: number;
}

/**
 * Result returned from evaluating a rate limit check.
 */
export interface RateLimitResult {
  /** Whether the request is permitted within the quota. */
  success: boolean;
  /** The configured maximum request limit. */
  limit: number;
  /** Number of remaining requests permitted in the current window. */
  remaining: number;
  /** Timestamp in milliseconds when the oldest recorded request in the window expires. */
  reset: number;
}

/**
 * In-memory sliding window rate limiter.
 *
 * Tracks individual request timestamps per client key (e.g. client IP address).
 * Unlike a fixed-window counter, the sliding window prevents traffic bursts at the boundary
 * of window transitions by filtering timestamps against `(now - windowMs)`.
 *
 * @example
 * ```ts
 * const limiter = new SlidingWindowRateLimiter({ limit: 50, windowMs: 60_000 });
 * const result = limiter.check("192.168.1.1");
 * if (!result.success) {
 *   // reject with 429
 * }
 * ```
 */
export class SlidingWindowRateLimiter {
  private readonly store = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;
  private lastPrune: number = Date.now();

  /**
   * Creates a new instance of the sliding window rate limiter.
   *
   * @param options - Configuration specifying limit and window duration. Defaults to 50 req / 60s.
   */
  constructor(options: RateLimitOptions = { limit: 50, windowMs: 60_000 }) {
    this.limit = options.limit;
    this.windowMs = options.windowMs;
  }

  /**
   * Checks whether a request with the given identifier is allowed under the rate limit.
   *
   * @param key - Unique client identifier (e.g. IP address or API token).
   * @param now - Current timestamp in milliseconds. Defaults to `Date.now()`.
   * @returns A {@link RateLimitResult} indicating success, remaining count, and reset time.
   */
  public check(key: string, now = Date.now()): RateLimitResult {
    // Run periodic pruning to prevent unbounded Map memory growth
    this.autoPrune(now);

    const windowStart = now - this.windowMs;
    const timestamps = this.store.get(key) ?? [];

    // Retain only timestamps that fall within the current sliding window
    const recent = timestamps.filter((t) => t > windowStart);

    // If quota reached, do not record this request and return failure
    if (recent.length >= this.limit) {
      const reset = (recent[0] ?? now) + this.windowMs;
      this.store.set(key, recent);
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset,
      };
    }

    // Record the current timestamp and update the store
    recent.push(now);
    this.store.set(key, recent);

    const reset = recent[0] + this.windowMs;
    return {
      success: true,
      limit: this.limit,
      remaining: Math.max(0, this.limit - recent.length),
      reset,
    };
  }

  /**
   * Resets the entire in-memory store.
   * Useful for testing environments between test cases.
   */
  public reset(): void {
    this.store.clear();
    this.lastPrune = Date.now();
  }

  /**
   * Prunes entries where all recorded timestamps have expired outside the sliding window.
   *
   * @param now - Current timestamp in milliseconds. Defaults to `Date.now()`.
   */
  public prune(now = Date.now()): void {
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.store.entries()) {
      const valid = timestamps.filter((t) => t > windowStart);
      if (valid.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, valid);
      }
    }
    this.lastPrune = now;
  }

  /**
   * Periodically prunes stale entries to prevent memory leaks in long-running processes.
   *
   * Triggers if more than 5 minutes have elapsed since the last prune or if the store size exceeds 5,000 keys.
   *
   * @param now - Current timestamp in milliseconds.
   */
  private autoPrune(now: number): void {
    if (now - this.lastPrune > 300_000 || this.store.size > 5_000) {
      this.prune(now);
    }
  }
}

/**
 * Extracts the client IP address from incoming HTTP request headers.
 *
 * Supports common reverse proxies and CDNs (Vercel, AWS CloudFront, Cloudflare, Nginx):
 * 1. `x-forwarded-for`: Extracts the first (client) IP in multi-proxy chains.
 * 2. `x-real-ip`: Injected by Nginx and standard reverse proxies.
 * 3. `cf-connecting-ip`: Injected by Cloudflare.
 * 4. Fallback: Returns `"127.0.0.1"` if no proxy headers are found (e.g. local direct requests).
 *
 * @param headers - Web standard {@link Headers} object from the incoming request.
 * @returns The resolved client IP string.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Global declaration for persistent rate limiter instance across Turbopack/HMR reloads.
 */
const globalForRateLimit = globalThis as unknown as {
  rateLimiter?: SlidingWindowRateLimiter;
};

/**
 * Default application-wide singleton rate limiter:
 * Configured for 50 requests per 60 seconds (1 minute).
 * Attached to globalThis to persist in-memory request counts across development reloads.
 */
export const defaultRateLimiter =
  globalForRateLimit.rateLimiter ??
  (globalForRateLimit.rateLimiter = new SlidingWindowRateLimiter({
    limit: 50,
    windowMs: 60_000,
  }));
