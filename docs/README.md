# OMDALA Docs Index

All planning, specification and operations documents for `*.omdala.com` live here, ordered from intent to running system. Each section names the code that implements it, so a plan can always be traced to a file.

## Reading order for a new developer

1. `00-start/README_DEV_HANDOFF_OMDALA.md`
2. `01-brand/BRAND_ARCHITECTURE_OMDALA.md` and `01-brand/OMDALA_THEME_SYSTEM.md`
3. `02-product/PRODUCT_SPEC_OMDALA.md`
4. `03-architecture/OMDALA_MASTER_SYSTEM_ARCHITECTURE_2026_FINAL.md`
5. `04-engineering/DATA_MODEL_OMDALA.md` and `04-engineering/API_SPEC_OMDALA.md`
6. `05-operations/DEPLOYMENT_RUNBOOK_OMDALA.md`

## Sections

| Section | What it decides | Implemented in |
|---|---|---|
| `00-start/` | Handoff, team requirements, task system | `CLAUDE.md`, `.github/` |
| `01-brand/` | Brand architecture (OMDALA vs OMDALAT), theme lock, design system, homepage copy | `packages/ui/src/styles/tokens.css`, `packages/ui/assets/`, `apps/web/app/lib/content.ts` |
| `02-product/` | Product spec, principles, information architecture, trust and matching engines, reality map, commitment contract | `apps/app`, `apps/admin`, `services/trust`, `services/matching` |
| `03-architecture/` | Master system architecture, backend architecture, API boundaries, repo layout | `services/api`, `packages/*` |
| `04-engineering/` | API spec (v1 + v2 reality namespace), data model, DB schema, SEO lock, email | `services/api/src`, `packages/types`, `infra/db`, `infra/migrations`, `packages/seo`, `packages/core/src/mail.ts` |
| `05-operations/` | Deploy, DNS and subdomains, Cloudflare baseline, logs, alerts, DR, Postgres hardening | `services/api/wrangler.toml`, `scripts/`, `.github/workflows/` |
| `06-strategy/` | Roadmap, continuous dev plan and ledger (scheduled work), MVP scale plan, growth, fundraising, pitch, hiring | `scripts/dev-cycle.sh` |
| `99-archive/` | Past audits and superseded drafts. Read-only history, never a source of truth | — |

## Source-of-truth rules

- One canonical document per concern. If two documents disagree, the one listed in the table above for that concern wins; for brand values that is `01-brand/OMDALA_THEME_SYSTEM.md`.
- A superseded document moves to `99-archive/` instead of being edited into a second "final".
- New documents go into the matching section. Do not add files at the repo root or directly under `docs/`.
- Domain map lives in `05-operations/DNS_SUBDOMAIN_DEPLOYMENT_LOCK_OMDALA.md`: every production subdomain is declared explicitly (Cloudflare Workers custom domains do not support wildcards).
