# VERIFY T2 369cb50 (WO-T2-27/28/29)
Method: head merged into a scratch worktree with the other lines (see WO-T4-18), frozen-lockfile install, full suites run.
Result VERIFIED_WORKTREE_ONLY: API 643/643 with DB, 556/87 skipped without; typecheck, lint, build pass on merged tree. Hosted CI NOT_CHECKED. Standalone-branch run not done; merged tree passing is the stronger case. WO-T2-29 route behaviour (501 probes) not yet probed, tracked in WO-T4-17.
