# AI_OM_ACADEMY_INTEGRATION_CONTRACT_V1.md

Version: 1.1
Status: Stage 1A — Reality layer LIVE. Stage 1B (Live) pending /v2/live backend.
Owner: om-ai.omdala.com / AI Om Live
Counterpart: tranhatam.com / docs/ACADEMY_OMAI_INTEGRATION_CONTRACT_V1.md
Date: April 6, 2026

---

# 1. Purpose

This contract specifies the integration boundary between Om AI (ai.omdala.com) and the Tranhatam Academy system (tranhatam.com/academy/).

**Stage 1A (NOW — Reality layer is LIVE):** `/v2/reality` endpoints are operational and Academy may call them directly:

- Approval workflow → submit assignment / review
- Proof trail → lesson completion verification
- Memory aliases → map user_id ↔ nickname
- Scene execution → lesson sequence with proof

**Stage 1B (pending — spec locked, not yet built):** `/v2/live` Live layer (Teacher/Coach persona, lesson lifecycle, session recap, learning memory, curriculum paths, school mode reports).

Ràng buộc giữ nguyên:

- Billing/quota do Om AI backend — Academy chỉ đọc truth, không ghi đè
- Không merge school/family/business scope
- Persona safety profile không bypass

This document is the Om AI-side view. The Academy-side mirror is:
`tranhatam.com/docs/ACADEMY_OMAI_INTEGRATION_CONTRACT_V1.md`

---

# 2. Boundary Rules

Om AI owns:

- Session truth — `/v2/live/sessions`
- Persona selection and behavior
- Learner memory and learning state (`/v2/live/memory/profile`)
- Quota and billable second accounting (server-side only)
- Lesson lifecycle events (start, complete, recap)
- Safety moderation and persona safety

Academy (tranhatam.com) owns:

- Program catalog and content metadata
- Enrollment and access-gating
- Lesson slugs, summaries, access_level
- Academy page UI at tranhatam.com/academy/

Hard rules (from AI_OM_OMDALA_AND_IAI_ONE_RECOMMENDATION_2026.md):

- Om AI session truth stays in Om AI backend — never migrated to Academy
- Om AI quota and billing truth stays in Om AI backend
- Om AI persona and memory truth stays in Om AI backend
- provider-router decisions stay in Om AI backend
- Academy enriches display only — Academy never holds Om AI token server-side
- Integration happens by contract and adapter — no shared codebase

---

# 3. Stage 1A: Reality Layer — What Academy Can Call Now

Om AI Reality base URL: `https://api.omdala.com/v2/reality`

All endpoints below are implemented and live.

### Approval Workflow

| Method | Path                     | Auth   | Academy use                                            |
| ------ | ------------------------ | ------ | ------------------------------------------------------ |
| POST   | `/approvals/request`     | none   | Submit assignment for review                           |
| GET    | `/approvals/:id`         | none   | Poll approval status                                   |
| POST   | `/approvals/:id/confirm` | Bearer | Teacher/reviewer confirms — Academy must NOT call this |
| POST   | `/approvals/:id/reject`  | Bearer | Teacher/reviewer rejects — Academy must NOT call this  |

Academy only calls `POST /request` and `GET /:id`. Confirm/reject belongs to the reviewer side.

### Proof Trail

| Method | Path          | Auth | Academy use                                  |
| ------ | ------------- | ---- | -------------------------------------------- |
| GET    | `/proofs/:id` | none | Read lesson completion proof — display badge |

### Memory Aliases

| Method | Path                  | Auth | Academy use                    |
| ------ | --------------------- | ---- | ------------------------------ |
| GET    | `/memory/profile`     | none | List aliases for display       |
| POST   | `/memory/aliases`     | none | Map Academy user_id ↔ nickname |
| POST   | `/memory/preferences` | none | Store preference key/value     |

### Scene Execution

| Method | Path              | Auth   | Academy use                                      |
| ------ | ----------------- | ------ | ------------------------------------------------ |
| GET    | `/scenes`         | none   | List available lesson scenes                     |
| POST   | `/scenes`         | none   | Create scene (admin only in practice)            |
| POST   | `/scenes/:id/run` | Bearer | Execute lesson sequence — returns run_id + proof |

### Run History

| Method | Path        | Auth | Academy use               |
| ------ | ----------- | ---- | ------------------------- |
| GET    | `/runs`     | none | Display run history list  |
| GET    | `/runs/:id` | none | Display single run detail |

### Reality Constraints for Academy

- Academy stores `approval_id` and `run_id` client-side only — never in Academy backend
- Om AI retains proof truth regardless of Academy display state
- Academy must not call confirm/reject approvals — reviewer/teacher side only
- Scene run requires Bearer token — browser holds the token, not Academy backend

---

