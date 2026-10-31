# BL-TAI-02 report
Order: BL-TAI-02 (contract tests for services/ai). Status: DONE. Base SHA: cba5ccb.
Files: services/ai/tests/suggestions.test.ts (new), services/ai/package.json (`test` script only; no dependency or lockfile change).
Commands (services/ai): `node --test tests/*.test.ts` 5 pass / 0 fail / 0 skip (Node v22.22.0 type stripping, no install). `pnpm typecheck` for this package was not run: it needs the root workspace install, outside this lane; the test directory is outside the tsconfig `include`, so it does not affect that check.
Covered: result shape, unique ids, ordering by priority then confidence, operator-proof rule at 2 vs 3 proofs, planner text with and without resources, no network/env/key reference in source, determinism.
Evidence: VERIFIED_WORKTREE_ONLY.
Finding: no CI job runs `services/ai` tests; request for T1: `node --test tests/*.test.ts` in services/ai (Node 22.18+).
Next: BL-TAI-03.
