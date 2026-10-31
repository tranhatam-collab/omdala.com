import type { MetadataRoute } from "next";
import { MARKETPLACE_ORIGIN } from "@/lib/locale";
import { allowIndexing } from "@/lib/seo";

export const dynamic = "force-static";

// The only robots source. It follows the same rule as the page-level robots meta: crawlable only
// in a production release that has not been marked noindex.
export default function robots(): MetadataRoute.Robots {
  return allowIndexing
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${MARKETPLACE_ORIGIN}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
