// OMDALA — Shared Type Definitions
// Source of truth expands from the master data model in docs/DATA_MODEL_OMDALA.md

// ─── Domain-specific re-exports ──────────────────────────────────────────

export * from './om-ai.js';
export * from './omniverse.js';

// ─── Identity ─────────────────────────────────────────────────────────────

export type UserRole =
  | "expert"
  | "host"
  | "community"
  | "business"
  | "admin"
  | "system";

export type SupportedLocale = "en" | "vi";
export type RuntimeEnvironment =
  | "development"
  | "preview"
  | "staging"
  | "production";
export type DeploySurface = "web" | "app" | "admin" | "docs" | "api";
export type ISODateTimeString = string;
export type EntityId = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface JsonArray extends Array<JsonValue> {}

export interface LocalizedTextMap<T = string> {
  en: T;
  vi: T;
}

// ─── Trust ────────────────────────────────────────────────────────────────

export type TrustLevel =
  | "unverified"
  | "basic"
  | "verified"
  | "established"
  | "trusted";

export type VerificationStatus = "not_started" | "pending" | "verified";

export interface TrustSignal {
  type: string;
  verified: boolean;
  score: number;
}

export interface TrustSummary {
  overallScore: number;
  level: TrustLevel;
  verificationStatus: VerificationStatus;
  proofCount: number;
  highlights: string[];
  blockers: string[];
  updatedAt: string;
}

// ─── Shared primitives ────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number;
  lng: number;
}

export type VisibilityStatus =
  | "private"
  | "network"
  | "restricted_public"
  | "public";

// ─── Node ─────────────────────────────────────────────────────────────────

export type NodeType = "person" | "team" | "business" | "place" | "community";

export type NodeStatus = "draft" | "active" | "archived";

export interface NodeRecord {
  id: EntityId;
  slug: string;
  nodeType: NodeType;
  name: string;
  summary: string;
  locationText: string;
  visibility: VisibilityStatus;
  status: NodeStatus;
  primaryRole: UserRole;
  trustLevel: TrustLevel;
  verificationStatus: VerificationStatus;
  proofCount: number;
  resourceCount: number;
}

export interface NodeFormInput {
  name: string;
  slug: string;
  nodeType: NodeType;
  primaryRole: UserRole;
  summary: string;
  locationText: string;
  visibility: VisibilityStatus;
}

// ─── Resource ─────────────────────────────────────────────────────────────

export type ResourceType =
  | "time"
  | "space"
  | "skill"
  | "service"
  | "knowledge"
  | "asset";

export type ResourceStatus = "draft" | "available" | "paused" | "archived";

export type AvailabilityMode = "flexible" | "scheduled" | "limited";

export type PricingMode = "free" | "fixed" | "custom";

export interface ResourceRecord {
  id: EntityId;
  nodeId: EntityId;
  slug: string;
  resourceType: ResourceType;
  title: string;
  description: string;
  availabilityMode: AvailabilityMode;
  pricingMode: PricingMode;
  visibility: VisibilityStatus;
  status: ResourceStatus;
  utilizationHint: string;
  verificationStatus: VerificationStatus;
  proofCount: number;
}

export interface ResourceFormInput {
  nodeId: string;
  title: string;
  slug: string;
  resourceType: ResourceType;
  description: string;
  availabilityMode: AvailabilityMode;
  pricingMode: PricingMode;
  visibility: VisibilityStatus;
}

// ─── Offers and Requests ──────────────────────────────────────────────────

export type OfferStatus = "draft" | "published" | "paused" | "archived";

export type RequestStatus =
  | "draft"
  | "published"
  | "matched"
  | "fulfilled"
  | "archived";

export interface OfferRecord {
  id: EntityId;
  nodeId: EntityId;
  resourceIds: EntityId[];
  slug: string;
  title: string;
  summary: string;
  category: string;
  pricingMode: PricingMode;
  visibility: VisibilityStatus;
  status: OfferStatus;
  minimumTrustLevel: TrustLevel | "none";
}

