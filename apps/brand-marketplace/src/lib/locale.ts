import type { LocalizedTextMap } from "@omdala/types";

export type MarketplaceLocale = "en" | "vi";

export const MARKETPLACE_ORIGIN = "https://brand.omdala.com";

export const marketCopy = {
  en: {
    brandIndex: "All brands",
    categories: "Categories",
    howItWorks: "How it works",
    verifiedAssets: "Verified assets",
    buy: "Buy a brand",
    sell: "Sell a brand",
    inquiryOnly: "Inquiry only",
    inquiryRequired: "Inquiry required in Phase 1",
    price: "Indicative price",
    viewListing: "View listing",
    noCheckout: "No online checkout is available in Phase 1.",
    noListings: "No approved private inventory is published in this category yet.",
  },
  vi: {
    brandIndex: "Tất cả thương hiệu",
    categories: "Danh mục",
    howItWorks: "Cách hoạt động",
    verifiedAssets: "Tài sản đã xác minh",
    buy: "Mua thương hiệu",
    sell: "Bán thương hiệu",
    inquiryOnly: "Chỉ nhận yêu cầu",
    inquiryRequired: "Giai đoạn 1 yêu cầu trao đổi trước",
    price: "Giá tham khảo",
    viewListing: "Xem niêm yết",
    noCheckout: "Giai đoạn 1 chưa có thanh toán trực tuyến.",
    noListings: "Chưa có tài sản private inventory được duyệt trong danh mục này.",
  },
} as const;

export function localize(text: LocalizedTextMap, locale: MarketplaceLocale): string {
  return text[locale];
}

export function listingHref(locale: MarketplaceLocale, slug: string): string {
  return `/${locale}/brands/${slug}`;
}

export function categoryHref(locale: MarketplaceLocale, slug: string): string {
  return `/${locale}/categories/${slug}`;
}

export function infoHref(locale: MarketplaceLocale, slug: string): string {
  return `/${locale}/${slug}`;
}

export function formatUsd(amount: number, locale: MarketplaceLocale): string {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
