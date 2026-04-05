import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deployed to Cloudflare Pages via @cloudflare/next-on-pages adapter
  // which supports dynamic routes (no static export needed).
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
