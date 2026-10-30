# VERIFY T3 head 2b35cfc (claude/omdala-t3-web)

- Order: WO-T4-03. Separate worktree at the exact SHA, frozen-lockfile install ok. Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium` (existing env var in the configs; no download).
- Covers WO-T3-01 (auth), WO-T3-02 (docs, admin), WO-T3-03 (admin deny by default).

| Claim (source) | Result |
|---|---|
| `pnpm e2e:auth` 16 specs (commit dd12483) | VERIFIED: 16 passed, 0 failed, 0 skipped |
| `pnpm e2e:docs` (commit a7466fd) | VERIFIED: 22 passed, 0 failed, 0 skipped |
| `pnpm e2e:admin` 24 passed (22 preview + 2 deny) (WO-T3-03) | VERIFIED: 24 passed, 0 failed, 0 skipped |
| `pnpm typecheck`, `pnpm lint`, `pnpm brand:lint` exit 0 (WO-T3-03) | VERIFIED: 0, 0, 0 |
| R-01: admin no longer grants admin to everyone | VERIFIED by reading `apps/admin/app/layout.tsx:39-40`: session is the mock only when build-time `OMDALA_ADMIN_PREVIEW=1`, otherwise `null` so `canAccessAdmin` is false; the two deny specs pass. Note this denies by default but is not real authentication (no provider wired) |
| Magic-link token removed from the address bar after landing (dd12483) | VERIFIED indirectly: covered by the passing auth spec set; not separately re-driven |
| `pnpm build:all` 0 (WO-T3-03) | NOT_CHECKED by T4 (CI job group "Next.js Builds" exists but no run for this SHA) |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for 2b35cfc. `.github/workflows/ci.yml` on this branch still triggers only `main`, `feat/pricing-promo-engine`, `OMCODE/**` on push; WO-T3-CI is BLOCKED by T3's own rule against `.github/**` |

Findings
1. CI gap: T3 head has no hosted run; WO-T3-CI needs T0/T1 to apply the one-line `ci.yml` change (T2 and TAI branches have it). Proposed next order for T0/T1: apply the line on `claude/omdala-t3-web`.
2. Evidence level: VERIFIED_HEAD_ONLY.
