# TEAM_COORDINATION_GUIDE_2026.md

**Phiên bản**: 1.0
**Trạng thái**: HƯỚNG DẪN PHỐI HỢP GIỮA CÁC TEAMS
**Ngày**: April 4, 2026
**Phạm vi**: Team A, Team B, Team Platform - Làm việc song song từ April 16 - June 1

---

# 1. TEAM STRUCTURE & RESPONSIBILITIES

## 1.1 Team A — AI Omniverse (6-8 engineers)

**Focus**: Device + Environment Control
**Owner**: [Team Lead Name]
**Slack Channel**: `#team-omniverse`
**GitHub Team**: `@team-a-omniverse`

### Sub-teams
```
Team A
├─ iOS (2-3 engineers) — Swift, CoreBluetooth, device pairing
├─ Android (2-3 engineers) — Kotlin, BLE APIs
├─ Web (1 engineer) — React 18, device dashboard
└─ Backend (1-2 engineers) — Device service, gateway, WebSocket

Daily Standup: 9:00 AM
Weekly Sync: Tuesday 2 PM
```

---

## 1.2 Team B — Om AI (8-10 engineers)

**Focus**: AI Human Call + Learning + Communication
**Owner**: [Team Lead Name]
**Slack Channel**: `#team-om-ai`
**GitHub Team**: `@team-b-om-ai`

### Sub-teams
```
Team B
├─ iOS (2-3 engineers) — Swift, WebRTC, audio
├─ Android (2-3 engineers) — Kotlin, ExoPlayer, WebRTC
├─ Web (1-2 engineers) — React 18, call interface
└─ Backend (2-3 engineers) — Call service, persona, recap, iai.one integration

Daily Standup: 9:15 AM
Weekly Sync: Tuesday 2:45 PM
```

---

## 1.3 Team Platform — Shared Core (5-7 engineers)

**Focus**: Auth, Billing, Workspace, Provider Router, Notifications, Analytics, Account, Design System
**Owner**: [Platform Lead Name]
**Slack Channel**: `#team-platform`
**GitHub Team**: `@team-platform`

### Services
```
Team Platform
├─ Auth (1-2) — JWT, sessions, OAuth
├─ Billing (1-2) — Stripe integration, usage metering
├─ Workspace (1) — Org identity, families, schools
├─ Provider Router (1) — Capability-based routing
├─ Notifications & Analytics (1) — Events, metrics
├─ Account (0.5) — User profiles, preferences
└─ Design System (0.5) — UI tokens, components, shared CSS

Daily Standup: 9:30 AM
Weekly Sync: Tuesday 3:30 PM
```

---

## 1.4 Leadership

```
CTO / VP Engineering — [Name]
├─ Oversees: Architecture, quality gates, blockers
├─ Slack: `@cto-on-call`
├─ Availability: Always reachable for critical issues

Product Lead — [Name]
├─ Oversees: Feature priority, scope, user impact
├─ Slack: `@product-lead`

Project Manager — [Name]
├─ Oversees: Timeline, velocity, Jira status
├─ Slack: `@pm`

Engineering Manager — [Name]
├─ Oversees: Team health, hiring, performance
├─ Slack: `@eng-manager`
```

---

# 2. COMMUNICATION CADENCE

## 2.1 Daily Communication

### Morning Standup (per team, 15 min)

| Team | Time | Duration | Host |
|---|---|---|---|
| **Team A** | 9:00 AM | 15 min | Team A Lead |
| **Team B** | 9:15 AM | 15 min | Team B Lead |
| **Team Platform** | 9:30 AM | 15 min | Platform Lead |

**Format**:
```markdown
## Standup - Team A (April 16, 2026, 9:00 AM)

### Yesterday
✅ iOS device pairing UI working
✅ Backend device discovery API tested
⏳ Real-time WebSocket (in progress)

### Today
👉 Complete WebSocket real-time updates
👉 Start room management UI
👉 Code review + merge PRs

### Blockers
None

### Metrics
- Commits: 14
- PRs: 3
- Tests: 100% pass
- Build: ✅
```

