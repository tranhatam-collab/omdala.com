# BL-TAI-01 report
Order: BL-TAI-01 (tests for map rows implemented but untested). Status: DONE for rows reachable without the AI authority. Base SHA: cba5ccb.
Files: om-ai.omdala.com/backend/src/live.metering.test.ts (new), om-ai.omdala.com/docs/OMAI_IMPLEMENTATION_MAP_2026-10-28.md (section 6).
Rows closed since the map: 2 personas, 6 memory profile, 10 moderation, 11 child guard (WO-TAI-02), 9 plan change (WO-TAI-03), 14 web messages (WO-TAI-05), 8 metering (this item).
Commands (om-ai.omdala.com/backend): `npm run typecheck` pass; `npm test` 39 pass / 0 fail / 0 skip (6 new in live.metering.test.ts).
Method: metering split is tested at the store boundary by activating a created session, because the API cannot activate one while the AI authority is blocked.
Evidence: VERIFIED_WORKTREE_ONLY.
Remaining untested and why: row 7 memory export/delete and row 5 transcripts do not exist; rows 3-4 depend on the provider AI lane; row 16 producer side belongs to Team 2; mobile screens for live sessions do not exist (MISSING).
Next: BL-TAI-03.
