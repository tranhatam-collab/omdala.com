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