### Slack #dev-standup (async)
```
Post standup status after your team's meeting:
@team-a-omniverse: [as above]
@team-b-om-ai: [...]
@team-platform: [...]
```

### Slack #dev-blockers (urgent)
```
If blocker found during day:
[9:45 AM] @cto @team-a-lead: Device manufacturer API returning 500, blocking device discovery. [link to issue]
[9:47 AM] @cto: Investigating with Philips Hue team, will update in 30 min
[10:15 AM] @cto: Fixed on their side, we're good to continue
```

---

## 2.2 Weekly Communication

### Weekly Tech Sync (Cross-team, 45 min)
**Time**: Tuesday 2:00 PM
**Attendees**: Team A Lead, Team B Lead, Platform Lead, CTO
**Location**: Zoom + #dev-tech-sync

**Agenda**:
```markdown
1. Shared Core Status (10 min)
   - Auth service: Completed ✅
   - Billing service: 80% done
   - Any blockers for Team A/B?

2. Cross-team Dependencies (15 min)
   - Team A needs X from Platform by Friday?
   - Team B needs Y from Team A?
   - Coordination points?

3. Velocity Check (10 min)
   - Team A: 28/30 points (94% capacity)
   - Team B: 35/40 points (87% capacity)
   - Platform: 20/22 points (91% capacity)
   - Any risks to sprint goal?

4. Performance & Quality (10 min)
   - Test coverage trends
   - Build time (aiming for <2 min)
   - Staging deployment status
   - Any new architectural issues?
```

### Weekly All-Hands (Product + Engineering, 30 min)
**Time**: Friday 4:00 PM
**Attendees**: Everyone (all engineers, leads, product, leadership)
**Format**: Show + Tell + Wins

```markdown
## All-Hands - April 19, 2026

### Wins This Week 🎉
- Team A: Device discovery working end-to-end!
- Team B: Live calls connected successfully (first time!)
- Team Platform: Auth service deployed to production
- Special shoutout: [Engineer name] for 15 PRs in 1 week

### Progress Update
- Overall: 25 story points completed (target: 25-30) ✅
- Timeline: On track for June 1 launch
- Quality: All tests passing, 0 critical bugs

### Demo (5 min per team)
- Team A: [Show device control demo on phone]
- Team B: [Show live call demo on laptop]
- Team Platform: [Show metrics dashboard]

### Next Week Goals
- Team A: Start scene builder
- Team B: Add transcript generation
- Platform: Deploy Billing service

### Upcoming Events
- April 20: Sprint 1 retrospective (team only)
- April 23: Sprint 2 planning
- April 30: Halfway milestone check
```

---

# 3. DEPENDENCY MANAGEMENT

## 3.1 Shared Core Dependencies

**Shared Core MUST be delivered before teams can proceed:**

| Service | Needed By | Deadline | Status |
|---|---|---|---|
| **Auth** | Team A + Team B | Week 1 (April 20) | 🟢 In progress |
| **Billing** | Team A + Team B | Week 2 (April 27) | 🟡 Planned |
| **Workspace** | Team A + Team B | Week 2 (April 27) | 🟡 Planned |
| **Provider Router** | Team A | Week 2 (April 27) | 🟡 Planned |
| **Notifications** | Team A + Team B | Week 3 (May 4) | 🟡 Planned |
| **Analytics** | Team A + Team B | Week 4 (May 11) | 🟡 Planned |
| **Design System** | Team A + Team B | Week 1 (April 20) | 🟢 In progress |

**If a service is late** → CTO alerts both teams immediately

---

## 3.2 Inter-team Dependencies

### Team A ↔ Team B
```
Mostly INDEPENDENT (good!)

Only shared dependency:
- Shared Core services (Auth, Billing)
- Design System (UI components)
```

