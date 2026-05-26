# OMDALA Full Project Dev Completion Board

Date: 2026-05-19  
Scope: Omdala.com only  
Status: SUPERSEDED — kept as historical reference  
Owner: Team Admin

> ⚠️ The 3-team split below has been consolidated into a single dev team.  
> Authoritative work order is now: **`docs/OMDALA_SINGLE_TEAM_MASTER_PLAN_2026-05-19.md`**  
> Use this file only to look up the original per-team task detail.

## 1) True State (verified in repo)

Branch now:
- `OMCODE/omdala-brandpro-lock-20260512`

Verified command evidence:
- `npm --prefix services/api run check` -> PASS
- `npm run brand:lint` -> PASS
- `npm run brand:lint:static` -> PASS
- `npm run build:static` -> PASS
- `apps/web/node_modules/.bin/next build` -> FAIL (`Cannot find module .../next/dist/bin/next`)
- `apps/app/node_modules/.bin/next build` -> FAIL (`Cannot find module .../next/dist/bin/next`)
- `apps/admin/node_modules/.bin/next build` -> FAIL (`Cannot find module .../next/dist/bin/next`)
- `apps/docs/node_modules/.bin/next build` -> FAIL (`Cannot find module .../next/dist/bin/next`)
- `apps/auth/node_modules/.bin/next build` -> FAIL (`Cannot find module .../next/dist/bin/next`)

Critical source gap:
- Missing mandatory bilingual source files:
  - `/Users/tranhatam/Documents/Devnewproject/omdala.com/content/en.json`
  - `/Users/tranhatam/Documents/Devnewproject/omdala.com/content/vi.json`
- But code imports them at:
  - `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/lib/bilingual-source.ts`

## 2) Completion Definition (project-level)

Project is only "done" when all are true:
1. All Next surfaces build:
   - `apps/web`, `apps/app`, `apps/admin`, `apps/docs`, `apps/auth`
2. API check and API tests pass on clean environment
3. Bilingual source lock exists and is validated (`en.json` / `vi.json` parity)
4. Public EN/VI routes complete (not home-only)
5. SEO bilingual metadata/canonical/hreflang/OG is correct per route
6. OAuth Google flow has config docs, runtime wiring, and e2e proof
7. No duplicate/legacy runtime files that conflict build (`page.js` + `page.tsx`, `layout.js` + `layout.tsx`, duplicate `* 2.*`)
8. Execution docs reflect true state (no false "GO")

## 3) Team Split and Task Board

### Team 1 - Platform and Build Integrity (P0 first)

Objective:
- Recover deterministic build toolchain and monorepo install integrity.

Owns:
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/package.json`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/package-lock.json`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/pnpm-lock.yaml`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/.gitignore`
- all `apps/*/package.json`, `services/*/package.json`, `packages/*/package.json`

Tasks:
1. Standardize one package manager for this repo (npm or pnpm), lock it, remove mixed-mode drift.
2. Reinstall dependencies cleanly so `next/dist/bin/next` exists for all Next apps.
3. Add/normalize workspace config if using pnpm workspaces.
4. Add missing ignore rules for generated outputs:
   - `apps/auth/out/`
   - `apps/admin/out/`
   - `apps/docs/out/`
5. Remove duplicated conflict files:
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/page.js`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/layout.js`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/app/page.js`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/app/layout.js`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/services/api/src/index.v2.db-errors.test 2.ts`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/styles 2.css`

Verify gates:
- `apps/web/node_modules/.bin/next build`
- `apps/app/node_modules/.bin/next build`
- `apps/admin/node_modules/.bin/next build`
- `apps/docs/node_modules/.bin/next build`
- `apps/auth/node_modules/.bin/next build`
- `npm --prefix services/api run check`

Done when:
- All five Next builds PASS and generated folders are no longer tracked noise.

---

### Team 2 - Bilingual Content and SEO Surface (P0/P1)

Objective:
- Restore true bilingual architecture for public web and remove cross-domain drift.

