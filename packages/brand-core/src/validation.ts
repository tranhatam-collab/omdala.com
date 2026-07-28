// OMDALA Brand Core — Validation
// Zod-free; uses plain guards per monorepo convention (no extra dep)

import type {
  BrandCategoryId,
  BrandPackage,
  InquiryType,
  ListingStatus,
  ListingTier,
  VerificationBadge,
} from './types';
import {
  BRAND_CATEGORIES,
  INQUIRY_TYPES,
  NO_BUY_NOW_THRESHOLD_USD,
} from './types';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_TIERS: readonly ListingTier[] = ['T1', 'T2', 'T3', 'T4', 'T5'];
const VALID_STATUSES: readonly ListingStatus[] = [
  'draft', 'pending_review', 'approved', 'listed', 'inquiry_open',
  'under_offer', 'transfer_pending', 'transferred', 'paused', 'rejected', 'archived',
];
const VALID_BADGES: readonly VerificationBadge[] = [
  'domain_verified', 'codebase_verified', 'design_files_available',
  'trademark_not_included', 'trademark_pending', 'trademark_verified',
  'revenue_not_verified', 'revenue_verified', 'seller_verified',
  'legal_review_required', 'high_value_manual_deal',
];

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug) && slug.length >= 2 && slug.length <= 80;
}

export function validateCategory(category: string): category is BrandCategoryId {
  return BRAND_CATEGORIES.some((c) => c.id === category);
}

export function validateTier(tier: string): tier is ListingTier {
  return (VALID_TIERS as readonly string[]).includes(tier);
}

export function validateStatus(status: string): status is ListingStatus {
  return (VALID_STATUSES as readonly string[]).includes(status);
}

export function validateInquiryType(type: string): type is InquiryType {
  return (INQUIRY_TYPES as readonly string[]).includes(type);
}

export function validateBadges(badges: unknown[]): badges is VerificationBadge[] {
  return badges.every((b) => (VALID_BADGES as readonly string[]).includes(b as string));
}

export function validateAskingPrice(price: number | undefined): boolean {
  if (price === undefined) return true;
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) return false;
  return price <= 100_000_000;
}

export function validateBrandPackage(pkg: Partial<BrandPackage>): ValidationResult {
  const errors: string[] = [];

  if (!pkg.slug || !validateSlug(pkg.slug)) {
    errors.push('slug: must be 2-80 chars, lowercase kebab');
  }
  if (!pkg.name || pkg.name.trim().length < 2 || pkg.name.length > 120) {
    errors.push('name: must be 2-120 chars');
  }
  if (!pkg.tagline || pkg.tagline.length > 200) {
    errors.push('tagline: required, max 200 chars');
  }
  if (!pkg.category || !validateCategory(pkg.category)) {
    errors.push(`category: must be one of ${BRAND_CATEGORIES.map((c) => c.id).join(', ')}`);
  }
  if (!pkg.tier || !validateTier(pkg.tier)) {
    errors.push(`tier: must be one of ${VALID_TIERS.join(', ')}`);
  }
  if (!pkg.status || !validateStatus(pkg.status)) {
    errors.push(`status: must be one of ${VALID_STATUSES.join(', ')}`);
  }
  if (pkg.verificationBadges && !validateBadges(pkg.verificationBadges)) {
    errors.push('verificationBadges: contains invalid badge');
  }
  if (!validateAskingPrice(pkg.askingPriceUsd)) {
    errors.push('askingPriceUsd: must be a finite non-negative number <= 100M');
  }
  if (pkg.askingPriceUsd !== undefined && pkg.askingPriceUsd >= NO_BUY_NOW_THRESHOLD_USD && !pkg.inquiryOnly) {
    errors.push(`inquiryOnly: must be true when askingPriceUsd >= ${NO_BUY_NOW_THRESHOLD_USD}`);
  }

  return { ok: errors.length === 0, errors };
}

export function validateInquiryAmount(amount: number | undefined): boolean {
  if (amount === undefined) return true;
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 && amount <= 100_000_000;
}
