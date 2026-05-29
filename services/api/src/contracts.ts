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
  MAIL_API_WORKSPACE_ID?: string;
  MAGIC_LINK_SECRET?: string;
  // Google OAuth
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  GOOGLE_OAUTH_STATE_SECRET?: string;
  // Custom Security API
  API_KEY_SECRET?: string;
  WEBHOOK_SECRET?: string;
  SERVICE_TOKEN_SECRET?: string;
  CSRF_SECRET?: string;
  // AI Provider Keys (auto-connect)
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  AZURE_OPENAI_KEY?: string;
  AZURE_OPENAI_ENDPOINT?: string;
  MISTRAL_API_KEY?: string;
  GROQ_API_KEY?: string;
  COHERE_API_KEY?: string;
  CUSTOM_AI_ENDPOINT?: string;
  CUSTOM_AI_KEY?: string;
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
  message_idempotency_key?: string;
  workspace_id?: string;
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
