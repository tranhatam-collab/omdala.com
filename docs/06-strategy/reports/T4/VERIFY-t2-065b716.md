# VERIFY T2 head 065b716 (claude/omdala-t2-core)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok. Delta over verified `0f8197a`: WO-T2-22 (chat input validated before reserving, bridge mint limits, admin revoke) and WO-T2-23 (stored account id for the bridge `sub`, token verification options). WO-T2-24 (the cap-bypass fix ordered after WO-T4-14) is NOT on this head.

| Claim (T2 reports) | Result |
|---|---|
| `pnpm test:api` with local PostgreSQL: 591 pass | VERIFIED: 41 files, 591 passed, 0 failed, 0 skipped |
| `pnpm test:api` without a database: 526 pass / 65 skip | VERIFIED on 2 runs: 526 passed, 65 skipped, 0 failed |
| `pnpm typecheck`, `pnpm lint`, `pnpm test:core`, `pnpm --filter @omdala/api run check` | VERIFIED: exit 0 each |
| `pnpm test:release-governance` 394 pass | VERIFIED: 394 pass / 0 fail |
| Invalid chat bodies answer 422 before any reservation | Present: `isAiagentChatInputValid` is called at `index.ts:4205`, ahead of the budget gate (read); covered by the passing suite |
| Admin revoke: allowed only for emails in `OMDALA_BRIDGE_ADMIN_EMAILS` (unset = nobody), 501 outside the boundary | VERIFIED independently: staging, production and unset `ENVIRONMENT` answer 501 to admin, non-admin and anonymous callers; in `test`: list unset gives 403 for everyone, list set gives 400 (authorized, my body was invalid) to the admin, 403 to another account, 401 anonymous, and the e-mail match is case-insensitive |
| Cost-cap replay bypass from WO-T4-14 | STILL OPEN at this head (fix is WO-T2-24, not landed). Validation before reserving narrows how a key becomes `released`, but a provider refusal before dispatch still releases it; re-test is WO-T4-15 |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41157452454 "OMDALA CI" on 065b716 concluded success |

Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
