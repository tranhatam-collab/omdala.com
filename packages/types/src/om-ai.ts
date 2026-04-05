// OMDALA — Om AI Type Definitions
// Domain: AI Human Call + Learning + Communication
// Used by: om-ai.omdala.com (backend, web, mobile)

import type { EntityId, ISODateTimeString, JsonObject } from './index.js';

// ─── App Identity ────────────────────────────────────────────────────────

export type OmAiAppId = 'om-ai';

export type OmAiTier = 'free' | 'pro';

export interface OmAiSubscription {
  userId: EntityId;
  tier: OmAiTier;
  /** Free tier: 30 min/day, Pro: unlimited */
  dailyLimitMinutes: number | null;
  priceMonthly: number;
  stripeSubscriptionId?: string;
  startedAt: ISODateTimeString;
  expiresAt?: ISODateTimeString;
  cancelledAt?: ISODateTimeString;
}

// ─── Persona ─────────────────────────────────────────────────────────────

export type PersonaCategory =
  | 'english_teacher'
  | 'business_coach'
  | 'wellness_companion'
  | 'language_tutor'
  | 'sales_trainer'
  | 'receptionist'
  | 'custom';

export type PersonaStatus = 'draft' | 'active' | 'disabled';

export type PersonaResponseStyle = 'formal' | 'casual' | 'patient' | 'encouraging';

export interface PersonaRecord {
  id: EntityId;
  slug: string;
  name: string;
  category: PersonaCategory;
  avatarUrl: string;
  bio: string;
  expertise: string[];
  /** LLM system prompt that defines this persona's behavior */
  systemPrompt: string;
  responseStyle: PersonaResponseStyle;
  /** 0.0 – 1.0, LLM temperature */
  temperature: number;
  /** Speaking speed multiplier: 0.5x – 2.0x */
  speakingSpeed: number;
  /** Available 24/7 or specific hours */
  availability: 'always' | 'business_hours';
  status: PersonaStatus;
  /** Aggregate stats */
  totalCalls: number;
  avgRating: number;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface PersonaFormInput {
  name: string;
  slug: string;
  category: PersonaCategory;
  avatarUrl?: string;
  bio: string;
  expertise: string[];
  systemPrompt: string;
  responseStyle: PersonaResponseStyle;
  temperature?: number;
  speakingSpeed?: number;
  availability?: 'always' | 'business_hours';
}

// ─── Call ─────────────────────────────────────────────────────────────────

export type CallStatus =
  | 'initiating'
  | 'ringing'
  | 'active'
  | 'paused'
  | 'ended'
  | 'failed';

export type CallEndReason =
  | 'user_hangup'
  | 'daily_limit'
  | 'timeout'
  | 'error'
  | 'persona_unavailable';

export interface CallRecord {
  id: EntityId;
  userId: EntityId;
  personaId: EntityId;
  status: CallStatus;
  /** WebRTC or provider session identifier */
  sessionId?: string;
  startedAt?: ISODateTimeString;
  endedAt?: ISODateTimeString;
  /** Duration in seconds */
  durationSeconds: number;
  endReason?: CallEndReason;
  /** User's rating (1–5) */
  rating?: number;
  ratingComment?: string;
  metadata?: JsonObject;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface CallStartInput {
  personaId: EntityId;
}

export interface CallEndInput {
  callId: EntityId;
  endReason: CallEndReason;
  rating?: number;
  ratingComment?: string;
}

// ─── Transcript ──────────────────────────────────────────────────────────

export type TranscriptSpeaker = 'user' | 'persona';

export interface TranscriptSegment {
  id: EntityId;
  callId: EntityId;
  speaker: TranscriptSpeaker;
  text: string;
  /** Start time offset in milliseconds from call start */
  startMs: number;
  /** End time offset in milliseconds from call start */
  endMs: number;
  /** Confidence score from speech-to-text (0.0 – 1.0) */
  confidence: number;
  createdAt: ISODateTimeString;
}

// ─── Recap ───────────────────────────────────────────────────────────────

export interface RecapRecord {
  id: EntityId;
  callId: EntityId;
  userId: EntityId;
  personaId: EntityId;
  /** AI-generated session summary (1–3 sentences) */
  summary: string;
  /** Key topics discussed (tags) */
  keyTopics: string[];
  /** Suggested next steps for the user */
  suggestedNextSteps: string[];
  /** Total transcript segments */
  segmentCount: number;
  /** Call duration in seconds */
  durationSeconds: number;
  /** User bookmarked this recap */
  isSaved: boolean;
  createdAt: ISODateTimeString;
}

// ─── Usage & Metering ────────────────────────────────────────────────────

export interface UsageEvent {
  id: EntityId;
  userId: EntityId;
  appId: OmAiAppId;
  eventType: 'call_started' | 'call_ended' | 'recap_viewed' | 'subscription_changed';
  /** Minutes consumed in this event */
  minutesUsed?: number;
  metadata?: JsonObject;
  occurredAt: ISODateTimeString;
}

export interface DailyUsageSummary {
  userId: EntityId;
  date: string; // YYYY-MM-DD
  totalCalls: number;
  totalMinutes: number;
  /** Minutes remaining today (free tier only) */
  minutesRemaining: number | null;
}

// ─── Memory / Learning Progress ──────────────────────────────────────────

export interface ConversationMemory {
  id: EntityId;
  userId: EntityId;
  personaId: EntityId;
  /** What the AI remembers about this user-persona relationship */
  topics: string[];
  preferences: JsonObject;
  /** Skill levels tracked (e.g., pronunciation: 3/5) */
  skillLevels?: Record<string, number>;
  lastCallId?: EntityId;
  updatedAt: ISODateTimeString;
}

// ─── API Contracts ───────────────────────────────────────────────────────

export interface OmAiCallStartResponse {
  callId: EntityId;
  sessionId: string;
  persona: Pick<PersonaRecord, 'id' | 'name' | 'avatarUrl' | 'bio'>;
  /** WebSocket URL for real-time transcript updates */
  wsUrl: string;
}

export interface OmAiCallEndResponse {
  callId: EntityId;
  durationSeconds: number;
  recapId: EntityId;
}

export interface OmAiRecapResponse {
  recap: RecapRecord;
  transcript: TranscriptSegment[];
}

// ─── WebSocket Events ────────────────────────────────────────────────────

export type OmAiWsEventType =
  | 'transcript_update'
  | 'call_status_changed'
  | 'daily_limit_warning'
  | 'call_ended';

export interface OmAiWsEvent {
  type: OmAiWsEventType;
  callId: EntityId;
  payload: JsonObject;
  timestamp: ISODateTimeString;
}
