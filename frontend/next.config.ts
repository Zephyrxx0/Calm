import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rewrites are only needed for local development.
  // On Vercel, the experimental Services feature routes /api/* to FastAPI directly.
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const BACKEND_URL = process.env.DAILY_API_URL || "http://localhost:8001";
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
