# AI_OM_ECOSYSTEM_RESOURCE_AUDIT_2026.md

Version: 1.0  
Status: Official ecosystem audit for DEV and Product handoff  
Scope: Local machine resources + public-web verification snapshot  
Primary focus: Om AI / OMDALA / related `*.iai.one` surfaces  
Date: April 4, 2026

---

# 1. Purpose

This document records the ecosystem resource audit performed for Om AI on April 4, 2026.

Goals:
- identify what `*.omdala.com` resources already exist on the machine
- identify what `*.iai.one` resources may be reusable later
- separate reliable reusable assets from unstable or non-priority assets
- give Team DEV and Product a clean handoff view without touching runtime code

This is an audit and recommendation document only.
It is not an implementation document.

---

# 2. Audit Method

The audit covered two layers:

## 2.1 Local machine audit

Checked sibling repositories and project folders under the local workspace area for:
- repo presence
- README and package manifests
- visible service boundaries
- deployment/config files
- rough platform role

## 2.2 Public/web snapshot audit

Checked what could be verified from the current environment through public web access and HTTP checks.

Important limitation:
- public DNS and HTTP verification was incomplete from this runtime environment on April 4, 2026
- therefore local repositories were treated as the stronger source of truth for structural assessment

---

# 3. Primary Local Resources Found

The following related resources were found locally:

## 3.1 OMDALA family

- `ai.omdala.com`
- `omdala.com`
- `CODE.OMDALA.COM`
- `omdalat.com`

## 3.2 IAI family

- `app.iai.one`
- `cios.iai.one`
- `docs.iai.one`
- `flow.iai.one`
- `home.iai.one`
- `iai.one-platform`
- `noos.iai.one`

## 3.3 Backup or variant repos also present

- `cios.iai.one.backup-20260403-1218`
- `cios.iai.one.backup-20260403-1219`
- `cios.iai.one.clean-rebuild`
- `flow.iai.one.clean`
- `flow.iai.one.clean.latest`
- `flow.iai.one.dash.work`
- `omdala-git-broken-20260404-0122`

These variant folders are useful for recovery or comparison but should not be treated as integration targets by default.

---

# 4. Om AI Repo Assessment

## 4.1 Repo

Primary repo:
- `ai.omdala.com`

## 4.2 Current status

The repo already contains:
- backend skeleton
- web shell
- gateway skeleton
- native iOS structure scaffold
- Android planning docs
- full strategy and execution docs
- live interaction architecture
- persona, pricing, memory, metering, and provider-router docs

## 4.3 Audit conclusion

`ai.omdala.com` is already the correct execution center for Om AI.

It should remain:
- the main implementation repo
- the source of truth for Om AI-specific contracts and rollout
- the repo where mobile, backend, web, and gateway execution converge

---

# 5. OMDALA Global Repo Assessment

## 5.1 Repo

Primary repo:
- `omdala.com`

## 5.2 Local structure observed

The repo includes strong reusable global-platform layers:

Apps:
- `apps/web`
- `apps/app`
- `apps/admin`
- `apps/docs`

Packages:
- `packages/core`
- `packages/ui`
- `packages/types`
- `packages/seo`

Services:
- `services/api`
- `services/auth`
- `services/ai`
- `services/matching`
- `services/notifications`
- `services/trust`

## 5.3 Strategic meaning for Om AI

This repo is not just marketing surface. It is a real global system layer for OMDALA.

It is the most valuable adjacent resource for Om AI because it already provides:
- shared app and admin surfaces
- shared package patterns
- service boundaries
- auth model direction
- trust and notification service direction
- API boundary discipline

## 5.4 Audit conclusion

`omdala.com` is the strongest same-brand integration candidate for Om AI after Om AI core is stable.

---

# 6. CIOS Assessment

## 6.1 Repo

Primary repo:
- `cios.iai.one`

## 6.2 Local structure observed

The repo and docs indicate strong enterprise-facing layers around:
- compliance
- CRM and customer intelligence
- governance
- review and audit flows
- retention and policy
- auth and plan handling
- realtime and event-store direction

## 6.3 Strategic meaning for Om AI

CIOS is highly compatible with:
- Om AI Business Mode
- Om AI Enterprise Mode
- receptionist and customer-facing agent flows
- staff training and simulation
- org logging and compliance

## 6.4 Audit conclusion

CIOS should be treated as the strongest `*.iai.one` business integration target for Om AI.

It is not the first MVP dependency, but it is a high-value phase-3 or enterprise-phase bridge.

---

# 7. IAI Flow Assessment

## 7.1 Repo

Primary repo:
- `flow.iai.one`

## 7.2 Local structure observed

The repo clearly positions itself as:
- AI workflow and automation orchestration platform
- runtime layer
- node ecosystem
- agent orchestration system
- Cloudflare-based infrastructure with D1, KV, R2, and Durable Objects

## 7.3 Strategic meaning for Om AI

Flow can be valuable for:
- lesson follow-up workflows
- recap generation pipelines
- scheduled reminders
- organization automation
- customer-service training flows
- post-session orchestration

## 7.4 Audit conclusion

