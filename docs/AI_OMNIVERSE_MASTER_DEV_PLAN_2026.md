# AI_OMNIVERSE_MASTER_DEV_PLAN_2026.md

**Version**: 2.0
**Status**: FINAL PRODUCT SPECIFICATION & DEVELOPMENT ROADMAP
**Scope**: Complete AI Omniverse product spec, architecture, and MVP roadmap
**Date**: April 4, 2026
**App Name**: AI Omniverse (Device + Environment + Reality Control)
**Team**: Team A (6-8 engineers)

---

# 1. PRODUCT DEFINITION

## 1.1 What is AI Omniverse?

**AI Omniverse** is a mobile + web app that lets users **control their physical spaces** with AI:
- **Smart Home**: Control lights, temperature, appliances, scenes
- **Smart Office**: Manage rooms, booking, devices, status
- **Smart Venue**: Manage scenes, automation, guest experience
- **Voice-Driven**: "Turn off all lights", "Set meeting room to presentation mode"
- **Automated**: Schedules, routines, multi-device orchestration
- **Device-Agnostic**: Works with any manufacturer (Matter, WiFi, Zigbee)

**Core promise**: Control your entire physical environment with one app. Natural language. No friction.

## 1.2 Target Users

| Segment | Persona | Problem |
|---|---|---|
| **Homeowners** | 30-60 with smart home | Multiple apps for each device; clunky UX |
| **Renters** | 25-40 with rentals | Want smart features without expensive setup |
| **Office Managers** | 35-55 managing office | Hard to manage rooms, devices, guest experience |
| **Hotels/Venues** | Properties with guest spaces | Need unified control + guest experience |
| **Facilities Teams** | 10-100 person teams | Complex spaces, multiple floors, automation |

## 1.3 Success Metrics (MVP Phase)

| Metric | Target | Timeline |
|---|---|---|
| **Daily Active Users** | 10,000 | By end of June 2026 |
| **Device control success rate** | > 99% | From day 1 |
| **Scene execution success** | > 98% | From day 1 |
| **Average session length** | 5-10 min | Baseline for June |
| **D1 retention** | > 40% | By month 2 |
| **Device onboarding success** | > 95% | From day 1 |
| **NPS** | > 50 | By month 3 |

---

# 2. MVP SCOPE (PHASE O1 — JUNE 1, 2026)

## 2.1 Core Features

### Home/Space Management (Week 1-2)
- ✅ Create home / office / space
- ✅ Add rooms (living room, kitchen, bedroom, meeting rooms, etc)
- ✅ Set location (address for weather, geofencing)
- ✅ Upload floorplan (optional)
- ✅ Invite family members / team

### Device Onboarding (Week 2-3)
- ✅ Add devices via:
  - QR code scan
  - Manual pairing
  - WiFi discovery
- ✅ Support 5-10 device types:
  - Smart lights (Philips Hue, LIFX, Matter)
  - Thermostats (Nest, Ecobee, Matter)
  - Plugs/outlets (Sonos, TP-Link, Matter)
  - Locks (Yale, Level, Matter)
  - Cameras (Wyze, Logitech)
  - Speakers (Echo, Google Home)
- ✅ Device status dashboard
- ✅ Real-time status updates

### Device Control (Week 3-4)
- ✅ Control individual devices:
  - Lights: on/off, brightness, color
  - Temperature: set point
  - Plugs: on/off
  - Locks: lock/unlock
- ✅ Device details screen (status, power, battery)
- ✅ Favorite devices (quick access)

### Scenes (Week 4-5)
- ✅ Create scenes (Good Morning, Movie Time, Away, Goodnight, etc)
- ✅ Scene builder UI:
  - Add devices to scene
  - Set desired state (lights on/off, brightness, color)
  - Set sequence/delay
- ✅ Execute scene with one tap
- ✅ Voice control scene ("Turn on Movie Time")

### Room Dashboard (Week 2-4)
- ✅ Room overview:
  - Devices in room
  - Current status (lights on, temp, etc)
  - Quick controls
- ✅ Room-level control (turn off all lights in room)
- ✅ Room automation setup (future)

