// OMDALA Brand Core — Type Definitions
// Source of truth for Brand Exchange domain model
// Spec: docs/OMDALA_BRAND_OMDALA_EXCHANGE_SURFACE_SPEC_2026-06-30.md

import type { EntityId, ISODateTimeString, LocalizedTextMap, SupportedLocale } from '@omdala/types';

// ─── Brand Package ────────────────────────────────────────────────────────

export type BrandCategoryId = 'ai' | 'saas' | 'education' | 'infrastructure' | 'marketplace' | 'media' | 'other';

export type ListingTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'listed'
  | 'inquiry_open'
  | 'under_offer'
  | 'transfer_pending'
  | 'transferred'
  | 'paused'
  | 'rejected'
  | 'archived';

export type PublicListingStatus = 'listed' | 'inquiry_open' | 'under_offer';

export type VerificationLevel =
  | 'unverified'
  | 'domain_verified'
  | 'codebase_verified'
  | 'design_files_available'
  | 'trademark_verified'
  | 'revenue_verified'
  | 'seller_verified'
  | 'legal_review_required'
  | 'high_value_manual_deal';

export type VerificationBadge =
  | 'domain_verified'
  | 'codebase_verified'
  | 'design_files_available'
  | 'trademark_not_included'
  | 'trademark_pending'
  | 'trademark_verified'
  | 'revenue_not_verified'
  | 'revenue_verified'
  | 'seller_verified'
  | 'legal_review_required'
  | 'high_value_manual_deal';

export type AssetType =
  | 'domain'
  | 'logo'
  | 'design_system'
  | 'website'
  | 'app'
  | 'codebase'
  | 'content'
  | 'seo_assets'
  | 'documentation'
  | 'social_handles'
  | 'trademark'
  | 'ownership_proof'
  | 'traffic_proof'
  | 'revenue_proof'
  | 'transfer_checklist'
  | 'risk_notes'
  | 'valuation_estimate';

export type AssetInclusion = 'included' | 'excluded' | 'optional';

export interface BrandAsset {
  type: AssetType;
  inclusion: AssetInclusion;
  verification: VerificationLevel;
  notes?: string;
}

export interface BrandPackage {
  id: EntityId;
  slug: string;
  name: string;
  tagline: string;
  description: LocalizedTextMap;
  category: BrandCategoryId;
  tier: ListingTier;
  status: ListingStatus;
  assets: BrandAsset[];
  verificationBadges: VerificationBadge[];
  includedAssets: AssetType[];
  excludedAssets: AssetType[];
  askingPriceUsd?: number;
  inquiryOnly: boolean;
  valuationEstimate?: ValuationEstimate;
  transferConditions?: TransferConditions;
  sellerId: EntityId;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  listedAt?: ISODateTimeString;
}

export interface ValuationEstimate {
  rangeLowUsd: number;
  rangeHighUsd: number;
  confidence: 'low' | 'medium' | 'high';
  drivers: string[];
  risks: string[];
  label: string;
}

export interface TransferConditions {
  includes: string[];
  doesNotInclude: string[];
}

// ─── Inquiry / Offer ──────────────────────────────────────────────────────

export type InquiryType = 'request_info' | 'make_inquiry' | 'submit_offer' | 'request_proof_access' | 'open_deal_room';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' | 'countered';

export interface BrandInquiry {
  id: EntityId;
  brandPackageId: EntityId;
  buyerId: EntityId;
  type: InquiryType;
  message?: string;
  offerAmountUsd?: number;
  status: OfferStatus;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  expiresAt?: ISODateTimeString;
}

// ─── Category ──────────────────────────────────────────────────────────────

export interface BrandCategory {
  id: BrandCategoryId;
  slug: string;
  name: string;
  description: LocalizedTextMap;
  icon?: string;
}

// ─── Public Listing (DTO for marketplace surface) ───────────────────────────

export interface PublicListingDTO {
  id: EntityId;
  slug: string;
  name: string;
  tagline: string;
  description: LocalizedTextMap;
  category: BrandCategory;
  tier: ListingTier;
  status: PublicListingStatus;
  verificationBadges: VerificationBadge[];
  assets: BrandAsset[];
  includedAssets: AssetType[];
  excludedAssets: AssetType[];
  askingPriceUsd?: number;
  inquiryOnly: boolean;
  valuationEstimate?: ValuationEstimate;
  transferConditions?: TransferConditions;
  sellerVerified: boolean;
  listedAt: ISODateTimeString;
}

// ─── Marketplace Routes ────────────────────────────────────────────────────

export interface BrandRouteParams {
  locale: SupportedLocale;
  slug?: string;
  category?: BrandCategoryId;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const BRAND_CATEGORIES: readonly BrandCategory[] = [
  { id: 'ai', slug: 'ai', name: 'AI', description: { en: 'AI-powered brands', vi: 'Thương hiệu AI' } },
  { id: 'saas', slug: 'saas', name: 'SaaS', description: { en: 'Software-as-a-Service brands', vi: 'Thương hiệu SaaS' } },
  { id: 'education', slug: 'education', name: 'Education', description: { en: 'Education brands', vi: 'Thương hiệu giáo dục' } },
  { id: 'infrastructure', slug: 'infrastructure', name: 'Infrastructure', description: { en: 'Infrastructure brands', vi: 'Thương hiệu hạ tầng' } },
  { id: 'marketplace', slug: 'marketplace', name: 'Marketplace', description: { en: 'Marketplace brands', vi: 'Thương hiệu sàn giao dịch' } },
  { id: 'media', slug: 'media', name: 'Media', description: { en: 'Media brands', vi: 'Thương hiệu truyền thông' } },
  { id: 'other', slug: 'other', name: 'Other', description: { en: 'Other brands', vi: 'Thương hiệu khác' } },
] as const;

export const NO_BUY_NOW_THRESHOLD_USD = 5000;

export const PUBLIC_LISTING_STATUSES: readonly PublicListingStatus[] = [
  'listed',
  'inquiry_open',
  'under_offer',
] as const;

export const INQUIRY_TYPES: readonly InquiryType[] = [
  'request_info',
  'make_inquiry',
  'submit_offer',
  'request_proof_access',
  'open_deal_room',
] as const;

// ─── Guards ─────────────────────────────────────────────────────────────────

export function isPublicStatus(status: ListingStatus): status is PublicListingStatus {
  return (PUBLIC_LISTING_STATUSES as readonly string[]).includes(status);
}

export function isBuyNowAllowed(askingPriceUsd: number | undefined): boolean {
  if (askingPriceUsd === undefined) return false;
  return askingPriceUsd < NO_BUY_NOW_THRESHOLD_USD;
}

export function toPublicDTO(pkg: BrandPackage, sellerVerified: boolean): PublicListingDTO | null {
  if (!isPublicStatus(pkg.status)) return null;
  const category = BRAND_CATEGORIES.find((c) => c.id === pkg.category);
  if (!category) return null;
  return {
    id: pkg.id,
    slug: pkg.slug,
    name: pkg.name,
    tagline: pkg.tagline,
    description: pkg.description,
    category,
    tier: pkg.tier,
    status: pkg.status,
    verificationBadges: pkg.verificationBadges,
    assets: pkg.assets,
    includedAssets: pkg.includedAssets,
    excludedAssets: pkg.excludedAssets,
    askingPriceUsd: pkg.askingPriceUsd,
    inquiryOnly: pkg.inquiryOnly,
    valuationEstimate: pkg.valuationEstimate,
    transferConditions: pkg.transferConditions,
    sellerVerified,
    listedAt: pkg.listedAt ?? pkg.updatedAt,
  };
}
