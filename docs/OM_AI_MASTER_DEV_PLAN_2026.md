# OM_AI_MASTER_DEV_PLAN_2026.md

**Version**: 2.0
**Status**: FINAL PRODUCT SPECIFICATION & DEVELOPMENT ROADMAP
**Scope**: Complete Om AI product spec, architecture, and MVP roadmap
**Date**: April 4, 2026
**App Name**: Om AI (AI Human Call + Learning + Communication)
**Team**: Team B (8-10 engineers)

---

# 1. PRODUCT DEFINITION

## 1.1 What is Om AI?

**Om AI** is a mobile + web app that lets users **call an AI person** for:
- **Learning**: English, languages, any subject
- **Communication**: public speaking, writing, conversation practice
- **Companionship**: listening, reflection, support
- **Business**: sales roleplay, receptionist training, team coaching
- **Family**: parent-guided learning for kids, family growth

**Core promise**: Talk to AI like a real person. Learn from a real teacher. Grow at your own pace.

## 1.2 Target Users

| Segment | Persona | Problem |
|---|---|---|
| **Students** | 13-25 year old learners | No affordable 1-on-1 tutor; shy to speak English |
| **Professionals** | 25-45 working adults | Need business communication skill; limited time |
| **Parents** | 30-55 with kids | Want safe AI learning for children; cost of tutors |
| **Teams** | 5-500 person companies | Sales training, customer service, internal comms |
| **Schools** | 100-5000 student institutions | Supplemental learning platform; teacher shortage |

## 1.3 Success Metrics (MVP Phase)

| Metric | Target | Timeline |
|---|---|---|
| **Daily Active Users** | 5,000 | By end of June 2026 |
| **Live call success rate** | > 95% | From day 1 |
| **Average session length** | 15 min | Baseline for June |
| **D1 retention** | > 30% | By month 2 |
| **D7 retention** | > 15% | By month 2 |
| **Free to paid conversion** | > 5% | By month 3 |
| **NPS** | > 40 | By month 3 |

---

# 2. MVP SCOPE (PHASE A1 — JUNE 1, 2026)

## 2.1 Core Features

### Live Voice Call (Week 1-3)
- ✅ User initiates call to AI persona
- ✅ WebRTC/realtime audio (via iai.one or similar provider)
- ✅ AI responds with speech synthesis
- ✅ Call duration tracked (for billing)
- ✅ Call ends after 30 minutes (free tier limit) or when user taps end
- ✅ Recording + transcription (optional)

### Persona Library (Week 2-4)
- ✅ 3 initial personas:
  - **English Teacher** — teaches English, conversation, pronunciation
  - **Business Coach** — helps with presentations, sales, communication
  - **Wellness Companion** — listening, reflection, light guidance
- ✅ Persona card with:
  - Name, avatar, bio, expertise, specialties
  - Start call button
  - Rating + reviews
- ✅ Browse all personas in grid/list view

### Recap & Summary (Week 3-4)
- ✅ After each call:
  - Auto-generated transcript
  - Key topics discussed
  - Suggested next steps / homework
  - Option to save to library
- ✅ Access past recaps in "My Calls" section

### Subscription & Billing (Week 2-3)
- ✅ Free tier:
  - 30 min/day unlimited calls
  - Limited to 3 personas
  - No advanced features
- ✅ Pro tier ($9.99/month):
  - Unlimited calls
  - All personas
  - Advanced transcript export
  - Priority queue
- ✅ In-app purchase flow (iOS + Android)
- ✅ Web subscription management

### Authentication (Week 1)
- ✅ Reuse shared auth (magic link / OAuth)
- ✅ Session persistence
- ✅ Profile = name + avatar + email

### Analytics & Instrumentation (Week 4)
- ✅ Track: call start, call end, persona selected, call duration, error
- ✅ Send to shared analytics service

## 2.2 NOT in MVP

❌ Video calls (avatar)
❌ Custom personas
❌ Family/school modes
❌ Lesson curriculum
❌ Offline mode
❌ Conversation history with same persona
❌ Scheduled calls

---

# 3. TECHNICAL ARCHITECTURE

## 3.1 Stack Selection

### Frontend (Mobile)

**iOS**:
- Language: Swift + SwiftUI
- Package manager: CocoaPods or SPM
- Networking: URLSession + async/await
- Audio: AVFoundation + WebRTC SDK
- State management: Combine or MVVM
- Testing: XCTest

**Android**:
- Language: Kotlin
- Build: Gradle
- Networking: Retrofit + OkHttp
- Audio: ExoPlayer + WebRTC SDK
- State management: ViewModel + StateFlow
- Testing: JUnit + Mockito

### Frontend (Web)

- Framework: React 18 + TypeScript
- UI: Tailwind CSS or Material Design
- State: React Query + Zustand or Redux
- Audio: Web Audio API + WebRTC
- Build: Vite or Next.js
- Testing: Vitest + React Testing Library

### Backend