### Automation Basics (Week 5-6)
- ✅ Simple automations:
  - Time-based (7am = turn on lights)
  - Presence-based (arrive home = turn on entrance lights)
  - Sensor-based (motion = turn on light)
- ✅ Automation UI (create, edit, delete)

### Push Notifications (Week 4-5)
- ✅ Device alerts (door unlocked, smoke alert)
- ✅ Scene reminders (bedtime reminder)
- ✅ Status changes (lights left on)

### Analytics & Logging (Week 5-6)
- ✅ Activity log (who did what, when)
- ✅ Device usage stats
- ✅ Energy insights (basic)
- ✅ Reports UI (what happened)

### Authentication (Week 1)
- ✅ Reuse shared auth (magic link / OAuth)
- ✅ Session persistence
- ✅ Profile = name + avatar + email

## 2.2 NOT in MVP

❌ Complex automation (if-then-else, custom rules)
❌ Machine learning (smart schedules)
❌ Energy optimization
❌ Geofencing automation
❌ Matter support (start with WiFi/Zigbee only)
❌ Offline control
❌ Voice assistant integration (Alexa, Google)
❌ Multi-property support

---

# 3. TECHNICAL ARCHITECTURE

## 3.1 Stack Selection

### Frontend (Mobile)

**iOS**:
- Language: Swift + SwiftUI
- Package manager: CocoaPods or SPM
- Networking: URLSession + async/await
- BLE: Core Bluetooth (for pairing)
- State management: Combine or MVVM
- Local persistence: Core Data
- Testing: XCTest

**Android**:
- Language: Kotlin
- Build: Gradle
- Networking: Retrofit + OkHttp
- BLE: Bluetooth Low Energy APIs
- State management: ViewModel + StateFlow
- Local persistence: Room
- Testing: JUnit + Mockito

### Frontend (Web)

- Framework: React 18 + TypeScript or Next.js
- UI: Tailwind CSS or Material Design
- State: React Query + Zustand or Redux
- Real-time: WebSockets for live status
- Build: Vite or Next.js
- Testing: Vitest + React Testing Library

### Backend

- Runtime: Cloudflare Workers (light API) + Node.js (gateway/heavy compute)
- Database: D1 (Cloudflare) for core, external DB for device state
- Real-time: WebSockets (Cloudflare Durable Objects) for live updates
- Device Gateway: Custom service (Node.js or Rust) for device communication
- Message Queue: (optional for Phase O2)
- Cache: Cloudflare KV for device state cache

### Infra & DevOps

- Deployment: Cloudflare Pages (frontend) + Workers (API) + managed VM (gateway)
- CI/CD: GitHub Actions
- Monitoring: Wrangler logs + custom monitoring
- Secrets: Cloudflare secret manager
- Device Communication: MQTT or CoAP to devices

## 3.2 API Contracts (MVP)

### Authentication (Shared Core)
```
POST /v1/auth/login — magic link / OAuth
GET /v1/auth/session — current session
POST /v1/auth/logout
```

### Home/Space Management
```
POST /v2/omniverse/homes
  { name, location, type }
  → { id, name, createdAt }

GET /v2/omniverse/homes
  → [ { id, name, devices: [] } ]

POST /v2/omniverse/homes/:homeId/rooms
  { name, type, floorplan }

GET /v2/omniverse/homes/:homeId/rooms
  → [ { id, name, devices: [] } ]
```

### Device Management
```
POST /v2/omniverse/devices/discover
  { homeId, roomId, deviceType }
  → [ { id, name, type, status } ]

POST /v2/omniverse/devices
  { homeId, roomId, name, type, config }
  → { id, name, status }

GET /v2/omniverse/devices/:deviceId
  → { id, name, type, state, battery, lastSeen }

POST /v2/omniverse/devices/:deviceId/control
  { action, params }
  → { ok, newState }
```

### Scenes
```
POST /v2/omniverse/scenes
  { homeId, name, description, steps: [...] }
  → { id, name }

GET /v2/omniverse/scenes/:homeId
  → [ { id, name, deviceCount } ]

POST /v2/omniverse/scenes/:sceneId/execute
  → { ok, results: [] }
```

