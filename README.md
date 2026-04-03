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

Read these files first:

1. `docs/README_DEV_HANDOFF_OMDALA.md`
2. `docs/BRAND_ARCHITECTURE_OMDALA.md`
3. `docs/PRODUCT_SPEC_OMDALA.md`
4. `docs/DATA_MODEL_OMDALA.md`
5. `docs/API_SPEC_OMDALA.md`
6. `docs/architecture/OMDALA_MASTER_SYSTEM_ARCHITECTURE_2026_FINAL.md`

## Repo structure

```text
omdala.com/
  .github/
    copilot-instructions.md
    prompts/
    agents/
    workflows/
  apps/
    web/
    app/
    admin/
    docs/
  packages/
    core/
    seo/
    types/
    ui/
  services/
    api/
    auth/
    trust/
    matching/
    notifications/
    ai/
  docs/
  scripts/
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
