// OMDALA Brand Marketplace — Mock data source
// Phase 1: in-memory fixture data. Phase 2 will replace with API/D1.

import type { BrandPackage, PublicListingDTO } from "@omdala/brand-core";
import { toPublicDTO } from "@omdala/brand-core";

const fixtures: BrandPackage[] = [
  {
    id: "pkg_omcode",
    slug: "omcode",
    name: "OMCode",
    tagline: "AI-native code workspace for the OMDALA ecosystem",
    description: {
      en: "OMCode is an AI-native code workspace brand with domain, codebase, and brand kit.",
      vi: "OMCode là thương hiệu workspace code AI với domain, codebase và brand kit.",
    },
    category: "ai",
    tier: "T2",
    status: "listed",
    assets: [
      { type: "domain", inclusion: "included", verification: "domain_verified" },
      { type: "codebase", inclusion: "included", verification: "codebase_verified" },
      { type: "logo", inclusion: "included", verification: "design_files_available" },
      { type: "trademark", inclusion: "excluded", verification: "unverified" },
    ],
    verificationBadges: ["domain_verified", "codebase_verified", "design_files_available", "trademark_not_included"],
    includedAssets: ["domain", "codebase", "logo", "design_system"],
    excludedAssets: ["trademark", "social_handles"],
    askingPriceUsd: 25000,
    inquiryOnly: true,
    valuationEstimate: {
      rangeLowUsd: 10000,
      rangeHighUsd: 50000,
      confidence: "medium",
      drivers: ["domain", "codebase", "product concept", "global market"],
      risks: ["no revenue proof", "no registered trademark"],
      label: "Strategic estimate, not market appraisal.",
    },
    transferConditions: {
      includes: ["domain transfer", "source code delivery", "brand kit handover", "deployment documentation"],
      doesNotInclude: ["trademark assignment", "existing revenue account", "social media accounts"],
    },
    sellerId: "seller_001",
    createdAt: "2026-06-30T00:00:00Z",
    updatedAt: "2026-07-28T00:00:00Z",
    listedAt: "2026-07-01T00:00:00Z",
  },
  {
    id: "pkg_omdala_docs",
    slug: "omdala-docs",
    name: "OMDALA Docs",
    tagline: "Documentation platform brand for AI ecosystems",
    description: {
      en: "OMDALA Docs is a documentation platform brand with domain and content assets.",
      vi: "OMDALA Docs là thương hiệu nền tảng tài liệu với domain và nội dung.",
    },
    category: "saas",
    tier: "T2",
    status: "listed",
    assets: [
      { type: "domain", inclusion: "included", verification: "domain_verified" },
      { type: "content", inclusion: "included", verification: "unverified" },
      { type: "seo_assets", inclusion: "included", verification: "unverified" },
    ],
    verificationBadges: ["domain_verified", "revenue_not_verified"],
    includedAssets: ["domain", "content", "seo_assets"],
    excludedAssets: ["trademark", "revenue_proof"],
    askingPriceUsd: 3000,
    inquiryOnly: false,
    sellerId: "seller_002",
    createdAt: "2026-07-15T00:00:00Z",
    updatedAt: "2026-07-28T00:00:00Z",
    listedAt: "2026-07-20T00:00:00Z",
  },
  {
    id: "pkg_ai_academy",
    slug: "ai-academy",
    name: "AI Academy",
    tagline: "Education brand for AI learning paths",
    description: {
      en: "AI Academy is an education brand with domain, content, and curriculum.",
      vi: "AI Academy là thương hiệu giáo dục với domain, nội dung và chương trình.",
    },
    category: "education",
    tier: "T1",
    status: "inquiry_open",
    assets: [
      { type: "domain", inclusion: "included", verification: "domain_verified" },
      { type: "content", inclusion: "included", verification: "unverified" },
    ],
    verificationBadges: ["domain_verified", "seller_verified"],
    includedAssets: ["domain", "content"],
    excludedAssets: [],
    inquiryOnly: true,
    sellerId: "seller_003",
    createdAt: "2026-07-10T00:00:00Z",
    updatedAt: "2026-07-28T00:00:00Z",
    listedAt: "2026-07-12T00:00:00Z",
  },
];

export function getListings(): PublicListingDTO[] {
  return fixtures
    .map((pkg) => toPublicDTO(pkg, true))
    .filter((dto): dto is PublicListingDTO => dto !== null);
}

export function getListingBySlug(slug: string): PublicListingDTO | null {
  const pkg = fixtures.find((p) => p.slug === slug);
  if (!pkg) return null;
  return toPublicDTO(pkg, true);
}

export function getListingsByCategory(categoryId: string): PublicListingDTO[] {
  return getListings().filter((dto) => dto.category.id === categoryId);
}
