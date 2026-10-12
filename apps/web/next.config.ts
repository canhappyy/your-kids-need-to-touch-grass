import type { NextConfig } from "next";

/**
* Next.js application configuration.
* Enforces global HTTP security headers following OWASP recommendations.
*/
const nextConfig: NextConfig = {
  // Enforce maximum request body size (1MB default, prevents large payload DoS attacks)
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },

  async headers() {
    return [
      {
        // Apply security headers across all application routes
        source: "/(.*)",
        headers: [
          // Remove Server header to prevent infrastructure disclosure
          {
            key: "Server",
            value: "",
          },
          // Enforces HTTPS for 2 years, including subdomains (HSTS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Anti-clickjacking (modern): forbids any domain from embedding this app in an iframe
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
          // Anti-clickjacking (legacy): fallback for older browsers
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevents MIME-type sniffing (forces browsers to respect declared Content-Type)
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Protects against XSS attacks in older browsers
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Prevents cross-domain policy file loading from Flash/Silverlight
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          // Protects privacy by not leaking URL parameters to external sites
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Restricts browser hardware access (disables camera and microphone)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
