# DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md

**Version**: 1.0
**Status**: TEAM ORGANIZATION & RESPONSIBILITY LOCK
**Scope**: Định nghĩa team structure, ownership, và accountability sau khi tách 2 app
**Date**: April 4, 2026

---

# 1. TEAM STRUCTURE OVERVIEW

```
                      ┌─ Product/Leadership
                      │
      OMDALA Ecosystem
      │
      ├─ Team A: AI Omniverse
      │  ├─ Mobile (iOS/Android)
      │  ├─ Web/Admin Dashboard
      │  └─ Backend Domain Services
      │
      ├─ Team B: Om AI
      │  ├─ Mobile (iOS/Android)
      │  ├─ Web/Admin Dashboard
      │  └─ Backend Domain Services
      │
      └─ Team Platform (Shared)
         ├─ Auth
         ├─ Billing
         ├─ Workspace
         ├─ Provider Routing
         ├─ Infrastructure
         ├─ Security
         └─ Analytics
```

---

# 2. TEAM A — AI OMNIVERSE

## 2.1 Team Lead
- **Role**: Product Lead / Tech Lead for Omniverse
- **Responsibilities**:
  - Own Omniverse roadmap
  - Coordinate across mobile, web, backend
  - Define KPIs for Omniverse
  - Represent Omniverse in cross-team discussions
  - Release planning and QA sign-off

## 2.2 Mobile Squad (iOS + Android)

### iOS Lead
- **Reports to**: Team A Lead
- **Size**: 2-3 engineers
- **Responsibilities**:
  - Room/space dashboard UI
  - Device control UI
  - Scene execution UI
  - Scene builder
  - Voice control UX
  - Onboarding flow
  - Testing on iOS
  - Performance optimization for iOS

### Android Lead
- **Reports to**: Team A Lead
- **Size**: 2-3 engineers
- **Responsibilities**:
  - Same features as iOS
  - Android-specific optimizations
  - Material Design compliance
  - Testing on Android
  - Device compatibility matrix

### Shared Mobile Services (in monorepo but shared)
- API client SDK
- Design system usage
- Auth SDK integration
- Analytics SDK
- Local data persistence layer

## 2.3 Web & Admin Dashboard Squad

### Web/Dashboard Lead
- **Reports to**: Team A Lead
- **Size**: 2 engineers
- **Responsibilities**:
  - Omniverse web app (omniverse.omdala.com)
  - Omniverse admin dashboard
  - Room/device management UI
  - Scene builder web version
  - Reports dashboard
  - Device onboarding wizard
  - Testing and QA

## 2.4 Backend Domain Squad

### Backend Lead
- **Reports to**: Team A Lead
- **Size**: 2-3 engineers
- **Responsibilities**:
  - Device service API
  - Room service API
  - Scene service API
  - Gateway service API
  - Automation service API
  - Physical proof logging
  - Database design & migrations
  - API testing & integration tests

### DevOps/Infrastructure (shared with platform team)
- Cloudflare Workers deployment
- D1 database management
- Monitoring & alerting
- Log aggregation

---

# 3. TEAM B — OM AI

## 3.1 Team Lead
- **Role**: Product Lead / Tech Lead for Om AI
- **Responsibilities**:
  - Own Om AI roadmap
  - Coordinate across mobile, web, backend
  - Define KPIs for Om AI
  - Represent Om AI in cross-team discussions
  - Release planning and QA sign-off
  - Provider integration coordination (with Platform team)

## 3.2 Mobile Squad (iOS + Android)

### iOS Lead
- **Reports to**: Team B Lead
- **Size**: 2-3 engineers
- **Responsibilities**:
  - Live call UI
  - Persona browsing UI
  - Lesson viewer UI
  - Memory/recap UI
  - Family mode UI (parental controls)
  - Avatar/video call UI
  - Recording & transcript UI
  - Testing on iOS
  - Performance optimization for realtime audio

### Android Lead
- **Reports to**: Team B Lead
- **Size**: 2-3 engineers
- **Responsibilities**:
  - Same features as iOS
  - Android-specific optimizations
  - Material Design compliance
  - Testing on Android
  - Device compatibility matrix

### Shared Mobile Services (in monorepo but shared)
- Realtime audio/video SDK wrapper
- API client SDK
- Design system usage
- Auth SDK integration
- Analytics SDK
- Local data persistence

## 3.3 Web & Admin Dashboard Squad

