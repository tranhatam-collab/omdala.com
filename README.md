# OMDALA

OMDALA is the master platform repository for the global brand and system layer behind:

- `omdala.com`
- `app.omdala.com`
- `api.omdala.com`
- `docs.omdala.com`
- `admin.omdala.com`

OMDALA is not a city website, tourism product, or thin marketplace. It is the operating layer for
real-world value, trust, and intelligent coordination.

## Core definition

OMDALA exists to help people, places, organizations, and communities:

- see underused resources clearly
- structure needs and offers correctly
- match with better relevance and trust
- move from intent to real action
- store proof so future outcomes improve

## Repo status

This branch now includes:

- monorepo foundation with `pnpm` and `turbo`
- public OMDALA web routes for the masterbrand surface
- app, docs, admin, and API shells
- master brand, theme, SEO, deploy, and developer lock files
- core product, data, API, trust, and matching specifications

## Start here

Read these files first:

1. `docs/README_DEV_HANDOFF_OMDALA.md`
2. `docs/BRAND_ARCHITECTURE_OMDALA.md`
3. `docs/PRODUCT_SPEC_OMDALA.md`
4. `docs/DATA_MODEL_OMDALA.md`
5. `docs/API_SPEC_OMDALA.md`

## Repo structure

```text
omdala.com/
  apps/
    web/
    app/
    admin/
    docs/
  packages/
    seo/
    types/
    ui/
  services/
    api/
  docs/
```

## Build rule

Do not introduce implementation-specific brands or local-node logic into this repository unless that
scope has been explicitly approved and documented as a separate system contract.
