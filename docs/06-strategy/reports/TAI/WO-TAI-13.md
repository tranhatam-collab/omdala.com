# WO-TAI-13 report
Order: WO-TAI-13 (align client and extension specs with the code and contracts). Status: DONE. Base SHA: b8f05e6.
Files (om-ai.omdala.com, docs only; change note at the top of each): AI_OM_IOS_MODULE_SPEC.md, AI_OM_ANDROID_MODULE_SPEC.md, AI_OM_LIVE_ANDROID_REALTIME_CALL_SPEC_2026.md, AI_OM_LIVE_HUMAN_CALL_AND_EDUCATION_EXTENSION_2026.md, OM_AI_LIVE_HUMAN_CALL_AND_EDUCATION_EXTENSION_2026.md.
Changes: each note states the implemented envelope `{data, error, meta?}`, statuses `blocked | active | ended | failed`, fail-closed realtime (503 ai_authority_unavailable), no client session handling until the bridge exists, closed plan change, keyword-screen moderation, and that provider products (OpenAI Realtime, Tavus) are candidates only the OMDALA AI authority may call. In the long extension, section 22.2 now lists what is implemented versus planned, 23.1 to 23.3 show the implemented create request, create response and end response (planned fields called out); in the short extension, 12.2 is marked as the planned shape.
Searched for the old shapes (`"ok"`, connect_ready, ephemeral_token, usage_snapshot, provider_decision, status ready/created) across om-ai.omdala.com/*.md; remaining hits are in API_TEAM_STRICT_REPORT.md (an API-team report, not a live spec) and inside the planned-shape examples now labelled as such.
Commands: docs-only (5 files, +32/-15); no code touched. Backend suite not re-run for this order.
Evidence: VERIFIED_WORKTREE_ONLY.
Next: none; queue empty unless T0 adds orders.
