# VERIFY T3 head 3c166ec (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok (the one lockfile change is the staged Monaco importer entry); Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over verified `8b37c13`: WO-T3-19 (self-hosted Monaco, `unsafe-eval` removed from the app CSP) and an AGENTS.md restore.

| Claim (WO-T3-19 report) | Result |
|---|---|
| `pnpm e2e:app-export` 2 pass | VERIFIED: 2 passed, 0 failed |
| `pnpm e2e:app` 43 pass, 1 skipped | VERIFIED: 43 passed, 1 skipped, 0 failed |
| `pnpm test:security-headers` 12 pass | VERIFIED: 12 tests, 12 pass |
| `pnpm test:bundle-budget` 10 pass; `pnpm test:inlined-env` 11 pass | VERIFIED: 10 pass / 0 fail; 11 pass / 0 fail |
| `pnpm test:release-governance` 394 pass; `typecheck`; `lint`; `brand:lint` | VERIFIED: 394 pass / 0 fail; 0; 0; 0 |
| Unchanged: `e2e:web` 31, `e2e:docs` 49, `e2e:auth` 28, `e2e:admin` 26, `e2e:brand-exchange` 39 | VERIFIED: 31, 49, 28, 26, 39 passed |
| Lockfile: one importer entry, monaco-editor 0.55.1 | VERIFIED by diff: +3 lines (`monaco-editor` specifier/version 0.55.1) in `pnpm-lock.yaml` |
| `build:all` 0 | NOT_CHECKED as a whole |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for this branch |

The editor-under-CSP claim is checked in WO-T4-16. Evidence: VERIFIED_HEAD_ONLY.
