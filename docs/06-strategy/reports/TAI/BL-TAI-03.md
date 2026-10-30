# BL-TAI-03 report
Order: BL-TAI-03 (MEM-04 memory schema fixtures and validation, no runtime). Status: DONE. Base SHA: e1d3be3.
Files: om-ai.omdala.com/backend/src/memory/schema.ts (new, pure validators), backend/src/memory/fixtures/*.json (6 fixtures: 3 valid, 3 invalid), backend/src/memory-schema.test.ts (new).
Rules encoded from AI_OM_MEMORY_MODEL_V1.md: scope and retention enums; profile and session-recap shapes (spec section 10 examples validate); attribution required on every write; no raw transcript/audio/diagnosis fields; emotional preferences limited to 4 bounded keys; personal emotional memory refused in org/shared scopes; child profiles refused org/shared scope, long_term retention and custom persona memory; session_only needs ephemeral or short_term retention.
Commands (om-ai.omdala.com/backend): `npm run typecheck` pass; `npm test` 47 pass / 0 fail / 0 skip (8 new); `npm run build` pass.
No runtime: a test asserts no route, store or app file imports the schema.
Evidence: VERIFIED_WORKTREE_ONLY.
Findings: the spec has no field for guardian-set retention windows or org retention policy ids, and no schema_version; a decision is needed before persistence (CTL-03). Learning, persona-affinity and subscription layers (spec 3.2, 3.4, 3.6) have no validators yet.
Next: validators for those three layers once CTL-03 fixes the storage shape; otherwise queue empty.
