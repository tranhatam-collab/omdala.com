# Proposed migrations

`0004_reality_scenes_runs.sql` is written, reviewed against the expand-only policy
(`inspectExpandOnlySql` accepts it) and tested with real SQL, but it is **not yet in
the applied set**: promoting it also changes two hard-coded expectations in
`scripts/verify-migration-compatibility.test.mjs` (T1's path), which currently assert
that the manifest contains exactly three migrations.

Nothing reads this folder except the T2 tests and the local stand-up. To promote
(T1, one commit):

1. `git mv infra/postgres/migrations/proposed/0004_reality_scenes_runs.sql infra/postgres/migrations/`
2. Append to `compatibility.json` `migrations`:
   `{ "version": "0004_reality_scenes_runs", "file": "0004_reality_scenes_runs.sql", "sha256": "<sha256 of the file>", "mode": "expand-only" }`
   (`sha256sum` of the file at promotion time; at the time of writing
   `81d8b8b8cb5d598501a2438f7f47545f94b659a9d79498dfbd26fa569acf066b`).
3. In `scripts/verify-migration-compatibility.test.mjs`, add `"0004_reality_scenes_runs"`
   to the expected pending versions (lines ~48 and ~215) and one more `"expand-only"`
   to the expected modes.

Then delete this folder. The manual reversal is `../rollback/0004_reality_scenes_runs.down.sql`.

## 0005_ai_usage_ledger (WO-T2-20)

Same path as 0004, same lease. `0005_ai_usage_ledger.sql` (sha256
`7c3fe2c2b0ad16b3ad08605a02222d4c90982fab51974d76c4d897a154c1707a`)
adds the per-owner daily counter and the per-request ledger behind the AI cost cap.
Promote it after 0004 (it does not depend on it): move the file, append its
`compatibility.json` entry (`expand-only`), add `"0005_ai_usage_ledger"` and one more
`"expand-only"` to the two expectations in `scripts/verify-migration-compatibility.test.mjs`.
Manual reversal: `../rollback/0005_ai_usage_ledger.down.sql`.
Until it is applied, staging and production answer chat with 503 (the cap is required and
the ledger is unreachable), which is the intended fail-closed state.

## 0006_om_ai_bridge_credentials (WO-T2-21)

Same path and lease. sha256 `fd2bfef62ae21f27c2f3d43e2de0ad208b46634a9eb6a19f56bc5de3e97111f2`. Backs the revocable Om AI bridge credential rows.
Promote after 0005 with the same three steps (move, `compatibility.json` entry, two
expectations in `scripts/verify-migration-compatibility.test.mjs`). Manual reversal:
`../rollback/0006_om_ai_bridge_credentials.down.sql`. The bridge routes answer 501 in
staging and production regardless of the schema (`bridgeReleased`), so promotion alone
does not release anything; the release change is a separate owner decision.

## 0007_account_ids (WO-T2-23)

sha256 `c25e67f0b2ed09298dcaf6252d2fa080b73f6d6b097cef0c13d95eb83a7f2791`. Stores the stable account id used as the bridge credential `sub`. Same
promotion steps as 0004 to 0006 (WO-T1-06). Manual reversal: `../rollback/0007_account_ids.down.sql`
(only on a database with no live bridge credentials).