### Team A ↔ Team Platform
```
Team A depends on Platform for:
- Auth service (Week 1)
- Billing service (Week 2)
- Design System (Week 1)
- Provider Router (Week 2) — for device manufacturer APIs

Platform blockers would block Team A
→ Team Platform highest priority
```

### Team B ↔ Team Platform
```
Team B depends on Platform for:
- Auth service (Week 1)
- Billing service (Week 2)
- Design System (Week 1)

Platform blockers would block Team B
```

**Rule**: If Platform is blocked, it cascades to both A & B
→ **CTO must unblock Platform immediately**

---

## 3.3 Handling Blockers

### Blocker Found?

```
1. [IMMEDIATE] Post to #dev-blockers
   Message: "@cto Blocker found: [description], impacts Team [A/B], needed for [feature]"

2. [WITHIN 5 MIN] CTO acknowledges
   Either: "Investigating" or "Reassigning to [person]"

3. [WITHIN 30 MIN] Update status
   Either: "Fixed" or "Escalating" or "Workaround [X]"

4. [DAILY] Blocker standup (if >1 blocker open)
   CTO + affected leads sync in Slack thread every 3 hours
```

### Example

```
[9:42 AM] Team A Lead: @cto 🚨 Blocker: Device API from Philips returns 401,
can't test device discovery. Needed by EOD today for sprint goal.

[9:44 AM] CTO: Investigating. Checking API credentials...

[9:52 AM] CTO: Found issue, device credentials expired. Renewing...

[10:05 AM] CTO: ✅ Fixed, Team A can resume. Test to confirm?

[10:10 AM] Team A Lead: ✅ Confirmed, we're good. Resuming sprint.
```

---

# 4. GIT & CODE COORDINATION

## 4.1 Branch Isolation

**Each team works on isolated branches:**

```
main (stable, always deployable)
├── feature/omniverse-device-control (Team A)
├── feature/om-ai-live-call (Team B)
├── feature/shared-auth-service (Team Platform)
└── feature/shared-billing-service (Team Platform)

NO overlapping branches (reduces conflicts)
NO long-lived branches (merge within 3 days)
```

## 4.2 Merge Strategy

**Main branch stays clean:**

```
✅ Merge requirements:
  1. All tests pass (100%)
  2. Code review approved (≥1 engineer)
  3. 0 conflicts with main
  4. Lint check passes
  5. Security scan OK (no hardcoded secrets)

❌ Do NOT merge if:
  - Tests failing
  - Unresolved code review comments
  - Build fails
  - New critical bugs introduced
```

## 4.3 Release Coordination

**Each team releases independently:**

```
Team A Release (when ready, e.g., Week 4):
  1. Create branch: release/omniverse-v0.1.0
  2. Tag version: v0.1.0
  3. Merge to main
  4. Deploy to staging (automated)
  5. Test 24 hours
  6. Deploy to production (manual approval by CTO)

Team B Release (when ready, e.g., Week 4):
  Same process, different version: om-ai-v0.1.0

Shared Core Release (ongoing):
  Each service versioned independently
  Deployed to shared infrastructure
```

---

# 5. SHARED RESOURCES & SUPPORT

## 5.1 Cross-team Borrowing (Resource Sharing)

**Scenario**: Team A needs extra help on iOS, borrows engineer from another team

```
Rule: Up to 1-2 engineers can borrow per sprint (max 30% of team)

Process:
1. Team A Lead asks Engineering Manager + CTO
2. Explain: Why? How long?
3. Lending team agrees (doesn't hurt their sprint?)
4. Borrowed engineer still reports to original team lead
5. Clear duration: "Until Friday EOD" or "Full sprint"
6. Return engineer to original team

Example:
Problem: iOS build pipeline broken, Team A needs help
Borrow: 1 iOS engineer from Team B for 1 day
Result: Fixed, iOS engineer returns to Team B
```