# 4. Stage 1B: Live Layer — What Om AI Must Build for Academy (Future)

When `/v2/live` backend is implemented, the following endpoints must support Academy use cases.

### 4.1 Start a Lesson-Bound Session

Already defined in `AI_OM_LIVE_API_CONTRACT_V1.md` Section 11.3:

```
POST /v2/live/lessons/:lesson_id/start
Authorization: Bearer <om_ai_user_token>

{
  "program_slug": "english-foundations",
  "lesson_slug": "daily-routine-a2-01",
  "persona_id": "persona_teacher_en_001",
  "workspace_id": "ws_personal_001",
  "profile_id": "profile_adult_001"
}
```

Response must include `session_id`. Academy stores this client-side only.

### 4.2 Learner Memory Read (Already Defined)

Already defined in `AI_OM_LIVE_API_CONTRACT_V1.md` Section 12.1:

```
GET /v2/live/memory/profile
Authorization: Bearer <om_ai_user_token>
```

Academy reads:

- `learning_state.estimated_level`
- `completed_lessons[]`
- `weak_areas[]`

Academy uses this for read-only display only — to mark lessons as completed in the module list.

### 4.3 Lesson Complete Event + Optional Webhook to Academy

When a lesson-bound session ends, Om AI must:

1. Finalize metering (existing behavior)
2. Generate session recap (existing behavior)
3. Optionally POST to Academy webhook if `program_slug` was provided at session start:

```
POST https://api.tranhatam.com/v1/integrations/omai/lesson-complete
{
  "profile_id": "...",
  "lesson_slug": "daily-routine-a2-01",
  "program_slug": "english-foundations",
  "session_id": "live_session_001",
  "completed_at": "2026-04-06T10:00:00Z"
}
```

This webhook is optional and fire-and-forget — Om AI retains all session and recap truth regardless of Academy webhook status.

---

# 5. Stage 2 → 3: Om AI Consumes Academy Curriculum Manifest (Future)

Academy publishes:

```
GET https://api.tranhatam.com/v1/programs/:slug/curriculum-manifest
```

Om AI curriculum engine may consume this to:

- map lesson recommendations to Academy content slugs
- resolve `next_recommendation` in session recap to an Academy lesson URL
- suggest next lesson after a session ends

Om AI is not required to depend on Academy curriculum for core session functionality. Academy curriculum is supplemental context only.

---

# 6. Auth Model

- Om AI auth: `api.omdala.com` Bearer token (JWT)
- Academy auth: `api.tranhatam.com` (session cookie, Cloudflare Worker)
- In Stage 2: Academy page redirects authenticated users to Om AI for token exchange
- Academy backend never proxies Om AI tokens
- The Om AI client token is held by the browser, not relayed through Academy backend
- SSO bridge design is a Stage 2 decision — not required for Stage 1

---

# 7. Safety and Persona Constraints

These rules from lock documents must be respected in all Academy-integrated sessions:

From `AI_OM_LIVE_API_CONTRACT_V1.md` Section 19:

- quota is enforced server-side only
- child-safe restrictions are resolved before session bootstrap
- moderation may override persona behavior at any time
- every ended session must produce metering finalization

Academy must never:

- bypass persona safety via lesson parameters
- set child-safe flags from the Academy side
- override provider routing via lesson metadata

---

# 8. Implementation Checklist

Stage 1A — Reality layer (LIVE NOW — no Om AI build work needed):

- [x] `POST /v2/reality/approvals/request` — live
- [x] `GET /v2/reality/approvals/:id` — live
- [x] `POST /v2/reality/approvals/:id/confirm` — live (reviewer side)
- [x] `POST /v2/reality/approvals/:id/reject` — live (reviewer side)
- [x] `GET /v2/reality/proofs/:id` — live
- [x] `GET /v2/reality/memory/profile`, `POST /v2/reality/memory/aliases`, `POST /v2/reality/memory/preferences` — live
- [x] `POST /v2/reality/scenes`, `POST /v2/reality/scenes/:id/run`, `GET /v2/reality/runs` — live
- [x] This contract updated to reflect Reality layer

Stage 1B — Live layer (when `/v2/live` backend is operational):

- [ ] Implement `POST /v2/live/lessons/:lesson_id/start` with `program_slug` + `lesson_slug` params
- [ ] Ensure `GET /v2/live/memory/profile` returns `completed_lessons[]` and `weak_areas[]`
- [ ] Add optional webhook dispatch to Academy on lesson session end (fire-and-forget)
- [ ] Document token exchange flow for Academy browser client

Stage 2 → 3 (after Stage 1B stable):

- [ ] Implement curriculum manifest consumption in Om AI curriculum engine
- [ ] Map `next_recommendation` in session recap to Academy lesson URLs
- [ ] Add curriculum path binding to persona lesson planning