### Web/Dashboard Lead
- **Reports to**: Team B Lead
- **Size**: 2 engineers
- **Responsibilities**:
  - Om AI web app (om-ai.omdala.com)
  - Persona library browsing
  - Lesson catalog UI
  - Progress tracking dashboard
  - Family dashboard
  - School admin panel
  - Business training dashboard
  - Subscription management
  - Testing and QA

## 3.4 Backend Domain Squad

### Backend Lead
- **Reports to**: Team B Lead
- **Size**: 3-4 engineers (due to complexity of realtime + AI)
- **Responsibilities**:
  - Live call service API (or iai.one bridge if using external)
  - Persona service API
  - Memory service API
  - Curriculum service API
  - Family control service API
  - School admin service API
  - Business training service API
  - Usage metering for billing
  - Database design & migrations
  - API testing & integration tests

---

# 4. TEAM PLATFORM — SHARED SERVICES

## 4.1 Platform Lead
- **Role**: Technical Lead for Shared Core
- **Reports to**: CTO / Engineering Manager
- **Responsibilities**:
  - Own shared core services
  - Ensure auth, billing, workspace services are reliable
  - Coordinate with Team A & B on API contracts
  - Security & compliance
  - Observability & monitoring
  - Infrastructure reliability

## 4.2 Auth & Identity Squad

### Auth Lead
- **Reports to**: Platform Lead
- **Size**: 1-2 engineers
- **Responsibilities**:
  - Authentication service (magic link, OAuth, etc)
  - Session management
  - Token refresh logic
  - Authorization checks
  - Audit logging
  - Security patching

## 4.3 Account & Workspace Squad

### Account Lead
- **Reports to**: Platform Lead
- **Size**: 1-2 engineers
- **Responsibilities**:
  - User profile service
  - User preferences service
  - Workspace management
  - Organization identity
  - Member invitations
  - Role management

## 4.4 Billing Squad

### Billing Lead
- **Reports to**: Platform Lead
- **Size**: 2 engineers
- **Responsibilities**:
  - Subscription management service
  - Payment processing (Stripe/PayPal integration)
  - Usage metering & aggregation
  - Invoicing
  - SaaS analytics (ARR, MRR, churn, etc)
  - Team A & B integration support

## 4.5 Provider & Routing Squad

### Provider Routing Lead
- **Reports to**: Platform Lead
- **Size**: 2 engineers
- **Responsibilities**:
  - Provider registry service
  - Provider routing logic
  - Load balancing across providers
  - Provider health checks
  - Provider integration management
  - Fallback logic

## 4.6 Notifications & Analytics Squad

### Observability Lead
- **Reports to**: Platform Lead
- **Size**: 2 engineers
- **Responsibilities**:
  - Notification service
  - Analytics event collection & aggregation
  - Dashboard & reporting
  - Logging infrastructure
  - Error tracking (Sentry, etc)
  - Performance monitoring

## 4.7 Infrastructure & DevOps Squad

### Infrastructure Lead
- **Reports to**: Platform Lead
- **Size**: 1-2 engineers
- **Responsibilities**:
  - Cloudflare Workers deployment
  - D1 database provisioning & management
  - Database migrations
  - CI/CD pipelines
  - Environment management
  - Disaster recovery & backups
  - Cost optimization

---

# 5. RESPONSIBILITIES MATRIX

| Area | Team A (Omniverse) | Team B (Om AI) | Platform | Shared? |
|---|---|---|---|---|
| **Mobile App** | Own | Own | Support | No |
| **Web App** | Own | Own | Support | No |
| **Backend Domain** | Own | Own | - | No |
| **Database (domain)** | Own | Own | - | No |
| **Authentication** | Use | Use | Own | Yes |
| **Account Management** | Use | Use | Own | Yes |
| **Billing** | Integration | Integration | Own | Yes |
| **Provider Routing** | Integration | Integration | Own | Yes |
| **Workspace** | Use | Use | Own | Yes |
| **Notifications** | Integration | Integration | Own | Yes |
| **Analytics** | Integration | Integration | Own | Yes |
| **Design System** | Use | Use | Maintain | Yes |
| **Shared SDKs** | Use | Use | Maintain | Yes |
| **Infrastructure** | Provision | Provision | Manage | Yes |

---

# 6. DECISION AUTHORITY MATRIX

