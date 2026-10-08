# OMDALA Phase 0–1 Audit Baseline and Execution Backlog — 2026-07-19

Verdict: **NO-GO for any new release; HOLD all production mutation**  
Audit mode: evidence-first, read-only except for this audit packet  
Scope completed: repository/source verification, document/config inventory, live read-only probes, contradictions, risks, dependency backlog

## 1. Executive finding

OMDALA is not currently auditable as a single deployable source tree. Public surfaces exist, but the primary checkout has no valid `HEAD`, all visible files are untracked, current CI is internally inconsistent, active plans contradict one another, and at least one critical live surface (`auth.omdala.com`) returns a semantic not-found page with HTTP 200.

The immediate job is not to add product features. It is to restore provenance and establish one source of truth. A green local test from the current directory would not close that problem.

## 2. Provisional source-of-truth map

| Domain | Current candidate | Status |
|---|---|---|
| Repository source | None established | **BLOCKED** |
| Git release anchor | None established | **BLOCKED** |
| Live runtime truth | Direct HTTP/DNS receipts per surface | Partial only; no deployed SHA |
| Audit governance | This Phase 0–1 packet and supplied acceptance command | Active for audit procedure only |
| Execution work order | `OMDALA_SINGLE_TEAM_MASTER_PLAN_2026-05-19.md` claims authority | Conflicts with newer plans and current source |
| Product direction | Global-first draft vs local/country Brand Factory direction | Founder decision required |
| Infrastructure | Cloudflare Worker/D1 descriptions vs VPS/PostgreSQL/Keycloak/OpenFGA compose | Unresolved |
| Release state | Canonical index says GO; execution board says HOLD | **Contradiction** |

No existing document is accepted as sole product/release source of truth until it is reconciled against canonical source and current live evidence.

## 3. Material contradictions

### C-01 — GO versus HOLD

- `DOCS_SOURCE_OF_TRUTH_INDEX_2026-04-08.md` identifies itself as canonical and reports release GO.
- `PROJECT_EXECUTION_BOARD.md` reports HOLD and names the May single-team plan as authoritative.
- Current Git and live-auth evidence support neither an unconditional GO nor a 100% completion claim.

Decision: release remains NO-GO until gates are rerun from a canonical commit.

### C-02 — Product scope

- Newer global ecosystem material positions OMDALA as global-first and explicitly avoids executing a local-brand network in Phase 1.
- The requested direction expands a local Brand Factory model into ten nearby countries and province/city branches.
- Existing live surfaces have not been mapped to either complete information architecture.

Decision required: preserve OMDALA as the global control/platform brand, then represent countries, administrative regions, and local brands as governed tenants/nodes—not separate hand-built products. This is the least-conflicting target, but it remains a Founder lock until documented.

### C-03 — Infrastructure topology

- App handoff material references Cloudflare Workers and D1.
- Current infra compose defines VPS PostgreSQL, Keycloak, OpenFGA, model router, backup services.
- Worker configuration and VPS configuration coexist without a canonical data/auth/control-plane boundary.

Decision required: one architecture decision record defining edge, control plane, system of record, identity, authorization, storage, queue, backup, and failover ownership.

### C-04 — CI/package manager

- Root declares pnpm and contains only `pnpm-lock.yaml`.
- Root CI uses `npm ci`.

Required fix after source recovery: standardize CI on the locked package manager or intentionally add and govern an npm lockfile. Do not maintain two accidental lock authorities.

### C-05 — Current source versus QA reports

- QA documents report route-group cleanup as complete.
- Current filesystem contains both `(brand-exchange)/dashboard` and `(dashboard)/dashboard`, and analogous profile/settings routes, which resolve to duplicate public paths in Next.js.

Required fix after source recovery: prove route ownership and remove/redirect duplicates in the canonical branch, then run build and route smoke tests.

## 4. Risk register

