import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: process.env.OMDALA_NOINDEX
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/" },
  };
}