### Automation (Phase O2)
```
POST /v2/omniverse/automations
  { homeId, trigger, actions }

GET /v2/omniverse/automations/:homeId
  → [ { id, name, enabled, lastRun } ]
```

### Real-time Status (WebSocket)
```
WS /v2/omniverse/ws?token=...
  Subscribe to device updates:
  { type: "device-update", deviceId, state }
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

-- AI Omniverse specific

homes {
  id, ownerId, name, location, type (home|office|venue),
  floorplan_url, timezone, createdAt
}

rooms {
  id, homeId, name, type, floor, floorplan_coords,
  createdAt
}

devices {
  id, homeId, roomId, name, type, manufacturer,
  model, status, battery, lastSeen, config,
  createdAt
}

device_state_history {
  id, deviceId, state, timestamp
}

scenes {
  id, homeId, name, description, steps (JSON),
  createdAt
}

scene_executions {
  id, sceneId, executedAt, results (JSON)
}

automations {
  id, homeId, name, trigger, actions (JSON),
  enabled, lastRun, createdAt
}

activity_log {
  id, homeId, actor, action, target, timestamp
}

home_members {
  id, homeId, userId, role (owner|admin|member),
  joinedAt
}

home_invites {
  id, homeId, email, role, token, expiresAt
}

usage_events {
  id, homeId, eventType (device-control|scene-execute), timestamp
}
```

## 3.4 Integration Points

### With Shared Core
- ✅ Auth (login, session)
- ✅ Billing (subscriptions, usage metering)
- ✅ Workspace (homes as workspace entities)
- ✅ Notifications (device alerts)
- ✅ Analytics (device control events)

### With External Services
- ✅ **Device Manufacturers** (Philips, LIFX, Nest, etc via their APIs)
- ✅ **Matter Alliance** (future, for Matter devices)
- ✅ **Weather API** (for environmental context)
- ✅ **Payment** (Stripe/PayPal via shared billing)

---

# 4. TEAM & OWNERSHIP (FROM BATCH S1)

## 4.1 Team A Structure

| Role | Count | Owner | Responsibilities |
|---|---|---|---|
| **Team Lead** | 1 | [TBD] | Roadmap, releases, team coordination |
| **iOS Lead** | 2 | [TBD] | iOS app, device control UX, tests |
| **Android Lead** | 2 | [TBD] | Android app, device control UX, tests |
| **Web Lead** | 1 | [TBD] | Web app, dashboard, responsive design |
| **Backend Lead** | 1-2 | [TBD] | Device service, scene service, automation, gateway |
| **DevOps** | 0.5 (shared) | Platform team | Deployment, monitoring |

**Total**: 6-8 engineers

## 4.2 Cross-Team Dependencies

- **Platform Auth Team**: Provides auth SDK + session management
- **Platform Billing Team**: Provides billing SDK + metering
- **Device Manufacturers**: APIs for device communication

---

# 5. DEVELOPMENT ROADMAP

## Phase O1 — Device Control MVP (Weeks 1-8)

### Sprint 1 (Week 1)
- [ ] Auth integration (shared core)
- [ ] Project setup (mobile, web, backend)
- [ ] Database schema + migrations
- [ ] Home/room management API

### Sprint 2 (Week 2)
- [ ] Device discovery + pairing backend
- [ ] iOS device discovery UI
- [ ] Android device discovery UI
- [ ] Web add device flow

### Sprint 3 (Week 3)
- [ ] Device state management
- [ ] Real-time status updates (WebSocket)
- [ ] Device control API (on/off, brightness, etc)
- [ ] Device dashboard UI (all platforms)

### Sprint 4 (Week 4)
- [ ] Room management UI
- [ ] Room-level controls
- [ ] Push notifications (device alerts)
- [ ] Activity logging

### Sprint 5 (Week 5)
- [ ] Scene builder backend
- [ ] Scene builder UI (web first)
- [ ] Scene execution (multi-device)
- [ ] Scene UI on mobile

### Sprint 6 (Week 6)
- [ ] Automation basics (time, presence, sensor)
- [ ] Automation UI
- [ ] Analytics instrumentation
- [ ] Testing (unit + integration)

### Sprint 7 (Week 7)
- [ ] Performance optimization
- [ ] Security audit (device credentials)
- [ ] Accessibility review
- [ ] QA testing cycle 1

