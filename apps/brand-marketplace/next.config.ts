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
  transpilePackages: ["@omdala/brand-core", "@omdala/core", "@omdala/types", "@omdala/ui"],
};

export default config;