## 5.2 On-call Rotation

**On-call engineer**: Handles urgent issues (bugs, hotfixes, unplanned work)

```
Team A: Monday-Friday rotation (1 engineer per week)
Team B: Monday-Friday rotation (1 engineer per week)
Team Platform: 24/7 rotation (Shared Core can't go down)

On-call duties:
- Responds to urgent Slack messages (<5 min)
- Triage critical bugs
- Apply hotfixes to production
- Can interrupt current sprint work if critical

Reward: On-call engineer gets 1 day off next week
```

---

# 6. QUALITY GATES & CODE REVIEW

## 6.1 Code Review Expectations

**Goal**: 4-hour turnaround on PR reviews

```
PR Submitted (any team) →
  ↓ (within 1 hour)
Review Assigned →
  ↓ (within 4 hours)
Approved + Feedback →
  ↓ (same day)
Author Fixes + Re-submits →
  ↓ (within 2 hours)
Approved + Merged

If 4-hour SLA missed:
  - CTO assigns 2nd reviewer to unblock
  - PR gets expedited
  - Reason documented for retro
```

## 6.2 Cross-team Code Review

**Sometimes, cross-team reviews are needed:**

```
When?
- API changes (Team A ↔ Team B)
- Shared infrastructure (Team A/B ↔ Team Platform)
- Major architectural decisions

Who?
- Team A lead, Team B lead, or CTO

Process:
- Add reviewer comment: @team-a-lead "Can you review the API contract change?"
- Reviewer: Priority (will review within 4 hours)
- Author responds to comments
- Approves + merges
```

---

# 7. ESCALATION MATRIX

**Who to contact when?**

```
MINOR ISSUES (Slack message to team lead)
├─ Code style question
├─ Task assignment confusion
├─ Small blocker (can work around)
└─ Tool/setup issue

MEDIUM ISSUES (Slack message to CTO + team lead)
├─ Cross-team dependency issue
├─ Performance concern
├─ Test coverage drop
├─ Build/deployment issue
└─ Team blocked for >2 hours

CRITICAL ISSUES (CTO teleconference)
├─ Production bug
├─ Major blocker (team can't work)
├─ Architecture conflict
├─ Security vulnerability
└─ Timeline at risk

ESCALATION EXAMPLE:
[10:30 AM] Team A Lead → CTO: "Device gateway down for 1 hour, blocking all device tests"
[10:32 AM] CTO: "Investigating, starting telecon"
[10:35 AM] CTO + Team A + Platform engineer: Diagnosis
[10:50 AM] Platform: Gateway restarted, back online
[11:00 AM] Team A: Resumed testing
[11:30 AM] Slack post-mortem: What happened + how to prevent
```

---

# 8. TEAM HEALTH & MORALE

## 8.1 Signs of Problem

| Sign | Action |
|---|---|
| Engineer not in standup (2+ days) | Lead checks in via DM |
| Commits drop (< 5/day/engineer) | Lead asks what's blocking |
| PRs not getting reviewed | CTO steps in + helps |
| Team says "we need X" (3+ times) | Leader escalates to CTO |
| Quiet in #dev-standup | Lead notices + encourages |
| New bug rate increasing | Retro to discuss quality |
| Missed sprint goal (2x) | Re-plan + adjust velocity |

## 8.2 Morale Boosters

```
Weekly:
- Celebrate wins (Slack reaction, mention in all-hands)
- Give credit for hard work
- Unblock engineers quickly

Monthly:
- Team lunch or coffee (if co-located)
- 1:1 check-ins with each engineer
- Ask "what can I improve?"
- Celebrate sprint completion
```

---

# 9. CONTINGENCY PLANS

## 9.1 If Shared Core Delays

**Impact**: Both Team A and Team B blocked
**Severity**: CRITICAL

