import type { OmdalaLanguage } from "@omdala/core";
import {
  pickBilingualValue,
  resolveLanguageFromSearchParams,
  type BilingualValue,
  type SearchParamsInput,
} from "@omdala/ui";

type AwaitableSearchParams =
  | Promise<Record<string, string | string[] | undefined> | undefined>
  | Record<string, string | string[] | undefined>
  | undefined;

export function t(language: OmdalaLanguage, value: BilingualValue): string {
  return pickBilingualValue(language, value);
}

export async function resolveAdminLanguage(
  searchParams?: AwaitableSearchParams,
): Promise<OmdalaLanguage> {
  const resolved = searchParams ? await searchParams : undefined;
  return resolveLanguageFromSearchParams(
    (resolved ?? null) as SearchParamsInput,
  );
}

export function shortLanguage(language: OmdalaLanguage): "en" | "vi" {
  return language === "vi" ? "vi" : "en";
}

export const ADMIN_COPY = {
  layout: {
    restrictedSurface: {
      en: "Restricted Surface",
      vi: "Bề mặt giới hạn",
    },
    brand: {
      en: "OMDALA Admin",
      vi: "OMDALA Admin",
    },
    adminNavigation: {
      en: "Admin navigation",
      vi: "Điều hướng quản trị",
    },
    accessRestricted: {
      en: "Access Restricted",
      vi: "Giới hạn truy cập",
    },
    adminRoleRequired: {
      en: "Admin role required",
      vi: "Yêu cầu vai trò quản trị",
    },
    restrictedCopy: {
      en: "This surface is reserved for moderation and operations roles. Wire the real auth provider before exposing this deployment publicly.",
      vi: "Khu vực này dành cho các vai trò kiểm duyệt và vận hành. Hãy nối nhà cung cấp xác thực thật trước khi mở công khai môi trường này.",
    },
    nav: {
      overview: {
        en: "Overview",
        vi: "Tổng quan",
      },
      providers: {
        en: "Providers",
        vi: "Nhà cung cấp",
      },
      nodes: {
        en: "Nodes",
        vi: "Nút",
      },
      offers: {
        en: "Offers",
        vi: "Đề nghị",
      },
      requests: {
        en: "Requests",
        vi: "Nhu cầu",
      },
      proofs: {
        en: "Proofs",
        vi: "Bằng chứng",
      },
      verifications: {
        en: "Verifications",
        vi: "Xác minh",
      },
    },
  },
  overview: {
    eyebrow: {
      en: "Moderation Overview",
      vi: "Tổng quan kiểm duyệt",
    },
    title: {
      en: "Operations queue",
      vi: "Hàng chờ vận hành",
    },
    intro: {
      en: "This admin surface supports moderation workflows across nodes, offers, requests, proofs, and verification review.",
      vi: "Bề mặt quản trị này hỗ trợ luồng kiểm duyệt cho nút, đề nghị, nhu cầu, bằng chứng và rà duyệt xác minh.",
    },
    openCases: {
      en: "Open cases",
      vi: "Case đang mở",
    },
    highSeverity: {
      en: "High severity",
      vi: "Mức nghiêm trọng cao",
    },
    nextReviewArea: {
      en: "Next review area",
      vi: "Khu vực rà duyệt kế tiếp",
    },
    nextReviewAreaBody: {
      en: "Offers that require proof or stronger trust before publication.",
      vi: "Các đề nghị cần thêm bằng chứng hoặc niềm tin mạnh hơn trước khi xuất bản.",
    },
    currentQueue: {
      en: "Current queue",
      vi: "Hàng chờ hiện tại",
    },
    severity: {
      en: "Severity",
      vi: "Mức độ",
    },
    action: {
      en: "Action",
      vi: "Hành động",
    },
    reviewOffers: {
      en: "Review offers",
      vi: "Rà duyệt đề nghị",
    },
    reviewRequests: {
      en: "Review requests",
      vi: "Rà duyệt nhu cầu",
    },
    reviewProofs: {
      en: "Review proofs",
      vi: "Rà duyệt bằng chứng",
    },
  },
  nodes: {
    eyebrow: {
      en: "Nodes",
      vi: "Nút",
    },
    title: {
      en: "Node moderation",
      vi: "Kiểm duyệt nút",
    },
    role: {
      en: "Role",
      vi: "Vai trò",
    },
    verification: {
      en: "Verification",
      vi: "Xác minh",
    },
    trust: {
      en: "Trust",
      vi: "Niềm tin",
    },
  },
  offers: {
    eyebrow: {
      en: "Offers",
      vi: "Đề nghị",
    },
    title: {
      en: "Offer moderation",
      vi: "Kiểm duyệt đề nghị",
    },
    status: {
      en: "Status",
      vi: "Trạng thái",
    },
    visibility: {
      en: "Visibility",
      vi: "Hiển thị",
    },
    minimumTrust: {
      en: "Minimum trust",
      vi: "Niềm tin tối thiểu",
    },
  },
  requests: {
    eyebrow: {
      en: "Requests",
      vi: "Nhu cầu",
    },
    title: {
      en: "Request moderation",
      vi: "Kiểm duyệt nhu cầu",
    },
    status: {
      en: "Status",
      vi: "Trạng thái",
    },
    urgency: {
      en: "Urgency",
      vi: "Mức khẩn",
    },
    visibility: {
      en: "Visibility",
      vi: "Hiển thị",
    },
  },
  proofs: {
    eyebrow: {
      en: "Proofs",
      vi: "Bằng chứng",
    },
    title: {
      en: "Proof review",
      vi: "Rà duyệt bằng chứng",
    },
    subject: {
      en: "Subject",
      vi: "Đối tượng",
    },
    verification: {
      en: "Verification",
      vi: "Xác minh",
    },
  },
  verifications: {
    eyebrow: {
      en: "Verifications",
      vi: "Xác minh",
    },
    title: {
      en: "Verification review queue",
      vi: "Hàng chờ rà duyệt xác minh",
    },
    severity: {
      en: "Severity",
      vi: "Mức độ",
    },
    action: {
      en: "Action",
      vi: "Hành động",
    },
  },
  providers: {
    score: {
      en: "Score",
      vi: "Điểm số",
    },
    fallback: {
      en: "Fallback",
      vi: "Dự phòng",
    },
    health: {
      en: "Health",
      vi: "Sức khỏe",
    },
    na: {
      en: "n/a",
      vi: "không có",
    },
  },
} as const;
