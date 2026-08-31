import type { OmdalaLanguage } from "@omdala/core";
import type {
  AiActionSuggestion,
  AvailabilityMode,
  NodeStatus,
  NodeType,
  PricingMode,
  RequestStatus,
  ResourceStatus,
  ResourceType,
  TrustLevel,
  UserRole,
  VerificationStatus,
  VisibilityStatus,
} from "@omdala/types";

type ScoreBand = "critical" | "growth" | "healthy";
type Urgency = "low" | "medium" | "high";
type ProofSubjectType = "node" | "resource" | "offer" | "request";
type ProofQueuePriority = "high" | "normal";

const USER_ROLE_LABELS_VI: Record<UserRole, string> = {
  expert: "Chuyên gia",
  host: "Chủ thể đón tiếp",
  community: "Cộng đồng",
  business: "Doanh nghiệp",
  admin: "Quản trị",
  system: "Hệ thống",
};

const USER_ROLE_LABELS_EN: Record<UserRole, string> = {
  expert: "Expert",
  host: "Host",
  community: "Community",
  business: "Business",
  admin: "Admin",
  system: "System",
};

const NODE_TYPE_LABELS_VI: Record<NodeType, string> = {
  person: "Cá nhân",
  team: "Nhóm",
  business: "Doanh nghiệp",
  place: "Địa điểm",
  community: "Cộng đồng",
};

const NODE_TYPE_LABELS_EN: Record<NodeType, string> = {
  person: "Person",
  team: "Team",
  business: "Business",
  place: "Place",
  community: "Community",
};

const VISIBILITY_LABELS_VI: Record<VisibilityStatus, string> = {
  private: "Riêng tư",
  network: "Trong mạng lưới",
  restricted_public: "Công khai có giới hạn",
  public: "Công khai",
};

const VISIBILITY_LABELS_EN: Record<VisibilityStatus, string> = {
  private: "Private",
  network: "Network",
  restricted_public: "Restricted public",
  public: "Public",
};

const NODE_STATUS_LABELS_VI: Record<NodeStatus, string> = {
  draft: "Nháp",
  active: "Đang hoạt động",
  archived: "Đã lưu trữ",
};

const NODE_STATUS_LABELS_EN: Record<NodeStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

const RESOURCE_STATUS_LABELS_VI: Record<ResourceStatus, string> = {
  draft: "Nháp",
  available: "Sẵn sàng",
  paused: "Tạm dừng",
  archived: "Đã lưu trữ",
};

const RESOURCE_STATUS_LABELS_EN: Record<ResourceStatus, string> = {
  draft: "Draft",
  available: "Available",
  paused: "Paused",
  archived: "Archived",
};

const REQUEST_STATUS_LABELS_VI: Record<RequestStatus, string> = {
  draft: "Nháp",
  published: "Đang mở",
  matched: "Đã ghép nối",
  fulfilled: "Đã hoàn tất",
  archived: "Đã lưu trữ",
};

const REQUEST_STATUS_LABELS_EN: Record<RequestStatus, string> = {
  draft: "Draft",
  published: "Published",
  matched: "Matched",
  fulfilled: "Fulfilled",
  archived: "Archived",
};

const RESOURCE_TYPE_LABELS_VI: Record<ResourceType, string> = {
  time: "Thời gian",
  space: "Không gian",
  skill: "Kỹ năng",
  service: "Dịch vụ",
  knowledge: "Tri thức",
  asset: "Tài sản",
};

const RESOURCE_TYPE_LABELS_EN: Record<ResourceType, string> = {
  time: "Time",
  space: "Space",
  skill: "Skill",
  service: "Service",
  knowledge: "Knowledge",
  asset: "Asset",
};

const AVAILABILITY_MODE_LABELS_VI: Record<AvailabilityMode, string> = {
  flexible: "Linh hoạt",
  scheduled: "Theo lịch",
  limited: "Giới hạn",
};

const AVAILABILITY_MODE_LABELS_EN: Record<AvailabilityMode, string> = {
  flexible: "Flexible",
  scheduled: "Scheduled",
  limited: "Limited",
};

const PRICING_MODE_LABELS_VI: Record<PricingMode, string> = {
  free: "Miễn phí",
  fixed: "Giá cố định",
  custom: "Theo thỏa thuận",
};

const PRICING_MODE_LABELS_EN: Record<PricingMode, string> = {
  free: "Free",
  fixed: "Fixed",
  custom: "Custom",
};

const TRUST_LEVEL_LABELS_VI: Record<TrustLevel, string> = {
  unverified: "Chưa xác minh",
  basic: "Cơ bản",
  verified: "Đã xác minh",
  established: "Ổn định",
  trusted: "Đáng tin cậy",
};

const TRUST_LEVEL_LABELS_EN: Record<TrustLevel, string> = {
  unverified: "Unverified",
  basic: "Basic",
  verified: "Verified",
  established: "Established",
  trusted: "Trusted",
};

const VERIFICATION_STATUS_LABELS_VI: Record<VerificationStatus, string> = {
  not_started: "Chưa bắt đầu",
  pending: "Đang chờ duyệt",
  verified: "Đã xác minh",
};

const VERIFICATION_STATUS_LABELS_EN: Record<VerificationStatus, string> = {
  not_started: "Not started",
  pending: "Pending",
  verified: "Verified",
};

const SCORE_BAND_LABELS_VI: Record<ScoreBand, string> = {
  critical: "Cần chú ý",
  growth: "Đang tăng trưởng",
  healthy: "Ổn định",
};