export interface RequestRecord {
  id: EntityId;
  nodeId: EntityId;
  slug: string;
  title: string;
  summary: string;
  category: string;
  urgency: "low" | "medium" | "high";
  visibility: VisibilityStatus;
  status: RequestStatus;
  budgetHint: string;
}

export interface OfferFormInput {
  nodeId: string;
  resourceIds: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  pricingMode: PricingMode;
  visibility: VisibilityStatus;
  minimumTrustLevel: TrustLevel | "none";
}

export interface RequestFormInput {
  nodeId: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  urgency: "low" | "medium" | "high";
  visibility: VisibilityStatus;
  budgetHint: string;
}

// ─── Proof and Moderation ─────────────────────────────────────────────────

export interface ProofRecord {
  id: EntityId;
  subjectType: "node" | "resource" | "offer" | "request";
  subjectId: EntityId;
  proofType: string;
  summary: string;
  verificationStatus: VerificationStatus;
}

export type StateStatus = "current" | "desired" | "blocked" | "completed";

export interface StateRecord {
  id: EntityId;
  nodeId: EntityId;
  label: string;
  summary: string;
  status: StateStatus;
  updatedAt: ISODateTimeString;
}

export type CommitmentStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "completed"
  | "failed"
  | "disputed";

export interface CommitmentRecord {
  id: EntityId;
  fromNodeId: EntityId;
  toNodeId: EntityId;
  title: string;
  summary: string;
  amount?: number;
  currency?: string;
  dueAt?: ISODateTimeString;
  status: CommitmentStatus;
  proofIds: EntityId[];
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface CommitmentFormInput {
  fromNodeId: EntityId;
  toNodeId: EntityId;
  title: string;
  summary: string;
  amount?: number;
  currency?: string;
  dueAt?: ISODateTimeString;
}

export type TransitionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "failed";

export interface TransitionRecord {
  id: EntityId;
  commitmentId?: EntityId;
  nodeId: EntityId;
  fromStateLabel: string;
  toStateLabel: string;
  summary: string;
  status: TransitionStatus;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface RealityProofRecord {
  id: EntityId;
  commitmentId?: EntityId;
  transitionId?: EntityId;
  type: "document" | "payment" | "behavior" | "verification";
  summary: string;
  verificationStatus: VerificationStatus;
  createdAt: ISODateTimeString;
}

export interface TrustScoreRecord {
  nodeId: EntityId;
  score: number;
  level: TrustLevel;
  explanation: string[];
  updatedAt: ISODateTimeString;
}

export interface ModerationCase {
  id: EntityId;
  subjectType: "node" | "offer" | "request" | "proof";
  subjectId: EntityId;
  title: string;
  summary: string;
  severity: "low" | "medium" | "high";
  status: "open" | "reviewed";
  actionHint: string;
}

// ─── Matching ─────────────────────────────────────────────────────────────

export interface MatchSuggestion {
  id: EntityId;
  type: "offer_activation" | "collaboration" | "trust_upgrade" | "distribution";
  score: number;
  title: string;
  summary: string;
  nextAction: string;
}

// ─── Notifications and AI ────────────────────────────────────────────────

export interface NotificationRecord {
  id: EntityId;
  type: "match" | "trust" | "proof" | "follow_up" | "system";
  title: string;
  summary: string;
  href: string;
  priority: "normal" | "high";
  read: boolean;
}

export interface AiActionSuggestion {
  id: EntityId;
  mode: "advisor" | "planner" | "operator" | "analyst";
  title: string;
  summary: string;
  nextAction: string;
  priority?: "high" | "medium" | "low";
  confidence?: number;
  rationale?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: JsonValue;
}

export interface ApiResponse<T> {
  data: T;
  ok: boolean;
  error?: string | ApiError;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
