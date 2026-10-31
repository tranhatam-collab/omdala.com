import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  poweredByHeader: false,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  // Keep tracing inside this monorepo rather than an unrelated parent lockfile.
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // /en and /vi are separate root layouts, so unknown URLs need a self-contained 404.
    globalNotFound: true,
  },
  transpilePackages: ["@omdala/brand-core", "@omdala/core", "@omdala/types", "@omdala/ui"],
};

export default config;
