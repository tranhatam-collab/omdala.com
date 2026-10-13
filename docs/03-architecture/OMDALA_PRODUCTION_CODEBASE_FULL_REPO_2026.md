# OMDALA PRODUCTION CODEBASE FULL REPO 2026

## 1. Purpose

Define the production-oriented monorepo structure for OMDALA based on the repository architecture that is already locked.

This document is intended for engineering setup, implementation planning, and technical handoff.

---

## 2. Monorepo Structure

Recommended production structure:

```text
omdala.com/
  apps/
    web/      # omdala.com public global surface
    docs/     # docs.omdala.com
    app/      # app.omdala.com
    admin/    # admin.omdala.com
  packages/
    ui/
    config/
    types/
    core/
    seo/
  services/
    api/
    auth/
    trust/
    planner/
    matching/
  infra/
    db/
    migrations/
    queues/
  docs/
  scripts/
```

This reflects the locked OMDALA global architecture and avoids mixed-domain implementation drift.

---

## 3. Stack

### Frontend

- Next.js 15
- Tailwind CSS or equivalent token-driven utility layer

### Backend

- Cloudflare Workers
- PostgreSQL as primary production data store

### Infrastructure

- Cloudflare Pages
- D1 for lightweight dev or early-stage experimentation only
- R2 storage for proof assets

---

## 4. Environment Model

Core environment variables:

```env
DATABASE_URL=
JWT_SECRET=
R2_BUCKET=
API_BASE=https://api.omdala.com
AUTH_BASE=https://auth.omdala.com
APP_BASE=https://app.omdala.com
DOCS_BASE=https://docs.omdala.com
```

Rules:

- keep secrets out of repo
- separate local, preview, and production environments
- do not point auth to city-node domains

---

## 5. Build Commands

Baseline commands:

```bash
pnpm install
pnpm build
pnpm deploy
```

Recommended repo-level scripts should support:

- workspace install
- scoped build by app or service
- typecheck
- lint
- preview deploys
- production deploys

---

## 6. Shared Code Rules

The repo must enforce:

- shared types in `packages/types`
- shared cross-app logic in `packages/core`
- shared UI primitives in `packages/ui`
- no duplicated business logic across apps or services

If the same logic is used more than once, move it into a package.

---

## 7. Backend Integration Rule

The backend should be event-driven where possible.

Required direction:

- state changes emit events
- trust updates consume events
- proof verification feeds trust and audit systems
- planner and matching consume canonical data, not local UI state

---

## 8. Domain Lock Rule

The production codebase must follow the global domain contract:

- `omdala.com` is the global public layer
- `docs.omdala.com` is the global docs layer
- `app.omdala.com` is the global app layer
- `api.omdala.com` is the global API layer
- `auth.omdala.com` is the global auth layer

Do not design the production codebase around city-node domains.

---

## 9. Risks

- duplicating shared logic across apps and services
- mixing dev-only infrastructure into production assumptions
- using domain patterns that violate the global routing and auth rules
- premature service explosion

---

## 10. Next Actions

1. Lock workspace package responsibilities.
2. Add service skeletons with clean boundaries.
3. Add shared types for core domain objects.
4. Align deploy scripts with Pages and Workers targets.