| ID | Priority | Risk | Impact | Closure receipt |
|---|---|---|---|---|
| SRC-001 | P0 | Primary worktree has no valid HEAD | No trustworthy diff/build/release provenance | Canonical commit selected; clean status; reviewed delta manifest |
| SRC-002 | P0 | Entire project tree is untracked | Code and artifacts cannot be distinguished | Clean reconstructed integration branch |
| SEC-001 | P0 | Secret-bearing local env files in untracked tree | Accidental disclosure/commit | Secret-name inventory, rotation decision, ignore rules, secret scan |
| CI-001 | P0 | CI uses `npm ci` without npm lockfile | CI cannot reproduce/install reliably | CI run bound to commit passes with canonical lockfile |
| ROUTE-001 | P0 | Duplicate Next.js route groups | Build failure or ambiguous runtime route | Build pass and route manifest receipt |
| AUTH-001 | P0 | Auth hostname serves not-found content with HTTP 200 | Login/identity unavailable or misrouted | Auth E2E and correct HTTP semantics on production candidate |
| GOV-001 | P1 | Multiple active plans disagree on GO/HOLD and scope | Team repeats work or deploys wrong architecture | Founder-signed source-of-truth index and ADRs |
| DEPLOY-001 | P1 | No live commit/release identifier | Cannot prove source/live parity or rollback target | Deployment receipt with SHA/digest per surface |
| DNS-001 | P1 | `www.omdala.com` unresolved | Broken canonical/redirect SEO path | DNS and redirect tests pass |
| ARCH-001 | P1 | D1/Worker and VPS/PostgreSQL topologies conflict | Data drift, auth split, unsafe migration | Approved architecture/data ownership ADR |
| DOC-001 | P1 | Reported master/governance/infra files are absent now | Lost decisions and misleading handoff | Recovered or formally superseded documents |
| QA-001 | P1 | Historical QA claims contradict filesystem | False confidence | Fresh receipts generated from canonical commit |
| FS-001 | P2 | Filesystem read timeouts/partial hydration | Incomplete audit/build | Fully hydrated clean worktree and checksum inventory |
| SCOPE-001 | P2 | Nested products and generated outputs blur monorepo boundary | Slow CI and accidental releases | Workspace ownership manifest and ignore policy |
| DOC-002 | P2 | Approximately 196 Markdown files within two levels of docs | Navigation and contradiction debt | Archive map plus concise active index |
| TOOL-001 | P2 | Mixed Node/package/toolchain generations | Non-reproducible developer builds | Version matrix and CI matrix receipts |
| CLEAN-001 | P3 | Orphan names and temporary-looking roots | Operational confusion | Reviewed cleanup manifest; recoverable archive |

## 5. Dependency-ordered execution backlog

### Gate G0 — Preserve and recover source identity (P0)

1. Freeze production mutation and current checkout.
2. Snapshot/checksum current filesystem without collecting secret values.
3. Hydrate timed-out files and record failures.
4. Fetch/clone into a clean isolated worktree.
5. Founder selects canonical repo, branch, commit, Cloudflare account, and release surfaces.
6. Diff current filesystem against canonical commit and review each delta.
7. Reconstruct a clean integration branch. No blind reset or bulk add.

Exit: valid HEAD, clean baseline, reviewed dirty scope, source identity receipt.

### Gate G1 — Governance lock (P0/P1)

1. Create one `START_HERE.md` after G0, not before.
2. Mark every plan `ACTIVE`, `REFERENCE`, `SUPERSEDED`, or `ARCHIVED`.
3. Lock decisions: global platform model; country/region tenant hierarchy; database location; Cloudflare account ownership; auth stack; OMCODE repository boundary.
4. Write architecture and data-ownership ADRs.

Exit: no two active documents assign contradictory ownership or release state.

### Gate G2 — Reproducible build and CI (P0)

1. Standardize root package manager and Node version matrix.
2. Repair CI install/build commands.
3. Resolve duplicate route groups.
4. Establish generated-artifact and nested-project boundaries.
5. Run typecheck, lint, unit tests, builds, and static route checks from clean commit.

Exit: commit-bound CI receipts; no ignored failure; no untracked build input.

### Gate G3 — Architecture and security baseline (P0/P1)