### Sprint 8 (Week 8)
- [ ] Bug fixes from QA
- [ ] Documentation (API, deployment)
- [ ] Team handbook
- [ ] Staging deployment

## Phase O2 — Advanced Device Support (Weeks 9-14)
- Matter support
- More device types
- Complex automation (if-then-else)
- Device groups
- Geofencing automation

## Phase O3 — Automation & Intelligence (Weeks 15-20)
- Schedule learning
- Predictive automation
- Energy optimization
- Multi-property support
- Enterprise features

## Phase O4 — Advanced Reality (Weeks 21+)
- Full device graph
- AI-driven suggestions
- Custom integrations
- Open API for 3rd party
- Enterprise orchestration

---

# 6. MVP LAUNCH CHECKLIST

### Backend Readiness
- [ ] All APIs tested (unit + integration)
- [ ] Device communication stable
- [ ] Database backups automated
- [ ] Secrets rotation policy
- [ ] Rate limiting + DDoS protection
- [ ] Error handling verified

### Mobile Readiness
- [ ] iOS tested on iOS 15+
- [ ] Android tested on Android 10+
- [ ] BLE pairing stable
- [ ] Battery consumption acceptable
- [ ] Crash reporting (Sentry)
- [ ] Push notifications reliable

### Web Readiness
- [ ] Responsive design
- [ ] Browser compatibility
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Performance (Lighthouse > 80)
- [ ] Real-time updates stable

### Ops Readiness
- [ ] Monitoring + alerting configured
- [ ] Runbook written
- [ ] On-call schedule
- [ ] SLA targets defined
- [ ] Disaster recovery tested

### Product Readiness
- [ ] Success metrics dashboard
- [ ] User feedback process
- [ ] Bug triage
- [ ] Release notes
- [ ] Marketing ready

---

# 7. SUCCESS CRITERIA

### Technical
- ✅ 0 critical bugs on day 1
- ✅ > 99% device control success
- ✅ < 500ms command latency
- ✅ 99.9% uptime

### Product
- ✅ 10,000 DAU by June 30
- ✅ > 40% D1 retention
- ✅ > 95% device onboarding success
- ✅ > 50 NPS

### Team
- ✅ Organized & roles clear
- ✅ Velocity > 15 story points/sprint
- ✅ Code review turnaround < 24 hours
- ✅ Incident response < 1 hour

---

# 8. RISKS & MITIGATION

| Risk | Impact | Mitigation |
|---|---|---|
| Device API unavailable | Can't control | Multiple manufacturer support; local fallback |
| Connectivity issues | Poor UX | Offline queue + retry logic |
| Scaling to 10k DAU | Outages | Load testing week 6; auto-scaling |
| Security (device hijack) | Critical | Encryption; auth token rotation |
| Team turnover | Schedule slip | Hiring buffer; mentorship |

---

# 9. BUDGET & RESOURCE ESTIMATES

| Item | Cost/Month | Notes |
|---|---|---|
| Cloudflare Workers + D1 | $500-1500 | Scales with traffic |
| Gateway Infrastructure | $1000-3000 | Device communication |
| Device APIs | $500-2000 | Per manufacturer |
| Monitoring | $200-500 | Datadog, Sentry, etc |
| Testing | $0 | Internal |
| **TOTAL** | ~$2200-7000 | Scales with success |

**Team Cost**: ~$140k-190k/month (6-8 engineers)

---

# 10. GO-LIVE READINESS

### Prerequisites
- [ ] Batch S1 sign-off complete
- [ ] Batch S2 complete (all master plans)
- [ ] Shared core services ready
- [ ] Team assembled & onboarded
- [ ] Dev environment functional
- [ ] CI/CD pipeline tested
- [ ] Monitoring ready

### Launch Plan
- **Closed Beta**: Week 6-7 (select 100 users)
- **Open Beta**: Week 7-8 (first 1000 users)
- **Public Launch**: June 1, 2026
- **Growth Phase**: June-Aug (scale to 10k DAU)

---

# 11. HANDOFF TO PRODUCT

Once Batch S2 (this plan) is complete:

1. **Approval Needed**:
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
