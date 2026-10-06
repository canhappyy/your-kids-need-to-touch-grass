import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { defaultRateLimiter } from "./lib/rate-limit";

describe("Application Proxy Rate Limiting", () => {
  beforeEach(() => {
    defaultRateLimiter.reset();
  });

  it("adds rate limit headers on allowed requests", () => {
    const request = new NextRequest("http://localhost:3000/api/health", {
      headers: {
        "x-forwarded-for": "198.51.100.1",
      },
    });

    const response = proxy(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("50");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("49");
    expect(response.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("returns 429 JSON for API requests when rate limit is exceeded", async () => {
    const ip = "198.51.100.2";

    // Consume all 50 requests
    for (let i = 0; i < 50; i++) {
      const req = new NextRequest("http://localhost:3000/api/health", {
        headers: { "x-forwarded-for": ip },
      });
      proxy(req);
    }

    // 51st request
    const blockedRequest = new NextRequest("http://localhost:3000/api/health", {
      headers: { "x-forwarded-for": ip },
    });
    const blockedResponse = proxy(blockedRequest);

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(blockedResponse.headers.get("Retry-After")).toBeTruthy();

    const body = await blockedResponse.json();
    expect(body.error).toBe("Too Many Requests");
  });

  it("returns 429 HTML for page visits when rate limit is exceeded", async () => {
    const ip = "198.51.100.3";

    for (let i = 0; i < 50; i++) {
      const req = new NextRequest("http://localhost:3000/dashboard", {
        headers: { "x-forwarded-for": ip },
      });
      proxy(req);
    }

    const blockedRequest = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        "x-forwarded-for": ip,
        accept: "text/html",
      },
    });
    const blockedResponse = proxy(blockedRequest);

    expect(blockedResponse.status).toBe(429);
    const body = await blockedResponse.text();
    expect(body).toContain("Too Many Requests");
  });
});