Owns:
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/content/en.json`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/content/vi.json`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/lib/bilingual-source.ts`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/lib/localized-metadata.ts`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/sitemap.ts`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/components/LanguageSwitcher.tsx`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/[lang]/**`

Tasks:
1. Create canonical bilingual source files:
   - `content/en.json`
   - `content/vi.json`
   - key parity 100% for `site`, `pages`, `publicPages`
2. Implement missing bilingual validation scripts referenced by codex:
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/scripts/bilingual-source-check.mjs`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/scripts/bilingual-public-audit.mjs`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/scripts/bilingual-hardcode-scan.mjs`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/scripts/bilingual-founder-report.mjs`
3. Complete localized route tree for all public pages under `[lang]` (currently only home exists):
   - add `[lang]/what-is-omdala/page.tsx`
   - add `[lang]/how-it-works/page.tsx`
   - add `[lang]/for-experts/page.tsx`
   - add `[lang]/for-hosts/page.tsx`
   - add `[lang]/for-communities/page.tsx`
   - add `[lang]/trust/page.tsx`
   - add `[lang]/vision/page.tsx`
   - add `[lang]/faq/page.tsx`
   - add `[lang]/contact/page.tsx`
4. Remove Omdalat-related wording from Omdala public copy and root static page where no longer intended:
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/index.html`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/page.js` (or delete duplicate file in Team 1 task)
5. Ensure language switcher maps only to existing route pairs and remove emoji flags if enforcing strict character hygiene.

Verify gates:
- `npm run brand:lint`
- `npm run brand:lint:static`
- `npm run build:web`
- bilingual scripts pass 4/4
- crawl EN+VI URL list and confirm no 404 from language switch

Done when:
- Public EN/VI pages are complete, source-controlled, and metadata parity is verified.

---

### Team 3 - Auth/API Integration and Release Evidence (P1)

Objective:
- Finalize auth/provider integration and produce truthful release packet.

Owns:
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/auth/app/login/AuthLoginForm.tsx`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/auth/app/globals.css`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/services/api/src/contracts.ts`
- `/Users/tranhatam/Documents/Devnewproject/omdala.com/services/api/src/index.ts`
- release docs in `/Users/tranhatam/Documents/Devnewproject/omdala.com/docs/`

Tasks:
1. Replace hard-coded OAuth start URL with environment-driven source:
   - now hard-coded: `https://api.omdala.com/v1/auth/google/start`
2. Add config/runbook for Google OAuth env:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `GOOGLE_OAUTH_STATE_SECRET`
3. Add API route tests for:
   - `/v1/auth/google/start`
   - `/v1/auth/google/callback`
   - invalid/expired state
   - unverified email path
4. Validate redirect/cookie behavior between `auth.omdala.com`, `app.omdala.com`, `api.omdala.com`.
5. Remove tracked generated auth output from git lane:
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/auth/out/**`
6. Produce release evidence packet with real command output and screenshot proof.

Verify gates:
- `npm --prefix services/api run check`
- API tests for OAuth flow pass
- auth login e2e (magic link + google start/callback) pass

Done when:
- Auth/API flows are reproducible with evidence and no hard-coded environment leakage.

## 4) Execution Order (mandatory)

1. Team 1 P0 (toolchain/build integrity) - must pass first.
2. Team 2 P0/P1 (bilingual source + route parity + SEO parity).
3. Team 3 P1 (OAuth integration hardening + release evidence).
4. Final full verification pass across all surfaces.

## 5) Final Verification Matrix

Run all:
1. `npm --prefix services/api run check`
2. `apps/web/node_modules/.bin/next build`
3. `apps/app/node_modules/.bin/next build`
4. `apps/admin/node_modules/.bin/next build`
5. `apps/docs/node_modules/.bin/next build`
6. `apps/auth/node_modules/.bin/next build`
7. `npm run brand:lint`
8. `npm run brand:lint:static`
9. `npm run build:static`
10. Bilingual validation 4 scripts

## 6) Team Reporting Format (required each run)

Every team report must include:
1. `Verdict`
2. `Evidence checked`
3. `Pass`
4. `Fail`
5. `Blocked by Founder`
6. `Blocked by external asset`
7. `True state`
8. `Next action`
9. `Hard stop`

If no new progress for 2 consecutive automation runs:
- mark run as `NO_MEANINGFUL_PROGRESS`
- auto-stop that automation loop.