Flow is strategically useful, but should remain a later integration layer.

It should not block Om AI realtime call MVP.

---

# 8. docs.iai.one Assessment

## 8.1 Repo

Primary repo:
- `docs.iai.one`

## 8.2 Local structure observed

The repo provides:
- static docs portal
- sidebar/search/content system
- Cloudflare Pages documentation deployment pattern
- ecosystem documentation structure

## 8.3 Strategic meaning for Om AI

Useful mainly as reference for:
- docs information architecture
- technical portal structure
- documentation publishing patterns

## 8.4 Audit conclusion

This is a documentation-pattern resource, not a product runtime dependency.

---

# 9. app.iai.one Assessment

## 9.1 Repo

Primary repo:
- `app.iai.one`

## 9.2 Local structure observed

The repo is focused on:
- control center for websites
- Cloudflare and GitHub publishing workflows
- content and template management
- site and page operations

## 9.3 Strategic meaning for Om AI

Possible later value only in narrow cases:
- school or business microsite publishing
- campaign and landing-page generation
- template-based rollout surfaces

## 9.4 Audit conclusion

`app.iai.one` is not a priority integration target for Om AI core product capability.

---

# 10. home.iai.one Assessment

## 10.1 Repo

Primary repo:
- `home.iai.one`

## 10.2 Local and public meaning

The repo and public site position it as:
- portal layer
- ecosystem entry map
- navigation hub for the wider IAI system

## 10.3 Strategic meaning for Om AI

Useful as:
- ecosystem IA reference
- ecosystem entry-point design reference

## 10.4 Audit conclusion

`home.iai.one` is useful as reference, not as a runtime dependency.

---

# 11. noos.iai.one Assessment

## 11.1 Repo

Primary repo:
- `noos.iai.one`

## 11.2 Local meaning

Local repo frames NOOS as:
- civilization operating system
- architecture and governance layer
- public docs and standards layer

## 11.3 Public-web mismatch observed

Public web inspection on April 4, 2026 indicated that `https://noos.iai.one/` was serving content aligned to `dautu.muonnoi.org`, not the local NOOS framing.

## 11.4 Audit conclusion

NOOS may still be useful as a conceptual architecture reference, but its public surface is not stable enough to treat as dependable Om AI integration infrastructure right now.

---

# 12. CODE.OMDALA.COM Assessment

## 12.1 Repo

Primary repo:
- `CODE.OMDALA.COM`

## 12.2 Meaning

This is a coding workspace and developer tooling surface under the OMDALA family.

## 12.3 Strategic meaning for Om AI

Useful for:
- internal developer productivity
- coding workflows
- AI-assisted engineering patterns

Not useful as direct product runtime dependency.

## 12.4 Audit conclusion

Treat as internal tooling ecosystem, not Om AI product dependency.

---

# 13. Public-Web Verification Snapshot

## 13.1 What was verified from browser-style checks

The following public access observations were possible:
- `home.iai.one` appeared reachable and aligned with portal-layer positioning
- `noos.iai.one` showed content mismatch versus local repo intent

## 13.2 What could not be cleanly verified from the current terminal environment

DNS or HTTP checks from the current environment failed for multiple domains, including:
- `omdala.com`
- `app.omdala.com`
- `api.omdala.com`
- `code.omdala.com`
- `cios.iai.one`
- `flow.iai.one`
- `docs.iai.one`
- `app.iai.one`
- `home.iai.one`
- `noos.iai.one`

## 13.3 Operational conclusion

For this audit, local repository structure is more trustworthy than terminal DNS snapshots.

Public-runtime assumptions should be validated again from deployment or infra environments before integration work starts.

---

# 14. Dirty-Worktree Risk Note

Several sibling repositories showed local modifications or uncommitted work.

This means:
- they should not be treated as perfectly stable integration sources
- direct copy or hot-merge between repos would be risky
- integration should happen through reviewed adapters, contracts, and shared package extraction

This audit intentionally did not modify any code in those repositories.

---

# 15. Reuse Priority Ranking

## 15.1 Highest-priority reuse candidate

1. `omdala.com`

Why:
- same brand family
- same domain family
- strong shared package and service model
- cleanest long-term alignment path

## 15.2 Highest-priority `*.iai.one` candidate

2. `cios.iai.one`

Why:
- strongest fit for business and enterprise extensions
- governance, CRM, compliance, and audit overlap

## 15.3 High-value later orchestration candidate

3. `flow.iai.one`

Why:
- strong automation and orchestration value after core product is stable

## 15.4 Documentation-pattern candidate

4. `docs.iai.one`

## 15.5 Lower-priority reference or niche candidates

5. `app.iai.one`
6. `home.iai.one`
7. `noos.iai.one`
8. `CODE.OMDALA.COM`

---

# 16. Final Audit Lock

As of April 4, 2026:
- Om AI should continue building primarily inside `ai.omdala.com`
- OMDALA global resources in `omdala.com` are the best same-brand reuse pool
- CIOS is the best `iai.one` business integration candidate
- Flow is a valuable later orchestration layer
- docs/home/noos/app.iai.one should not be treated as core Om AI runtime dependencies at this stage
