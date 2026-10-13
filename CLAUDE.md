# CLAUDE.md — working rules for this repo

OMDALA (`*.omdala.com`) is one pnpm + Turborepo monorepo. OMDALAT (`omdalat.com`, city node) is a separate brand and is out of scope here.

## Layout

- `apps/web|app|admin|docs` — Next.js 15 surfaces, one per subdomain
- `services/api` — Hono on Cloudflare Workers (`api.omdala.com`), Postgres via Hyperdrive
- `services/{auth,trust,matching,notifications,ai}` — domain logic packages
- `packages/ui` — brand tokens, assets, shared components (`LocaleLink`, `LanguageSwitcher`, `SchemaScript`, `LinkSEO`)
- `packages/seo`, `packages/core`, `packages/types` — SEO helpers, routes/i18n/mail constants, domain types
- `infra/` — SQL schema and migrations
- `docs/` — plans and specs; index and section rules in `docs/README.md`

## Rules

- Import across packages by name (`@omdala/core`), never by relative path into another package.
- Brand values live only in `packages/ui/src/styles/tokens.css` (+ `tokens.ts`). App CSS aliases tokens; no raw hex in `apps/*/app`. `pnpm brand:check` enforces this in CI.
- Shared UI goes in `packages/ui`, not copied between apps.
- `app`, `admin` and `api` stay noindex (robots.txt, `_headers`, metadata). Public pages on `web` and `docs` must render their content server-side.
- Every subdomain is declared explicitly in Cloudflare; no wildcard custom domains.
- New docs go into the matching `docs/NN-section/`; superseded docs move to `docs/99-archive/`. Nothing new at the repo root.

## Verify before committing

```bash
pnpm typecheck
pnpm build
pnpm brand:check
pnpm --filter @omdala/api test
```

Run `typecheck` and `build` as separate commands: Next.js regenerates `.next/types` during build, so running both in one parallel turbo invocation can produce false TS6053 errors.
