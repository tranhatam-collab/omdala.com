# VERIFY T3 6def072 (WO-T3-20)
Method: head merged into a scratch worktree with the other lines (see WO-T4-18), frozen-lockfile install, full suites run.
Result VERIFIED_WORKTREE_ONLY: e2e:app 44 pass/1 skip as claimed; web 31, auth 28, docs 49, admin 26, brand 39. Hosted CI NOT_CHECKED. Standalone-branch run not done; merged tree passing is the stronger case. WO-T2-29 route behaviour (501 probes) not yet probed, tracked in WO-T4-17.