- Runtime: Cloudflare Workers (or Node.js if high CPU)
- Database: D1 (Cloudflare) for core, external DB for large data
- Real-time: WebRTC SFU (or trickle-ICE relay)
- AI Provider: iai.one or similar API
- Message Queue: (optional for Phase A2)
- Cache: Cloudflare KV

### Infra & DevOps

- Deployment: Cloudflare Pages (frontend) + Workers (backend)
- CI/CD: GitHub Actions
- Monitoring: Wrangler logs + Cloudflare Analytics
- Secrets: Cloudflare secret manager

## 3.2 API Contracts (MVP)

### Authentication (Shared Core)
```
POST /v1/auth/login — magic link / OAuth
GET /v1/auth/session — current session
POST /v1/auth/logout
```

### Live Call Service
```
POST /v1/live/call/start
  { personaId, callbackUrl }
  → { callToken, sipUri, iceServers }

POST /v1/live/call/end
  { callId, duration, recordingId? }

GET /v1/live/personas
  → [ { id, name, avatar, bio, rate } ]

GET /v1/live/recap/:callId
  → { transcript, summary, nextSteps }

POST /v1/live/recap/save
  { callId, label }
```

### Subscription (Shared Core via /v1/billing)
```
POST /v1/billing/subscriptions
  { appId: "om-ai", planId: "om-ai-pro" }

GET /v1/billing/subscriptions
  → [ { id, status, expiresAt, planId } ]

GET /v1/billing/usage
  → { callMinutes, callsToday, quotaRemaining }
```

## 3.3 Data Model

### Core Tables

```sql
-- Users (shared)
users { id, email, displayName }

-- Sessions (shared)
sessions { id, userId, jwt, expiresAt }

-- Subscriptions (shared)
subscriptions { id, userId, appId, planId, status, expiresAt }

-- Om AI specific

personas {
  id, name, avatar, bio, expertise,
  speakingStyle, responseSpeed, createdAt
}

calls {
  id, userId, personaId, startedAt, endedAt,
  duration, recordingId, transcriptId, status
}

transcripts {
  id, callId, text, tokens, generatedAt
}

recaps {
  id, callId, summary, keyTopics, nextSteps, savedAt
}

usage_events {
  id, userId, callId, eventType (start|end|error), timestamp
}
```

## 3.4 Integration Points

### With Shared Core
- ✅ Auth (login, session)
- ✅ Billing (subscriptions, usage metering)
- ✅ Workspace (if family/school later)
- ✅ Notifications (call reminders, tips)
- ✅ Analytics (events)

### With External Services
- ✅ **iai.one** (AI speech synthesis + speech recognition)
- ✅ **WebRTC provider** (Twilio, Agora, or custom SFU)
- ✅ **Payment** (Stripe/PayPal via shared billing)
- ✅ **Email** (Mailgun or similar for receipts)

---

# 4. TEAM & OWNERSHIP (FROM BATCH S1)

## 4.1 Team B Structure

| Role | Count | Owner | Responsibilities |
|---|---|---|---|
| **Team Lead** | 1 | [TBD] | Roadmap, releases, team coordination |
| **iOS Lead** | 2-3 | [TBD] | iOS app, audio UX, tests |
| **Android Lead** | 2-3 | [TBD] | Android app, audio UX, tests |
| **Web Lead** | 1-2 | [TBD] | Web app, dashboard, responsive design |
| **Backend Lead** | 2-3 | [TBD] | Live service, persona service, API |
| **DevOps** | 0.5 (shared) | Platform team | Deployment, monitoring |

**Total**: 8-10 engineers

## 4.2 Cross-Team Dependencies

- **Platform Auth Team**: Provides auth SDK + session management
- **Platform Billing Team**: Provides billing SDK + metering
- **External AI Provider** (iai.one): Provides live call capability

---

# 5. DEVELOPMENT ROADMAP

## Phase A1 — Live Call MVP (Weeks 1-8)

### Sprint 1 (Week 1)
- [ ] Auth integration (shared core)
- [ ] Project setup (mobile, web, backend)
- [ ] Database schema + migrations
- [ ] Basic API skeleton

### Sprint 2 (Week 2)
- [ ] Live call backend (start/end, token generation)
- [ ] WebRTC signaling
- [ ] iOS audio setup (AVFoundation)
- [ ] Android audio setup (ExoPlayer)

### Sprint 3 (Week 3)
- [ ] Persona service (3 personas hardcoded)
- [ ] Web app shell + routing
- [ ] Mobile app shell + routing
- [ ] Subscription integration

### Sprint 4 (Week 4)
- [ ] Live call UI (iOS, Android, Web)
- [ ] Persona browsing UI
- [ ] Call recording + transcription
- [ ] Error handling + logging

### Sprint 5 (Week 5)
- [ ] Recap generation (summary, topics, next steps)
- [ ] Recap UI
- [ ] Analytics instrumentation
- [ ] Testing (unit + integration)

### Sprint 6 (Week 6)
- [ ] Performance optimization (audio latency, memory)
- [ ] Security audit (tokens, payment data)
- [ ] Accessibility review
- [ ] QA testing cycle 1

