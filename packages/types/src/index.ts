// OMDALA — Shared Type Definitions
// Extend as the data model solidifies. See docs/ for DATA_MODEL_OMDALA.md

// ─── Entity Roles ─────────────────────────────────────────────────────────

export type UserRole = 'expert' | 'host' | 'community' | 'admin' | 'system'

// ─── Trust ────────────────────────────────────────────────────────────────

export type TrustLevel = 'unverified' | 'basic' | 'verified' | 'trusted'

export interface TrustSignal {
  type:     string
  verified: boolean
  score:    number
}

// ─── Locale ───────────────────────────────────────────────────────────────

export type SupportedLocale = 'en' | 'vi'

// ─── Node / Place ─────────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number
  lng: number
}

export interface CityNode {
  id:       string
  name:     string
  slug:     string
  domain:   string
  geo:      GeoPoint
  active:   boolean
}

// ─── API ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data:    T
  ok:      boolean
  error?:  string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total:   number
  page:    number
  limit:   number
}
