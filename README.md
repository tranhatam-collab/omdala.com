# OMDALA

OMDALA is the master platform repository for the global brand and system layer behind:

- `omdala.com`
- `app.omdala.com`
- `api.omdala.com`
- `docs.omdala.com`
- `admin.omdala.com`

OMDALA is not a city website, tourism product, or thin marketplace. It is the operating layer for real-world value, trust, and intelligent coordination.

## Core definition

OMDALA exists to help people, places, organizations, and communities:

- see underused resources clearly
- structure needs, commitments, and outcomes correctly
- match with better relevance and trust
- move from intent to real action
- store proof so future outcomes improve

The current system thesis is:

> OMDALA is verified coordination infrastructure for real-world state transitions.

Core loop:

> See value -> Activate it -> Prove it -> Compound it

## Repo status

This branch now includes:

- monorepo foundation with `pnpm` and `turbo`
- public OMDALA web routes for the masterbrand surface
- app, docs, admin, and API shells
- master brand, theme, SEO, deploy, and developer lock files
- core product, data, API, trust, and matching specifications
- process guidance for AI-assisted engineering under `.github/`

## Domain lock

OMDALA and OMDALAT are intentionally separate:

- `omdala.com` is the global system layer
- `omdalat.com` is the city node layer
- `docs.omdala.com` and `app.omdala.com` belong to the global layer only

Routing and auth must stay on the global domain model unless a city-node scope is explicitly approved.

## Start here

- Docs index and reading order: `docs/README.md`
- Conventions for developers and AI agents: `CLAUDE.md`
- Brand lock: `docs/01-brand/OMDALA_THEME_SYSTEM.md`

## Surfaces

| Domain | Code | Indexing |
|---|---|---|
| `omdala.com` | `apps/web` | public, SSR-first |
| `app.omdala.com` | `apps/app` | noindex |
| `admin.omdala.com` | `apps/admin` | noindex, Zero Trust |
| `docs.omdala.com` | `apps/docs` | public |
| `api.omdala.com` | `services/api` (Cloudflare Worker) | noindex |

## Repo structure

```text
omdala.com/
  apps/            web, app, admin, docs (Next.js 15, one Cloudflare Pages project each)
  services/        api (Hono Worker) + auth, trust, matching, notifications, ai
  packages/
    ui/            brand tokens, assets, shared React components
    seo/           metadata, canonical, hreflang, JSON-LD
    core/          routes, navigation, i18n, mail constants, demo data
    types/         shared domain types
  infra/           db schema and SQL migrations
  scripts/         deploy, smoke, ops, backup, brand check
  docs/            plans and specs, 00-start -> 06-strategy, 99-archive
  reports/ops/     output folder for ops scripts (generated files are git-ignored)
  .github/         CI workflows, AI agent prompts
```

## Commands

```bash
pnpm install
pnpm dev                 # all surfaces
pnpm typecheck
pnpm build
pnpm brand:check         # brand token and asset drift guard
pnpm --filter @omdala/api test
```

## Development principles

- architecture first, code second
- minimal safe changes over broad rewrites
- one canonical source of truth per system concern
- no silent architectural drift
- production-first thinking
- no mixed-brand scope unless explicitly approved
- keep global and city scopes separate

## AI-assisted development

This repository is designed to be developed with AI assistance.

Working rules and task scaffolding live in:

- `.github/copilot-instructions.md`
- `.github/prompts/*`
- `.github/agents/*`

## Build rule

Do not introduce implementation-specific brands or local-node logic into this repository unless that scope has been explicitly approved and documented as a separate system contract.
