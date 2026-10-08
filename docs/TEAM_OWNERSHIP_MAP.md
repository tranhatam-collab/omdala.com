# OMDALA Team Ownership Map

**Version:** 1.0  
**Status:** LOCKED — All teams have read & acknowledged  
**Date:** 2026-04-28  
**Owner:** Team Admin (Team 1)  
**Governed by:** `docs/00_governance/PROJECT_CHARTER.md`

---

## 1. Rule cứng

> **Team nào sở hữu surface nào thì chỉ team đó được phép thay đổi surface đó.**  
> Mọi cross-team change cần handoff note trong daily sync block + Team Admin approval.

---

## 2. Team Boundary Matrix

| Surface / Module | Owner | Co-owner | Can-touch (read-only) |
|------------------|-------|---------|----------------------|
| `apps/web/` (public bilingual) | Team 1 | — | Team 3 (release verify) |
| `apps/app/` (dashboard) | Team 1 | — | Team 3 (e2e) |
| `apps/auth/` (magic-link host) | Team 1 | — | Team 3 (e2e) |
| `apps/admin/` (moderation panel) | Team 2 | — | Team 3 (release verify) |
| `apps/docs/` (public docs) | Team 2 | — | Team 1 (link refs) |
| `services/api/` | Team 3 | Team 1 (auth/intake) | Team 2 (read schema) |
| `services/auth/` | Team 1 | — | Team 3 (smoke) |
| `services/ai/` | Team 1 | — | — |
| `services/matching/` | Team 2 | — | — |
| `services/notifications/` | Team 2 | Team 3 (schema) | Team 1 |
| `services/trust/` | Team 2 | — | Team 1 |
| `om-ai.omdala.com/` (separate product) | Team 1 | — | — |
| `omniverse.omdala.com/` (separate product) | Team 2 | — | — |
| `packages/core/` | Team 3 | Team 1 (i18n, om-ai-*) | Team 2 |
| `packages/seo/` | Team 1 | — | Team 2 |
| `packages/ui/` | Team 1 | — | Team 2 |
| `packages/types/` | Team 3 | All | All |
| `content/en.json`, `content/vi.json` | Team 1 (Content Lead) | Founder | All teams |
| `infra/`, `.github/workflows/` | Team 2 | Team 3 | Team 1 |
| `scripts/` | Team 3 | Team 1 (bilingual scripts) | All |
| `docs/00_governance/` | Founder + Team Admin | — | All read-only |
| `docs/20_architecture/` | Tech Lead | All | All read-only |
| `docs/TEAM_*_PROGRESS_*.md` | Each respective team | — | Team Admin |

---

## 3. Team Composition

### Team 1 — Om AI + User Core + Team Admin

**Lead:** Trần Hà Tâm (Founder, acting Lead)  
**AI Dev Partner:** Claude (Sonnet/Opus via Claude Agent SDK)  
**Scope:** Om AI product, public web bilingual, auth funnel, app dashboard, billing/usage, provider routing  
**Surfaces owned:** `apps/{web,app,auth}`, `om-ai.omdala.com/`, `services/{auth,ai}`, `packages/{seo,ui}` (UI parts)  
**Special role:** Team Admin — coordinate all teams, collect sign-offs, escalate blockers

### Team 2 — Omniverse + System Reliability

**Lead:** TBD (gán theo nội bộ)  
**Scope:** Omniverse product, admin panel, public docs, infra/CI, shared platform schema (workspace/notifications/analytics)  
**Surfaces owned:** `apps/{admin,docs}`, `omniverse.omdala.com/`, `services/{matching,trust,notifications}`, `infra/`, `.github/workflows/`

### Team 3 — Platform Core, API, QA, Release

**Lead:** TBD (gán theo nội bộ)  
**Scope:** API gateway, runtime/auth/session contract, smoke/release evidence, type system  
**Surfaces owned:** `services/api`, `packages/{core,types}`, `scripts/`, release evidence

---

## 4. Handoff Protocol

### Khi Team A cần Team B làm gì:

1. Team A viết handoff note tại `docs/TEAM_<A>_HANDOFF_TEAM_<B>_<topic>_<date>.md`
2. Note phải có: scope rõ, acceptance criteria, deadline, blocker tránh
3. Team B đọc + xác nhận trong daily sync
4. Team B làm xong → ghi evidence + tag Team Admin
5. Team Admin verify cross-consistency → mark DONE

### Khi Team A cần SỬA file thuộc Team B:

1. **Phải có Founder Directive** (theo `TRUST_INFRASTRUCTURE_ECOSYSTEM_MASTER_PLAN_2026.md` section 2.5)
2. Hoặc: PR + 2 reviewer (Team B owner + Team Admin)
3. KHÔNG bypass — KHÔNG silent edit

---

## 5. Anti-Patterns (BANNED)

- ❌ "Tôi tiện tay sửa luôn file X của Team Y"
- ❌ "Để tránh latency tôi import code của Team Y vào file Team X"
- ❌ "Tôi đoán Team Y muốn schema này"
- ❌ Multiple teams modify cùng file trong cùng PR mà không có handoff note
- ❌ Skip approval khi cần

---

## 6. Founder Directive Format

Để override boundary, cần Founder Directive hợp lệ:

```
DIRECTIVE_ID: OMDALA-FD-YYYYMMDD-NNN
DATE: yyyy-mm-dd
SCOPE: <surfaces affected>
GOAL: <change goal>
ASSIGNED_TO: <team>
AFFECTED_TEAMS: <list>
PRIORITY: P0 / P1 / P2
SIGNATURE: Trần Hà Tâm
```

Lưu tại `docs/00_governance/founder-directives/`.

---

## END OF MAP
*Mọi thay đổi map này phải có Founder approval ghi trong CHANGE_LOG.md*