const SCORE_BAND_LABELS_EN: Record<ScoreBand, string> = {
  critical: "Critical",
  growth: "Growth",
  healthy: "Healthy",
};

const URGENCY_LABELS_VI: Record<Urgency, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

const URGENCY_LABELS_EN: Record<Urgency, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PROOF_SUBJECT_LABELS_VI: Record<ProofSubjectType, string> = {
  node: "Nút",
  resource: "Tài nguyên",
  offer: "Đề nghị",
  request: "Nhu cầu",
};

const PROOF_SUBJECT_LABELS_EN: Record<ProofSubjectType, string> = {
  node: "Node",
  resource: "Resource",
  offer: "Offer",
  request: "Request",
};

const PROOF_QUEUE_PRIORITY_LABELS_VI: Record<ProofQueuePriority, string> = {
  high: "Cao",
  normal: "Bình thường",
};

const PROOF_QUEUE_PRIORITY_LABELS_EN: Record<ProofQueuePriority, string> = {
  high: "High",
  normal: "Normal",
};

const AI_MODE_LABELS_VI: Record<AiActionSuggestion["mode"], string> = {
  advisor: "Tư vấn",
  planner: "Lập kế hoạch",
  operator: "Điều phối",
  analyst: "Phân tích",
};

const AI_MODE_LABELS_EN: Record<AiActionSuggestion["mode"], string> = {
  advisor: "Advisor",
  planner: "Planner",
  operator: "Operator",
  analyst: "Analyst",
};

const AI_PRIORITY_LABELS_VI: Record<
  NonNullable<AiActionSuggestion["priority"]>,
  string
> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

const AI_PRIORITY_LABELS_EN: Record<
  NonNullable<AiActionSuggestion["priority"]>,
  string
> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function isVietnamese(language: OmdalaLanguage): boolean {
  return language === "vi";
}

function pickEnumLabel<T extends string>(
  value: T,
  language: OmdalaLanguage,
  viMap: Record<T, string>,
  enMap: Record<T, string>,
): string {
  return isVietnamese(language) ? viMap[value] : enMap[value];
}

export function getUserRoleLabel(
  value: UserRole,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, USER_ROLE_LABELS_VI, USER_ROLE_LABELS_EN);
}

export function getNodeTypeLabel(
  value: NodeType,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, NODE_TYPE_LABELS_VI, NODE_TYPE_LABELS_EN);
}

export function getVisibilityLabel(
  value: VisibilityStatus,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, VISIBILITY_LABELS_VI, VISIBILITY_LABELS_EN);
}

export function getNodeStatusLabel(
  value: NodeStatus,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, NODE_STATUS_LABELS_VI, NODE_STATUS_LABELS_EN);
}

export function getResourceStatusLabel(
  value: ResourceStatus,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, RESOURCE_STATUS_LABELS_VI, RESOURCE_STATUS_LABELS_EN);
}

export function getRequestStatusLabel(
  value: RequestStatus,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, REQUEST_STATUS_LABELS_VI, REQUEST_STATUS_LABELS_EN);
}

export function getResourceTypeLabel(
  value: ResourceType,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, RESOURCE_TYPE_LABELS_VI, RESOURCE_TYPE_LABELS_EN);
}

export function getAvailabilityModeLabel(
  value: AvailabilityMode,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(
    value,
    language,
    AVAILABILITY_MODE_LABELS_VI,
    AVAILABILITY_MODE_LABELS_EN,
  );
}

export function getPricingModeLabel(
  value: PricingMode,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, PRICING_MODE_LABELS_VI, PRICING_MODE_LABELS_EN);
}

export function getTrustLevelLabel(
  value: TrustLevel | "none",
  language: OmdalaLanguage = "vi",
): string {
  if (value === "none") {
    return language === "vi" ? "Không yêu cầu" : "No requirement";
  }

  return pickEnumLabel(value, language, TRUST_LEVEL_LABELS_VI, TRUST_LEVEL_LABELS_EN);
}

export function getVerificationStatusLabel(
  value: VerificationStatus,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(
    value,
    language,
    VERIFICATION_STATUS_LABELS_VI,
    VERIFICATION_STATUS_LABELS_EN,
  );
}

export function getScoreBandLabel(
  value: ScoreBand,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, SCORE_BAND_LABELS_VI, SCORE_BAND_LABELS_EN);
}

export function getUrgencyLabel(
  value: Urgency,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, URGENCY_LABELS_VI, URGENCY_LABELS_EN);
}

export function getProofSubjectLabel(
  value: ProofSubjectType,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(
    value,
    language,
    PROOF_SUBJECT_LABELS_VI,
    PROOF_SUBJECT_LABELS_EN,
  );
}

export function getProofQueuePriorityLabel(
  value: ProofQueuePriority,
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(
    value,
    language,
    PROOF_QUEUE_PRIORITY_LABELS_VI,
    PROOF_QUEUE_PRIORITY_LABELS_EN,
  );
}

export function getAiModeLabel(
  value: AiActionSuggestion["mode"],
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(value, language, AI_MODE_LABELS_VI, AI_MODE_LABELS_EN);
}

export function getAiPriorityLabel(
  value: AiActionSuggestion["priority"],
  language: OmdalaLanguage = "vi",
): string {
  return pickEnumLabel(
    value ?? "low",
    language,
    AI_PRIORITY_LABELS_VI,
    AI_PRIORITY_LABELS_EN,
  );
}
