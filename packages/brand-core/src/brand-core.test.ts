import { describe, it, expect } from 'vitest';
import {
  BRAND_CATEGORIES,
  NO_BUY_NOW_THRESHOLD_USD,
  PUBLIC_LISTING_STATUSES,
  INQUIRY_TYPES,
  isPublicStatus,
  isBuyNowAllowed,
  toPublicDTO,
  validateSlug,
  validateCategory,
  validateTier,
  validateStatus,
  validateInquiryType,
  validateAskingPrice,
  validateBrandPackage,
  validateInquiryAmount,
} from './index';
import type { BrandPackage, BrandCategory } from './index';

describe('brand-core constants', () => {
  it('has 7 categories', () => {
    expect(BRAND_CATEGORIES).toHaveLength(7);
  });

  it('NO_BUY_NOW_THRESHOLD_USD is 5000', () => {
    expect(NO_BUY_NOW_THRESHOLD_USD).toBe(5000);
  });

  it('has 3 public listing statuses', () => {
    expect(PUBLIC_LISTING_STATUSES).toHaveLength(3);
  });

  it('has 5 inquiry types', () => {
    expect(INQUIRY_TYPES).toHaveLength(5);
  });
});

describe('isPublicStatus', () => {
  it('returns true for listed, inquiry_open, under_offer', () => {
    expect(isPublicStatus('listed')).toBe(true);
    expect(isPublicStatus('inquiry_open')).toBe(true);
    expect(isPublicStatus('under_offer')).toBe(true);
  });

  it('returns false for draft, pending_review, rejected, archived', () => {
    expect(isPublicStatus('draft')).toBe(false);
    expect(isPublicStatus('pending_review')).toBe(false);
    expect(isPublicStatus('rejected')).toBe(false);
    expect(isPublicStatus('archived')).toBe(false);
  });
});

describe('isBuyNowAllowed', () => {
  it('allows buy now below threshold', () => {
    expect(isBuyNowAllowed(4999)).toBe(true);
  });

  it('disallows buy now at or above threshold', () => {
    expect(isBuyNowAllowed(5000)).toBe(false);
    expect(isBuyNowAllowed(10000)).toBe(false);
  });

  it('disallows undefined price', () => {
    expect(isBuyNowAllowed(undefined)).toBe(false);
  });
});

describe('toPublicDTO', () => {
  const validPkg: BrandPackage = {
    id: 'pkg_001',
    slug: 'omcode',
    name: 'OMCode',
    tagline: 'AI code workspace',
    description: { en: 'AI code workspace brand', vi: 'Thương hiệu workspace AI' },
    category: 'ai',
    tier: 'T2',
    status: 'listed',
    assets: [],
    verificationBadges: ['domain_verified', 'codebase_verified'],
    includedAssets: ['domain', 'codebase'],
    excludedAssets: ['trademark'],
    askingPriceUsd: 25000,
    inquiryOnly: true,
    sellerId: 'seller_001',
    createdAt: '2026-06-30T00:00:00Z',
    updatedAt: '2026-07-28T00:00:00Z',
    listedAt: '2026-07-01T00:00:00Z',
  };

  it('converts a listed package to public DTO', () => {
    const dto = toPublicDTO(validPkg, true);
    expect(dto).not.toBeNull();
    expect(dto!.slug).toBe('omcode');
    expect(dto!.category.id).toBe('ai');
    expect(dto!.sellerVerified).toBe(true);
    expect(dto!.assets).toEqual(validPkg.assets);
    expect(dto!.transferConditions).toEqual(validPkg.transferConditions);
  });

  it('returns null for non-public status', () => {
    const dto = toPublicDTO({ ...validPkg, status: 'draft' }, true);
    expect(dto).toBeNull();
  });

  it('returns null for invalid category', () => {
    const dto = toPublicDTO({ ...validPkg, category: 'invalid' as BrandCategory['id'] }, true);
    expect(dto).toBeNull();
  });
});