### Sprint 7 (Week 7)
- [ ] Bug fixes from QA
- [ ] Documentation (API, deployment)
- [ ] Team handbook
- [ ] Staging deployment

### Sprint 8 (Week 8)
- [ ] Final QA cycle
- [ ] Load testing
- [ ] Soft launch / beta
- [ ] Monitoring setup

## Phase A2 — Family + Learning (Weeks 9-14)
- Parent controls
- Child profiles
- Lesson paths
- English + multi-language
- Family dashboard
- School mode introduction

## Phase A3 — School + Business (Weeks 15-20)
- School admin UI
- Teacher assignment
- Business personas (receptionist, sales trainer)
- Team training dashboard
- Org analytics

## Phase A4 — Advanced Personalization (Weeks 21+)
- Custom persona builder
- BYO API integration
- Provider routing expansion
- Expert marketplace

---

# 6. MVP LAUNCH CHECKLIST

### Backend Readiness
- [ ] All APIs tested (unit + integration)
- [ ] Database backups automated
- [ ] Secrets rotation policy in place
- [ ] Rate limiting configured
- [ ] Error handling + logging verified

### Mobile Readiness
- [ ] iOS app tested on iOS 15+
- [ ] Android app tested on Android 10+
- [ ] Audio quality verified
- [ ] Offline handling tested
- [ ] Push notifications working
- [ ] Crash reporting (Sentry) integrated

### Web Readiness
- [ ] Responsive design (mobile + tablet + desktop)
- [ ] Browser compatibility (Safari, Chrome, Firefox, Edge)
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Performance (Lighthouse > 80)
- [ ] Analytics events tracked

### Ops Readiness
- [ ] Monitoring + alerting configured
- [ ] Runbook written (deployment, rollback, incident response)
- [ ] On-call schedule established
- [ ] SLA/uptime targets defined
- [ ] Disaster recovery tested

### Product Readiness
- [ ] Success metrics dashboard
- [ ] User feedback process
- [ ] Bug triage process
- [ ] Release notes prepared
- [ ] Marketing collateral ready

---

# 7. SUCCESS CRITERIA

### Technical
- ✅ 0 critical bugs on day 1
- ✅ < 5% error rate on calls
- ✅ < 200ms latency for call start
- ✅ 99.9% uptime

### Product
- ✅ 5,000 DAU by end of June
- ✅ > 30% D1 retention
- ✅ > 5% free-to-paid conversion
- ✅ > 40 NPS

### Team
- ✅ Team organized & roles clear
- ✅ Development velocity > 15 story points/sprint
- ✅ Code review turnaround < 24 hours
- ✅ Incident response < 1 hour

---

# 8. RISKS & MITIGATION

| Risk | Impact | Mitigation |
|---|---|---|
| Audio latency too high | Lost users | Latency testing week 2; pivot provider if needed |
| Persona AI quality low | Low retention | Work with iai.one on prompt engineering; A/B test personas |
| Payment integration fails | Revenue = 0 | Shared billing team owns; parallel testing |
| Team turnover | Schedule slip | Hiring buffer; senior mentorship |
| Scaling issues | Outages | Load testing week 6; auto-scaling setup |

---

# 9. BUDGET & RESOURCE ESTIMATES

| Item | Cost/Month | Notes |
|---|---|---|
| Cloudflare Workers + D1 | $500-1000 | Scales with traffic |
| WebRTC/Audio Provider | $2000-5000 | Per 100k min/month |
| Payment processor | $500-1000 | Stripe/PayPal fees |
| Monitoring + Logging | $200-500 | Sentry, Datadog, etc |
| Mobile app distribution | $0 | App Store, Google Play |
| **TOTAL** | ~$3500-7500 | Scales with success |

**Team Cost**: ~$200k-250k/month (8-10 engineers at market rate)

---

# 10. GO-LIVE READINESS

### Prerequisites Before Launch
- [ ] Batch S1 sign-off complete (architecture locked)
- [ ] Batch S2 complete (all master plans written)
- [ ] Shared core services ready (auth, billing, analytics)
- [ ] Team assembled & onboarded
- [ ] Development environment fully functional
- [ ] CI/CD pipeline tested
- [ ] Monitoring infrastructure ready

### Launch Plan
- **Closed Beta**: Week 6-7 (select 100 users)
- **Open Beta**: Week 7-8 (first 1000 users)
- **Public Launch**: June 1, 2026
- **Growth Phase**: June-Aug (scale to 5k DAU)

---

# 11. HANDOFF TO PRODUCT

Once Batch S2 (this plan) is complete:

1. **Approval Needed From**:
   - Product Lead (feature scope)
   - CTO (architecture)
   - Billing Lead (pricing viability)

2. **Sign-off Template**:
   ```
   [ ] Product Lead: Feature scope & roadmap OK
   [ ] CTO: Architecture & team size OK
   [ ] Billing: Pricing & monetization OK
   [ ] [Team Lead]: Ready to build
   ```

3. **Next Step**: Code migration + development starts (April 16)

---

# END OF FILE

**Author**: Architecture / Product
**Last Updated**: April 4, 2026
**Status**: Ready for team to code against
