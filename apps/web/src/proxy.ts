import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultRateLimiter, getClientIp } from "@/lib/rate-limit";

/**
 * Next.js Proxy Middleware for application-level rate limiting.
 *
 * Enforces a sliding-window rate limit (50 requests per minute per IP address).
 * Intercepts incoming requests before they reach Next.js pages or API route handlers:
 * - Injects standard `X-RateLimit-*` headers into every response.
 * - If the limit is exceeded, returns an HTTP 429 (Too Many Requests) response with a `Retry-After` header.
 *   - API requests (`/api/*` or `Accept: application/json`) receive a structured JSON payload.
 *   - Document/page navigations receive a user-facing HTML error page.
 *
 * @param request - The incoming Next.js request object.
 * @returns A {@link NextResponse} either allowing the request through or returning a 429 status.
 */
export function proxy(request: NextRequest) {
  // 1. Resolve client IP from proxy headers (x-forwarded-for, x-real-ip, etc.)
  const ip = getClientIp(request.headers);

  // 2. Check request quota against sliding window rate limiter
  const result = defaultRateLimiter.check(ip);

  // 3. Prepare standard rate limiting response headers
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000),
  );
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", Math.ceil(result.reset / 1000).toString());

  // 4. If quota exceeded, reject with 429 Too Many Requests
  if (!result.success) {
    headers.set("Retry-After", retryAfterSeconds.toString());

    const isApiRequest =
      request.nextUrl.pathname.startsWith("/api") ||
      request.headers.get("accept")?.includes("application/json");

    // Return structured JSON for API consumers
    if (isApiRequest) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message:
            "Rate limit exceeded (50 requests per minute). Please try again shortly.",
        },
        {
          status: 429,
          headers,
        },
      );
    }

    // Return friendly HTML page for browser navigations
    return new NextResponse(
      '<!DOCTYPE html><html><head><title>Too Many Requests</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>429 - Too Many Requests</h1><p>You have exceeded the rate limit (50 requests per minute). Please wait a moment and try again.</p></body></html>',
      {
        status: 429,
        headers: {
          ...Object.fromEntries(headers.entries()),
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  }

  // 5. Allow request to proceed and attach rate limit headers to the response
  const response = NextResponse.next();
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Middleware route matching configuration.
 *
 * Rate limiting is applied to all application routes and API endpoints, while explicitly
 * skipping internal Next.js assets and static files to avoid consuming request quota
 * on asset bundles, fonts, or images.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static chunks and bundles)
     * - _next/image (image optimization API)
     * - favicon.ico (browser favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
