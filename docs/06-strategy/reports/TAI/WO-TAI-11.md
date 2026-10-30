# WO-TAI-11 report
Order: WO-TAI-11 (contract documents follow the code). Status: DONE. Base SHA: f86bf49.
Files (om-ai.omdala.com, docs only): AI_OM_LIVE_API_CONTRACT_V1.md, AI_OM_API_CONTRACT_V1.md (change note at the top of each), AI_OM_ERROR_CODE_MATRIX.md (codes the backend returns), docs/OMAI_API_CONTRACT_MATRIX_2026-10-30.md (update section).
Changes: envelope `{data, error, meta?}` and `{code, reason?}`; session statuses `blocked | active | ended | failed`; create request and response as implemented (extra request fields ignored, new 403/422 codes); connect, token and bootstrap documented as fail-closed 503; plans upgrade documented as closed (403 PLAN_CHANGE_REQUIRES_BILLING); moderation request `{text}` and response with `method`; usage shape; end response with placeholder summary; auth described as a server-bound principal. Recap path settled: today the `summary` of the end response; the dedicated path is `GET /sessions/:id/recap` (not implemented); the memory summary path is withdrawn. 33 sections of the Live contract marked "Not implemented".
Commands (om-ai.omdala.com/backend): `npm test` 69 pass / 0 fail / 0 skip (contract tests from WO-TAI-10 unchanged and green). No code changed.
Evidence: VERIFIED_WORKTREE_ONLY.
Findings: other spec files (for example the iOS/Android module specs and the live extension) still describe the older envelope and flow; they were outside this order.
Next: WO-TAI-12 once WO-T2-17 lands; otherwise none.
