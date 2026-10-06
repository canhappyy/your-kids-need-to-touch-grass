import { describe, it, expect, beforeEach } from "vitest";
import { SlidingWindowRateLimiter, getClientIp } from "./rate-limit";

describe("SlidingWindowRateLimiter", () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter({ limit: 50, windowMs: 60_000 });
  });

  it("permits up to 50 requests within 1 minute", () => {
    const ip = "192.168.1.1";
    const baseTime = 1_000_000;

    for (let i = 1; i <= 50; i++) {
      const result = limiter.check(ip, baseTime + i * 100);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(50);
      expect(result.remaining).toBe(50 - i);
    }
  });

  it("blocks the 51st request within the same 1-minute window", () => {
    const ip = "192.168.1.1";
    const baseTime = 1_000_000;

    for (let i = 1; i <= 50; i++) {
      limiter.check(ip, baseTime + i * 100);
    }

    const blocked = limiter.check(ip, baseTime + 50 * 100 + 10);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.limit).toBe(50);
    // Reset should be windowMs after first request
    expect(blocked.reset).toBe(baseTime + 100 + 60_000);
  });

  it("allows new requests after the 1-minute window has passed", () => {
    const ip = "192.168.1.1";
    const baseTime = 1_000_000;

    for (let i = 1; i <= 50; i++) {
      limiter.check(ip, baseTime + i * 100);
    }

    // Blocked before window ends
    expect(limiter.check(ip, baseTime + 59_000).success).toBe(false);

    // Allowed after first request falls outside the 60s sliding window
    const afterWindow = baseTime + 100 + 60_001;
    const allowed = limiter.check(ip, afterWindow);
    expect(allowed.success).toBe(true);
  });

  it("tracks rate limits independently for different IP addresses", () => {
    const ip1 = "10.0.0.1";
    const ip2 = "10.0.0.2";
    const baseTime = 1_000_000;

    for (let i = 0; i < 50; i++) {
      limiter.check(ip1, baseTime + i);
    }

    // ip1 is exhausted
    expect(limiter.check(ip1, baseTime + 60).success).toBe(false);

    // ip2 still has full quota
    const ip2Result = limiter.check(ip2, baseTime + 60);
    expect(ip2Result.success).toBe(true);
    expect(ip2Result.remaining).toBe(49);
  });

  it("cleans up expired IP entries when pruned", () => {
    const ip = "1.2.3.4";
    const baseTime = 1_000_000;

    limiter.check(ip, baseTime);
    expect(limiter.check(ip, baseTime).remaining).toBe(48);

    // Prune 70 seconds later
    limiter.prune(baseTime + 70_000);

    // Store should have evicted the key, starting fresh with 49 remaining
    const fresh = limiter.check(ip, baseTime + 70_000);
    expect(fresh.success).toBe(true);
    expect(fresh.remaining).toBe(49);
  });
});

describe("getClientIp", () => {
  it("extracts the first IP from comma-separated x-forwarded-for header", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
    });
    expect(getClientIp(headers)).toBe("203.0.113.195");
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.42",
    });
    expect(getClientIp(headers)).toBe("198.51.100.42");
  });

  it("falls back to cf-connecting-ip when other headers are missing", () => {
    const headers = new Headers({
      "cf-connecting-ip": "198.51.100.99",
    });
    expect(getClientIp(headers)).toBe("198.51.100.99");
  });

  it("defaults to 127.0.0.1 when no headers are present", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("127.0.0.1");
  });
});