| Decision Type | Who Decides | Input From |
|---|---|---|
| Omniverse roadmap | Team A Lead | Product, Team A |
| Om AI roadmap | Team B Lead | Product, Team B |
| Shared core roadmap | Platform Lead | Product, Team A, Team B |
| Omniverse UX/Design | Team A Lead | Designer (dedicated to Omniverse) |
| Om AI UX/Design | Team B Lead | Designer (dedicated to Om AI) |
| Shared Design System | Platform Lead | Designers from both teams |
| Omniverse release | Team A Lead | QA, Team A, Product |
| Om AI release | Team B Lead | QA, Team B, Product |
| Shared service release | Platform Lead | QA, Platform, Team A, Team B (sign-off) |
| Architecture | CTO | Team Leads |
| Security | CISO | Platform Lead, Team Leads |
| Pricing | Product | Billing Lead (cost input) |

---

# 7. COMMUNICATION PLAN

## 7.1 Regular Sync Cadence

| Meeting | Frequency | Attendees | Duration |
|---|---|---|---|
| Team A standup | Daily | Team A members | 15 min |
| Team B standup | Daily | Team B members | 15 min |
| Platform standup | Daily | Platform team | 15 min |
| Cross-team sync | 2x weekly | Team A lead, Team B lead, Platform lead | 30 min |
| All-hands | Weekly | All engineering | 45 min |
| Architecture review | Weekly | Team leads, CTO | 60 min |
| Product sync | Weekly | Product, Team leads | 60 min |

## 7.2 Documentation Standards

- All decisions documented in Slack + notion database
- Architecture decisions in ADR (Architecture Decision Record) format
- Weekly status updates from each team
- Monthly roadmap reviews

---

# 8. HIRING & RAMP-UP PLAN

## Current Team (MVP Phase)

| Team | Roles | Headcount |
|---|---|---|
| Team A (Omniverse) | iOS, Android, Web, Backend | 6-8 |
| Team B (Om AI) | iOS, Android, Web, Backend | 8-10 |
| Platform | Auth, Billing, Workspace, Infra, DevOps | 5-7 |
| **TOTAL** | - | **19-25** |

## Growth Plan

### Month 2-3: Team Stabilization
- Hire QA engineers (2-3 per team)
- Hire product managers (1 per team)
- Hire dedicated designers

### Month 4-6: Scaling
- Expand backend teams (due to complexity)
- Add DevOps/SRE roles
- Hire security engineer

---

# 9. ONBOARDING CHECKLIST FOR NEW TEAM MEMBERS

### Week 1
- [ ] Access to codebase (GitHub)
- [ ] Access to Slack/Notion
- [ ] Setup local dev environment
- [ ] Read OMDALA ecosystem docs
- [ ] Read OM_AI_AND_AI_OMNIVERSE_SPLIT master plan
- [ ] Meet team lead

### Week 2
- [ ] Understand team's domain (Omniverse or Om AI)
- [ ] Read team's PRD
- [ ] Understand shared core boundaries
- [ ] Pair program with senior engineer

### Week 3
- [ ] Understand current architecture
- [ ] Review recent PRs
- [ ] Setup CI/CD pipeline access

### Week 4
- [ ] Make first PR
- [ ] Understand deployment process
- [ ] Understand testing strategy
- [ ] Attend all team meetings

---

# 10. CONFLICT RESOLUTION

## Cross-Team Disagreements

1. **Technical disagreement** → Architecture review (CTO decides)
2. **API contract disagreement** → Platform lead + both team leads decide
3. **Dependency blocker** → Product + Team leads discuss, escalate if needed
4. **Resource conflict** → Engineering manager allocates

---

# 11. SUCCESS METRICS BY TEAM

## Team A (Omniverse)
- [ ] MVP shipped in 8 weeks
- [ ] 10k DAU (daily active users)
- [ ] Room/device success rate > 99%
- [ ] Mean scene execution latency < 500ms
- [ ] Team velocity stable (velocity trending up)
- [ ] Code quality (test coverage > 70%)

## Team B (Om AI)
- [ ] MVP shipped in 8 weeks
- [ ] 5k DAU
- [ ] Live call success rate > 95%
- [ ] Mean call latency < 200ms
- [ ] Lesson completion rate > 40%
- [ ] Code quality (test coverage > 70%)

## Platform Team
- [ ] Auth service uptime > 99.9%
- [ ] Billing service uptime > 99.9%
- [ ] API response time < 100ms (p99)
- [ ] All shared services documented
- [ ] Security audit passed
- [ ] Cost per request < $0.001

---

# 12. ESCALATION PATH

```
Individual Contributor
  ↓ (blockers, questions)
Team Lead
  ↓ (cross-team issues, architectural decisions)
CTO / Engineering Manager
  ↓ (product strategy, resource conflicts)
Founder / CEO
```

---

# END OF FILE
