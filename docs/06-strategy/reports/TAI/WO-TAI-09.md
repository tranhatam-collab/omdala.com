# WO-TAI-09 report
Order: WO-TAI-09 (correct documents that count the keyword screen as safety coverage). Status: DONE for TAI paths; two outside-path items listed for T0. Base SHA: 5c8871b.
Files (om-ai.omdala.com, docs only): AI_OM_RELEASE_CRITERIA.md, RELEASE_CHECKLIST.md, AI_OM_LAUNCH_CHECKLIST.md (section 6), AI_OM_TEST_PLAN.md (section 7), AI_OM_CONTROL_PASS_STATUS_2026.md, PROJECT_STATUS_SNAPSHOT.md. Each now says moderation in code is a keyword screen, not a classifier, and points at docs/OMAI_MODERATION_SCOPE.md. No criterion was ticked or removed.
Searched: every .md under om-ai.omdala.com for moderation, safety, self-harm, escalation, guardrail, safe_for_children; the specs that only describe planned behavior (provider router, security model, live extension, error matrix, proof schema) make no claim about the current code and were left alone.
Outside TAI paths, for T0 to route: (1) docs/VERIFIED_PROGRESS_2026-04-29.md lines 48 and 61 list `POST /v2/live/moderation/check` as "SAFETY" and a passing "moderation escalation" test; it should say keyword screen only. (2) docs/OMDALA_MASTER_EXECUTION_PLAN_2026-04-27.md line 208 assigns a "moderation pipeline" to Team 1; the screen is not that pipeline.
Commands: docs-only change; `git diff --stat` 6 files, 7 insertions, 4 deletions. No code or tests touched.
Evidence: VERIFIED_WORKTREE_ONLY.
Next: WO-TAI-10.
