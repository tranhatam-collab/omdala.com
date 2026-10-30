# VERIFY T3 head 02d5453 (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok (lockfile unchanged); Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over verified `cfcda04`: BL-T3-04 (contact and access-request forms, new UI form specs with a local API stub).

| Claim (BL-T3-04 report) | Result |
|---|---|
| `pnpm typecheck`, `pnpm lint`, `pnpm brand:lint` exit 0 | VERIFIED: 0, 0, 0 |
| `pnpm e2e:web` 15 pass | VERIFIED: 15 passed (8 new contact-form specs) |
| `pnpm e2e:app` 30 pass | VERIFIED: 30 passed, 0 failed, 0 skipped, no network (6 new access-request specs) |
| Unchanged: `e2e:auth`, `e2e:docs`, `e2e:admin`, `test:app` | VERIFIED: 24, 39, 25 passed; 33 passed |
| Bug fixed: signup input `name="nodeName"` shadowed the form property | VERIFIED by diff: at `cfcda04` `AccessRequestForm.tsx:126` had `name="nodeName"`; at `02d5453` it is `name="node-name"` |
| Contact form shows a friendly message on 502/503/504 and non-JSON gateway bodies | Covered by the passing contact-form specs (T3 states they fail on the old code; the old code was not re-run by T4) |
| `build:all` 0 | NOT_CHECKED |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run for this branch; GitHub tools were unavailable this cycle |

Open: web `/vi/*` raw `<html lang="en">` (T0 now lists the fix as WO-T3-11). Evidence: VERIFIED_HEAD_ONLY.
