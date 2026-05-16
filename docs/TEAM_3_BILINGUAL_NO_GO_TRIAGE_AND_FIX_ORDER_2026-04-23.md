# Team 3 Bilingual NO-GO Triage and Fix Order

Date: April 23, 2026
Owner: Team 3 (Gate, QA, Release)
Status: Active triage
Decision baseline: `NO-GO`

## 1. Current blocker snapshot

From latest evidence:

- `reports/bilingual/public-audit.latest.json`
- `reports/bilingual/hardcode-scan.latest.json`
- `reports/bilingual/founder-prelive.latest.json`

### Gate numbers

- Public audit blocking issues: `28`
- Team 2 unresolved `P0`: `12`
- Team 1 sign-off state: `not_final`
- Founder decision: `NO-GO`

## 2. Root-cause triage

### A. Public crawl gate (`BL-GATE-B-*`)

Blocking distribution:

- `page_html_missing`: `16`
- `logo_alt_language_mismatch`: `8`
- `hreflang_mismatch`: `3`
- `canonical_mismatch`: `1`

#### A1. `page_html_missing` is mostly artifact/environment

Observed details in report:

- `static file unavailable: file appears dataless placeholder (size>0, blocks=0); regenerate apps/web/out`

Impact:

- Crawl cannot verify many routes, so release remains blocked even if source code is correct.

Owner:

- Team 1 (web build artifact authority)

#### A2. Metadata mismatch appears concentrated on `/for-hosts`

Observed:

- `/for-hosts/` has canonical/hreflang values pointing to `/`

Likely causes:

- stale export artifact
- or route-specific metadata wiring regression

Owner:

- Team 1

#### A3. Logo alt mismatch (`OMDALA` vs source alt)

Observed:

- expected EN alt: `OMDALA logo`
- expected VI alt: `Biểu trưng OMDALA`
- rendered alt seen: `OMDALA`

Likely causes:

- stale export artifact
- or runtime code path bypassing `getBrandLogoAlt`

Owner:

- Team 1

### B. Product hard-code gate (`BL-GATE-C-*`)

After triage filter (excluding e2e/spec/test files), unresolved Team 2 `P0` is now `12` across `4` runtime files:

1. `apps/app/app/sign-in/page.js` (`8` findings)
2. `apps/app/components/magic-link-form.js` (`3` findings)
3. `apps/app/app/(auth)/login/page.tsx` (`1` finding)
4. `apps/auth/app/layout.tsx` (`1` finding)

Owner:

- Team 2

### C. Sign-off gate (`BL-GATE-D-*`)

Team 1 evidence file still carries pending markers (`done_pending_team3_crawl`), so sign-off is not final.

Owner:

- Team 1

## 3. Priority fix order (to move NO-GO -> GO)

## Priority 0 (do first, block-clearing)

1. Team 1: rebuild web export artifacts and rerun public audit

Actions:

- regenerate `apps/web/out` in a local-ready environment (non-placeholder files)
- rerun:
  - `npm run bilingual:public-audit`

Exit criteria:

- `page_html_missing` = `0`

2. Team 2: clear remaining runtime auth `P0`

Target files:

- `apps/app/app/sign-in/page.js`
- `apps/app/components/magic-link-form.js`
- `apps/app/app/(auth)/login/page.tsx`
- `apps/auth/app/layout.tsx`

Action rule:

- move hard-coded runtime auth copy to Team 2 controlled source registry

Exit criteria:

- `npm run bilingual:hardcode-scan` reports `team2UnresolvedP0Count = 0`

## Priority 1 (immediately after P0)

3. Team 1: fix residual metadata/alt mismatches (if still present after rebuild)

Focus:

- `/for-hosts/` canonical + hreflang
- brand logo alt parity `en`/`vi`

Exit criteria:

- `canonical_mismatch = 0`
- `hreflang_mismatch = 0`
- `logo_alt_language_mismatch = 0`

4. Team 1: finalize sign-off artifact

Update:

- `docs/TEAM_1_BILINGUAL_PUBLIC_WEB_EVIDENCE_2026-04-23.md`

Exit criteria:

- no pending markers (`done_pending_team3_crawl`, `in_progress`, `todo`) for bilingual release sign-off scope

## Priority 2 (final release authority)

5. Team 3: rerun full bilingual gate + release verify

Run order:

- `npm run bilingual:source-check`
- `npm run bilingual:public-audit`
- `npm run bilingual:hardcode-scan`
- `npm run bilingual:founder-report`
- `npm run release:verify`

Exit criteria for GO:

- all bilingual gate scripts pass
- founder decision becomes `GO`
- Team 1 + Team 2 sign-off both ready

## 4. Suggested parallel execution map

Lane A (Team 1):

- P0-1 artifact rebuild + crawl rerun
- P1-3 residual SEO/alt corrections
- P1-4 sign-off finalization

Lane B (Team 2):

- P0-2 auth-runtime copy centralization in 4 files

Lane C (Team 3):

- monitor reports on each run
- issue go/no-go update after every gate cycle

## 5. Fastest path estimate

Fastest critical path is:

1. Team 1 clears `page_html_missing`
2. Team 2 clears `12` unresolved `P0`
3. Team 1 finalizes sign-off
4. Team 3 reruns gate and issues final decision

If all three teams run in parallel, this is the shortest route to turn `NO-GO` into `GO`.