1. Define Cloudflare edge versus sovereign PostgreSQL control plane.
2. Define D1/KV/R2/Queues/Hyperdrive lifecycle: KEEP, MERGE, MIGRATE, ARCHIVE, DELETE_LATER.
3. Define Keycloak/Auth.js/Access and OpenFGA responsibilities.
4. Inventory secret names, remove local production secrets, rotate where exposure cannot be excluded.
5. Validate migrations, tenancy/RLS/authorization, audit logs, backup, restore, and rollback.

Exit: threat model, least-privilege matrix, migration receipts, restore test.

### Gate G4 — Product architecture for 10-country expansion (P1)

Do not create hundreds of bespoke sites. Build one governed multi-tenant Brand Factory:

`Global OMDALA → Country → Province/State/Region → City/District → Local Node → Brand/Place`

Initial proposed countries by geographic proximity and operational relevance, subject to legal/market validation: Vietnam, Laos, Cambodia, Thailand, Myanmar, Malaysia, Singapore, Indonesia, Philippines, and Brunei. “Nearest” must be defined by the business criterion before final ranking.

Required shared entities: Tenant, Country, AdministrativeRegion, LocalNode, Place, Brand, Owner, Consent, Product, Experience, ImageAsset, ComplianceProfile, Inquiry, Site, DomainBinding, Translation, AgentRun, Approval, EvidenceLog, Release.

Required safeguards:

- country-specific locale, currency, timezone, address and administrative schemas;
- legal/compliance packs reviewed locally;
- owner consent and image/source rights;
- AI may prepare 80–90%, but public publish requires human approval;
- no Google Maps-derived public claim without owner verification;
- one renderer/design system with local theme tokens, not forked codebases;
- tenant isolation, RBAC/ABAC, audit, rollback, cost limits, and content provenance.

Exit: approved domain model, one-country pilot spec, localization contract, compliance ownership.

### Gate G5 — Staging acceptance (P1)

1. Deploy exact commit to isolated staging.
2. Verify auth, permissions, tenant isolation, database migrations, APIs, uploads, inquiries, admin approval, preview/publish/rollback.
3. Verify bilingual/localized content, accessibility, SEO, performance, mobile layouts, rate limits, audit logs, and monitoring.
4. Run restore drill against staging.

Exit: all mandatory acceptance gates PASS with receipts and zero unresolved P0/P1.

### Gate G6 — Founder production approval (P0 control)

1. Present release SHA, artifact digests, migration/rollback plan, known risks, staging receipts, backup/restore receipt.
2. Obtain explicit Founder approval.
3. Deploy serially by surface; run smoke and semantic checks after each.
4. Record release and rollback anchors.

Exit: production behavior matches approved acceptance contract and release receipt.

## 6. Current scoring

This score measures verified release readiness, not feature volume.

| Dimension | Verified score |
|---|---:|
| Source provenance | 0/10 |
| Governance consistency | 2/10 |
| Reproducible build/CI | 1/10 |
| Architecture/data ownership | 3/10 |
| Security/auth/authorization | 2/10 |
| Automated quality evidence | 1/10 |
| Staging/release traceability | 1/10 |
| Production semantic health | 4/10 |
| Backup/restore/rollback | 0/10 |
| Product/localization/compliance readiness | 2/10 |
| **Total** | **16/100 verified** |

This is not a judgment that only 16% of code exists. It means only 16% of the required production-acceptance chain is presently supported by current, attributable receipts.

## 7. 10/10 completion rule

OMDALA reaches 10/10 only when all of the following refer to the same accepted release:

1. canonical source commit;
2. clean and reproducible dependency state;
3. CI test/build evidence;
4. architecture/data/auth decisions;
5. security and tenant-isolation evidence;
6. staging E2E and restore evidence;
7. Founder approval;
8. per-surface deployment receipt with SHA/digest;
9. live semantic checks, monitoring and rollback anchor;
10. current documentation matching actual runtime.

No description, test count, file count, HTTP 200, or self-report can substitute for this chain.
