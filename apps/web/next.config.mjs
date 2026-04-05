import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "..", "..");

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    "@omdala/ui",
    "@omdala/seo",
    "@omdala/types",
    "@omdala/core",
  ],
};

export default config;