```
Mitigation:
1. CTO reassigns resources to Platform
2. Borrow engineers from Team A/B if needed
3. Fast-track implementation (cut nice-to-have features from auth/billing)
4. 24/7 focus until Shared Core ready

Maximum acceptable delay: 3 days
If >3 days: Re-plan entire timeline
```

## 9.2 If Team A Falls Behind

**Impact**: Omniverse MVP delayed, affects launch timeline
**Severity**: HIGH

```
Mitigation:
1. Identify bottleneck (scope? quality? tools?)
2. Option A: Cut lowest-priority features (automation, multi-team)
3. Option B: Borrow engineers from Platform (if Shared Core done)
4. Option C: Extend timeline to June 8

Decision: CTO + Product Lead by May 15
```

## 9.3 If Team B Falls Behind

**Impact**: Om AI MVP delayed, affects launch timeline
**Severity**: HIGH

```
Same mitigation as Team A
```

## 9.4 If Key Engineer Leaves

**Impact**: Depends on role (could be catastrophic)

```
Prevention:
- Pair senior engineer with junior
- Document critical knowledge (runbook, architecture)
- Cross-train on critical systems

Recovery:
- Promote junior engineer
- Hire replacement (fast-track)
- Redistribute work if necessary
- Re-plan timeline if critical path affected
```

---

# 10. DECISION MAKING

## 10.1 Decision Authority

```
TEAM LEVEL (Team Lead decides)
├─ Task assignment
├─ Code style / implementation details
├─ Sprint breakdown
└─ Day-to-day priorities

CROSS-TEAM (CTO decides)
├─ Architecture changes
├─ API contracts
├─ Shared Core scope
├─ Timeline changes
└─ Resource allocation

PRODUCT (Product Lead decides)
├─ Feature priority
├─ MVP scope
├─ User-facing requirements
└─ Go/no-go to launch
```

## 10.2 Decision Process

**For major decisions:**

```
1. Propose (email or Slack thread)
   "I propose we [action] because [reason]"

2. Discuss (async or sync meeting)
   Stakeholders comment: "Good idea", "Concern: X", "Question: Y"

3. Decide (owner makes call)
   "Decision: We will [action]. Here's why [rationale]."

4. Communicate (announce to affected teams)
   "All teams: FYI, we decided to [action]. This affects [X]. Questions?"

5. Document (update relevant docs)
   If major: Add to DECISION_LOG.md with date + rationale
```

---

# 11. COMMUNICATION GUIDELINES

## 11.1 Slack Channels

```
#dev-standup — Daily standup summaries (async)
#dev-blockers — Urgent issues only (real-time)
#dev-tech-sync — Weekly notes + tech discussion
#team-omniverse — Team A private channel
#team-om-ai — Team B private channel
#team-platform — Team Platform private channel
#architecture — Architecture discussions (all leads)
#releases — Deployment notifications (automated)
```

## 11.2 Slack Norms

```
✅ Respond to mentions within 1 hour
✅ Use threads to keep channels clean
✅ React with emoji (👀 = seen, ✅ = done, 🚨 = urgent)
✅ Post code in GitHub, not Slack
✅ Overcommunicate when in doubt

❌ Don't tag person for non-urgent asks (use thread)
❌ Don't have long conversations in standup channel
❌ Don't mix urgent + non-urgent in #dev-blockers
```

---

# 12. SUCCESS METRICS FOR COORDINATION

By June 1, ask:

```
✅ Did all 3 teams ship MVP on time?
✅ How many blockers were resolved within 30 min? (Target: >90%)
✅ Did team morale stay high? (Target: NPS score)
✅ Zero context-switching between teams? (Target: <5% of time)
✅ Code quality consistent across teams? (Target: >75% coverage all)
```

---

# END OF FILE

**Tác giả**: Engineering Manager + CTO
**Lần cập nhật cuối**: April 4, 2026
**Trạng thái**: Bắt đầu từ April 16, 2026
