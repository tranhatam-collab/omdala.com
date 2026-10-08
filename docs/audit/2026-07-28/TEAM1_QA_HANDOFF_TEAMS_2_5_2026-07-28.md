# OMDALA Team 1 QA Handoff for Teams 2-5

Date: 2026-07-28
Auditor: Team 1
Verdict: `HOLD`

No team may report complete from build output alone. Closure requires source SHA, command output, runtime behavior and owner receipt.

## Team 2 - API, auth and data

Status: `BLOCKED / FAIL`

- Decide and implement one data architecture. Governance says D1-only while canonical API and production use PostgreSQL/Hyperdrive.
- Fix `GET /v2/reality/nodes` production 500.
- Restore or explicitly remove the missing `/v2/live/*` contract.
- Implement and run real login-to-session E2E without mocked session/provider responses.
- Prove migration, rollback and tenant-isolation against the selected staging database.
- Submit API test, auth E2E, migration and runtime receipts.
- Add the selected D1 or Hyperdrive binding to `services/api/wrangler.toml`; Team 1 release preflight intentionally fails while no binding is declared.

## Team 3 - Brand Exchange and app runtime

Status: `NOT BUILT / PARTIAL`

- Build the canonical Phase 1 Brand Exchange packages and application. Planning files do not count as runtime.
- Implement the 13 locked Phase 1 app modules, including brand portfolio, editor, proof vault, listing workflow, deal room, admin queue and runtime truth.
- Connect `brand.omdala.com` public inquiry to authenticated `app.omdala.com` workflow.
- Close all lint findings owned by `apps/app`, `apps/web`, `apps/admin`, `apps/auth`, `apps/docs`, `packages/ui` and product-facing core modules.
- Reconcile Playwright with current copy and runtime behavior. Current local receipt: App 1/9 passed; Web 0/1 passed after cold-start timeout was removed from the equation.
- Submit bilingual, SEO, a11y, browser and private-inventory E2E receipts.

## Team 4 - Omone, Om AI, OMCode and Omniverse

Status: `FAIL / NOT RELEASED`

- Omone: perform forensic source reconciliation. Do not merge or rebase histories that have no merge base without an inventory and schema diff.
- Omone: fix Neon CI request and Node 22 deployment workflow, then produce exact-SHA E2E evidence.
- Om AI: include the product in an intentional workspace/CI boundary, deploy API routes and public surface, then prove persistence, provider routing, usage, billing and safety.
- OMCode: make `/workspace` reachable from the deployed product and close all five production Playwright failures.
- Omniverse: either build the executable product and E2E contract or formally park the domain and remove it from go-live scope.

## Team 5 - QA, security, SEO, legal and operations

Status: `FAIL`

- Triage the final lint baseline exposed by Team 1: 213 findings, including 73 errors and 140 warnings before owner fixes.
- Replace mocked auth-only acceptance with at least one real session journey.
- Run complete Playwright suites in CI and attach traces for failures.
- Complete EN/VI metadata, canonical, hreflang, schema, alt text and language switching inventory.
- Obtain legal review for Brand Exchange drafts before any public seller or transaction flow.
- Execute monitoring, alert, backup/restore and rollback drills against the selected staging architecture.

## Required receipt format after every work session

```text
Team:
Baseline SHA:
Task IDs:
Files changed:
Commands run:
Pass:
Fail:
Runtime receipt:
Remaining blocker:
Next action:
True state:
```

Documentation-only movement does not increase implementation completion unless the task is explicitly a governance or legal-document task.
