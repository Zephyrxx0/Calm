import type { NextConfig } from "next";

const BACKEND_URL = process.env.DAILY_API_URL || "http://localhost:8001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // ── Daily tracking API ───────────────────────────────────────────
      // All /api/daily/** requests are transparently forwarded to the
      // Python FastAPI backend. No individual route.ts files needed.
      {
        source: "/api/daily/:path*",
        destination: `${BACKEND_URL}/api/daily/:path*`,
      },

      // ── Edition API ──────────────────────────────────────────────────
      {
        source: "/api/edition/:path*",
        destination: `${BACKEND_URL}/api/edition/:path*`,
      },
    ];
  },
};

export default nextConfig;