describe('validation', () => {
  describe('validateSlug', () => {
    it('accepts valid kebab slugs', () => {
      expect(validateSlug('omcode')).toBe(true);
      expect(validateSlug('ai-brand-123')).toBe(true);
    });

    it('rejects invalid slugs', () => {
      expect(validateSlug('')).toBe(false);
      expect(validateSlug('A')).toBe(false);
      expect(validateSlug('UPPER')).toBe(false);
      expect(validateSlug('has space')).toBe(false);
      expect(validateSlug('a'.repeat(81))).toBe(false);
    });
  });

  describe('validateCategory', () => {
    it('accepts known categories', () => {
      expect(validateCategory('ai')).toBe(true);
      expect(validateCategory('saas')).toBe(true);
    });

    it('rejects unknown categories', () => {
      expect(validateCategory('crypto')).toBe(false);
    });
  });

  describe('validateTier', () => {
    it('accepts T1-T5', () => {
      for (const t of ['T1', 'T2', 'T3', 'T4', 'T5']) {
        expect(validateTier(t)).toBe(true);
      }
    });

    it('rejects T6', () => {
      expect(validateTier('T6')).toBe(false);
    });
  });

  describe('validateStatus', () => {
    it('accepts known statuses', () => {
      expect(validateStatus('listed')).toBe(true);
      expect(validateStatus('draft')).toBe(true);
    });

    it('rejects unknown', () => {
      expect(validateStatus('sold')).toBe(false);
    });
  });

  describe('validateInquiryType', () => {
    it('accepts known types', () => {
      expect(validateInquiryType('submit_offer')).toBe(true);
      expect(validateInquiryType('open_deal_room')).toBe(true);
    });

    it('rejects unknown', () => {
      expect(validateInquiryType('buy_now')).toBe(false);
    });
  });

  describe('validateAskingPrice', () => {
    it('accepts valid prices and undefined', () => {
      expect(validateAskingPrice(0)).toBe(true);
      expect(validateAskingPrice(99999999)).toBe(true);
      expect(validateAskingPrice(undefined)).toBe(true);
    });

    it('rejects negative, NaN, too large', () => {
      expect(validateAskingPrice(-1)).toBe(false);
      expect(validateAskingPrice(NaN)).toBe(false);
      expect(validateAskingPrice(100000001)).toBe(false);
    });
  });

  describe('validateInquiryAmount', () => {
    it('accepts positive amounts and undefined', () => {
      expect(validateInquiryAmount(1000)).toBe(true);
      expect(validateInquiryAmount(undefined)).toBe(true);
    });

    it('rejects zero, negative, NaN', () => {
      expect(validateInquiryAmount(0)).toBe(false);
      expect(validateInquiryAmount(-5)).toBe(false);
      expect(validateInquiryAmount(NaN)).toBe(false);
    });
  });

  describe('validateBrandPackage', () => {
    const validPkg: BrandPackage = {
      id: 'pkg_001',
      slug: 'omcode',
      name: 'OMCode',
      tagline: 'AI code workspace',
      description: { en: 'desc', vi: 'mo ta' },
      category: 'ai',
      tier: 'T2',
      status: 'listed',
      assets: [],
      verificationBadges: ['domain_verified'],
      includedAssets: ['domain'],
      excludedAssets: [],
      askingPriceUsd: 25000,
      inquiryOnly: true,
      sellerId: 'seller_001',
      createdAt: '2026-06-30T00:00:00Z',
      updatedAt: '2026-07-28T00:00:00Z',
    };

    it('passes for valid package', () => {
      const result = validateBrandPackage(validPkg);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when inquiryOnly is false but price >= threshold', () => {
      const result = validateBrandPackage({ ...validPkg, inquiryOnly: false });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('inquiryOnly'))).toBe(true);
    });

    it('passes when inquiryOnly is false and price < threshold', () => {
      const result = validateBrandPackage({ ...validPkg, askingPriceUsd: 4999, inquiryOnly: false });
      expect(result.ok).toBe(true);
    });

    it('fails for invalid slug', () => {
      const result = validateBrandPackage({ ...validPkg, slug: 'UPPER' });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('slug'))).toBe(true);
    });

    it('fails for invalid tier', () => {
      const result = validateBrandPackage({ ...validPkg, tier: 'T6' as BrandPackage['tier'] });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('tier'))).toBe(true);
    });

    it('fails for invalid category', () => {
      const result = validateBrandPackage({ ...validPkg, category: 'crypto' as BrandPackage['category'] });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('category'))).toBe(true);
    });

    it('fails for missing name', () => {
      const result = validateBrandPackage({ ...validPkg, name: '' });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });
  });
});
