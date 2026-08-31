# OMDALA Team 3 Bilingual Gate Execution

Date: April 23, 2026
Status: Active dispatch
Scope: Team 3 validation, release gate, and founder report for the bilingual rebuild

Use this file to execute `BL-S1-T3-01`, `BL-S1-T3-02`, `BL-S1-T3-03`, and the Team 3 Sprint 2 gate tasks from `docs/OMDALA_BILINGUAL_3_TEAM_SYNC_EXECUTION_2026-04-22.md`.

## 1. Team 3 rule for this lane

Team 3 owns gate clarity. A release is not allowed to rely on verbal confirmation when a script or report can prove the state.

## 2. Sprint 1 tasks Team 3 must close first

| Task ID | Owner | File/module scope | Output artifact | Done when |
| --- | --- | --- | --- | --- |
| `BL-S1-T3-01` | Validation lead | `scripts`, release docs | `docs/TEAM_3_BILINGUAL_RELEASE_GATE_DESIGN_2026-04-23.md` | gate rules are written and each rule has fail/pass behavior |
| `BL-S1-T3-02` | QA automation lead | `apps/web`, `content`, `scripts` | `docs/TEAM_3_BILINGUAL_PUBLIC_CRAWL_SPEC_2026-04-23.md` | crawl scope lists URLs, metadata fields, alt fields, text nodes, canonical, hreflang, and schema checks |
| `BL-S1-T3-03` | Release lead | release docs | `docs/OMDALA_BILINGUAL_PRELIVE_REPORT_2026-04-23.md` | founder report shell contains the 10 mandatory report sections |

## 3. Gate layers

### Layer A - Source integrity

Initial script now available:

```bash
npm run bilingual:source-check
```

This script checks:

- `content/en.json` and `content/vi.json` parse successfully
- `en` and `vi` source trees have matching shape
- the required public pages exist in both `pages` and `publicPages`
- no empty strings or placeholder-like copy exists in the source
- the main public page components read from `getPublicPageBodyCopy`

### Layer B - Public crawl

Target script to build next:

- `scripts/bilingual-public-audit.mjs`

Required checks:

- URL inventory for `/` and every `/en/*` and `/vi/*` public route
- exactly one H1 per public page
- title and meta description per language
- canonical correctness
- hreflang correctness
- OG title and OG description per language
- schema name and description
- internal links stay in the active language
- image alt text present and language-correct
- language switcher points to equivalent routes

### Layer C - Hard-code and product text scan

Target script to build next:

- `scripts/bilingual-hardcode-scan.mjs`

Required checks:

- scan `apps/web`, `apps/app`, `apps/auth`, `apps/admin`, and `packages/ui`
- ignore generated folders: `.next`, `out`, `node_modules`, `test-results`
- report public-facing string literals that are not coming from approved content sources
- classify findings by Team 1, Team 2, or Team 3 ownership

### Layer D - Release block

Target release integration:

- `scripts/release_verify.sh`
- `package.json`

Required behavior:

- fail release if `npm run bilingual:source-check` fails
- fail release if public crawl has missing metadata, missing alt text, or language switch mismatch
- fail release if Team 2 has unresolved `P0` product copy findings
- produce a founder-readable summary before any live decision

## 4. Founder pre-live report shell

Team 3 must create and maintain:

- `docs/OMDALA_BILINGUAL_PRELIVE_REPORT_2026-04-23.md`

Required sections:

1. total URLs reviewed
2. total pages fixed
3. Vietnamese issues fixed
4. English issues fixed
5. metadata standardized
6. alt text standardized
7. CTA/form/menu/footer standardized
8. blocked pages, if any
9. locked language decisions
10. final confirmation: Vietnamese, English, SEO, live readiness

## 5. Handoff dependencies

| Needed from | Artifact | Why Team 3 needs it |
| --- | --- | --- |
| Team 1 | public route inventory, metadata parity, alt-text inventory | required for public crawl counts and SEO gate |
| Team 2 | product text inventory and source strategy | required for product hard-code scan and P0/P1 release blocking |
| Team 3 | gate output and founder report | required before release authority can issue go/no-go |

## 6. Immediate next actions

1. Run `npm run bilingual:source-check` after each Team 1 content change.
2. Create the release gate design artifact.
3. Build the crawl spec before implementing the full crawler.
4. Keep failed findings grouped by owner so Team 1 and Team 2 can act without ambiguity.
