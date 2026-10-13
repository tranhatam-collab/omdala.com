export interface HyperdriveBinding {
  connectionString?: string;
}

export interface ApiBindings {
  ENVIRONMENT: string;
  DATABASE_URL?: string;
  HYPERDRIVE?: HyperdriveBinding;
  APP_BASE_URL?: string;
  WEB_BASE_URL?: string;
  AUTH_BASE_URL?: string;
  MAIL_API_URL?: string;
  MAIL_API_KEY?: string;
  MAGIC_LINK_SECRET?: string;
}

export interface ContactRequest {
  name?: string;
  email?: string;
  organization?: string;
  topic?: string;
  message?: string;
  source?: string;
}

export interface NormalizedContactRequest {
  name: string;
  email: string;
  organization: string;
  topic: string;
  message: string;
  source: string;
}

export interface AccessRequest {
  email?: string;
  role?: string;
  nodeName?: string;
  note?: string;
}

export interface NormalizedAccessRequest {
  email: string;
  role: string;
  nodeName: string;
  note: string;
}

export interface MagicLinkRequest {
  email?: string;
  redirectTo?: string;
}

export type MagicLinkPayload = {
  email: string;
  redirectTo: string;
  exp: number;
};

export type MailRequest = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
};

export interface RealityCommitmentRequest {
  fromNodeId?: string;
  toNodeId?: string;
  title?: string;
  summary?: string;
  amount?: number;
  currency?: string;
  dueAt?: string;
}

export interface RealityProofRequest {
  commitmentId?: string;
  transitionId?: string;
  type?: "document" | "payment" | "behavior" | "verification";
  summary?: string;
}

export interface ApiContract {
  resolveAllowedOrigin(origin?: string | null): string | null;
  normalizeEmail(value?: string): string;
  isEmail(value: string): boolean;
  normalizePath(value: string | undefined, fallback: string): string;
  normalizeContactRequest(input: ContactRequest): NormalizedContactRequest;
  normalizeAccessRequest(input: AccessRequest): NormalizedAccessRequest;
  normalizeMagicLinkRequest(input: MagicLinkRequest): {
    email: string;
    redirectTo: string;
  };
}
