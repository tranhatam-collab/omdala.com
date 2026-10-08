# OMDALA Git Hygiene Recovery Plan

Date: 2026-05-07
Scope: Omdala.com only
Owner: Team 1 platform and release authority
Status: Active blocker plan

## Verdict

`GIT_HYGIENE_BLOCKER_PLAN_ACTIVE`

## True State

`LOCAL_CHECKPOINT_EXISTS`
`NORMAL_GIT_FLOW_UNSTABLE`
`REPO_HYGIENE_BLOCKS_CLEAN_PUBLISHING`

## Known Good Anchors

- Current branch: `OMCODE/chore/wip-checkpoint-2026-05-04`
- Local checkpoint commit: `a60a190cf69dc655e1199f6c064e9b50dc41f573`
- `HEAD` resolves successfully
- No active `index.lock` has been observed during recent read-only checks
- `lsof .git/index` has not shown an open handle for the Omdala.com repo
- System-wide process check did not reveal an active Git process targeting Omdala.com

## Confirmed Current Blockers

- `.git` still contains duplicate/stale index artifacts:
  - `.git/index 2`
  - `.git/index 3`
  - `.git/index.lock.stale-20260504-after-write-tree`
  - `.git/index.lock.stale-20260504-omcode-checkpoint`
- `.git/objects/pack` still contains duplicate/temp pack artifacts:
  - `pack-97011f9f267fbe84d94fab0c773de1e37b1fcb6d 2.idx`
  - `pack-97011f9f267fbe84d94fab0c773de1e37b1fcb6d 2.pack`
  - `tmp_idx_*` (12 observed)
  - `tmp_pack_*` (14 observed)
  - `tmp_rev_*` (12 observed)
- `.git/objects/7b/5b535a18a12674b2f1901410848b3760d68772` is a loose blob object:
  - object type: `blob`
  - logical size: `86610864` bytes
  - on-disk compressed size observed: about `27M`
- `.git/refs/remotes/origin/feat/omniverse-auth-o1-o2 2` exists as a duplicate remote-tracking ref with a space suffix
  - target SHA: `89842757990d914565974ef43a58bfb1d5e5b822`
  - this invalid duplicate ref shape is a likely contributor to noisy or failing broad ref/object traversal

## Backup Attempts

### Attempt 1

- Command: `cp -R .git .git.backup-20260508-115524`
- Result: stalled very early
- Partial output remained at roughly `96K`
- This partial directory is not a valid backup

### Attempt 2

- Command: `tar -cf /private/tmp/omdala-git-backup-20260508-123235.tar .git`
- Result: archive created and grew to roughly `12M-13M`, then stalled
- Process was terminated after repeated size checks showed no growth
- This partial tar archive is not a valid completed backup

### Attempt 3

- Method: composite backup assembled from verified-copyable `.git` subtrees and files
- Output root: `/private/tmp/omdala-git-backup-composite-20260508-161515`
- Result: completed successfully
- Verification:
  - observed backup size: about `55M`
  - source file count: `3295`
  - copied file count: `3295`
  - copied content includes `objects`, `refs`, `logs`, `worktrees`, `hooks`, `info`, `index`, `index 2`, `index 3`, stale lock artifacts, `HEAD`, `config`, `packed-refs`, `AUTO_MERGE`, `gk`, `opencode`, and commit/edit metadata

## Interpretation

- Two direct whole-`.git` backup strategies stalled in this environment:
  - `cp -R .git ...`
  - `tar -cf ... .git`
- The repo has at least one very large loose blob outside the main pack cleanup path, which may be contributing to backup instability
- The repo also contains a duplicate remote-tracking ref with a space suffix, which is a concrete Git-hygiene anomaly and should be treated as a cleanup candidate only after backup is complete
- Attempts to traverse object history are also unstable:
  - `git rev-list HEAD --objects` triggered a promisor-remote fetch path and failed on remote resolution
  - `git rev-list a60a190 --objects` failed on a missing local object while traversing commit ancestry
- A focused single-file copy of the large loose blob succeeded:
  - source: `.git/objects/7b/5b535a18a12674b2f1901410848b3760d68772`
  - copied output: `/private/tmp/omdala-large-blob-test`
  - observed copied size: about `27M`
- This suggests the large blob alone is not sufficient to explain why whole-`.git` backup attempts stall
- A focused copy of the full `.git/refs` tree also succeeded:
  - source size observed: about `36K`
  - copied output root: `/private/tmp/omdala-refs-test`
  - copied content included the malformed remote-tracking ref with space suffix
- This suggests the `refs` layer is anomalous but not itself the primary I/O bottleneck for backup creation
- A focused copy of the full `.git/objects` tree also succeeded:
  - source size observed: about `55M`
  - copied output root: `/private/tmp/omdala-objects-test`
  - source file count observed: `3235`
  - copied file count observed: `3235`
- This suggests the full `objects` tree can be copied successfully on its own in the current environment
- A focused copy of the remaining non-`objects`, non-`refs` Git metadata also succeeded:
  - copied output root: `/private/tmp/omdala-git-meta-test`
  - observed copied size: about `204K`
  - copied content included: `HEAD`, `config`, `index`, `packed-refs`, `logs`, `worktrees`, `hooks`, `info`, `FETCH_HEAD`, `ORIG_HEAD`, `COMMIT_EDITMSG`
- This suggests the major Git subtrees and core metadata all copy successfully when targeted explicitly
- This means the blocker is not limited to duplicate/temp files; object-graph completeness and promisor integrity are also in play
- A valid backup path now exists via the composite assembled backup method
- The blocker has moved forward from "no viable backup" to "backup exists, cleanup can begin cautiously with the current integrity risks documented"

## Recovery Sequence

### Phase 1

Create and verify a reliable `.git` backup path.

Status:

- complete via `/private/tmp/omdala-git-backup-composite-20260508-161515`

### Phase 2

After Phase 1 is complete, quarantine small batches of confirmed duplicate/temp Git internals:

- `.git/index 2`
- `.git/index 3`
- `.git/index.lock.stale-20260504-after-write-tree`
- `.git/index.lock.stale-20260504-omcode-checkpoint`
- `.git/refs/remotes/origin/feat/omniverse-auth-o1-o2 2`
- `pack-97011f9f267fbe84d94fab0c773de1e37b1fcb6d 2.idx`
- `pack-97011f9f267fbe84d94fab0c773de1e37b1fcb6d 2.pack`
- `tmp_idx_*`
- `tmp_pack_*`
- `tmp_rev_*`

Rules:

- quarantine first
- do not touch `.git/index`
- do not touch primary pack/index files
- verify `HEAD` after every small batch

Current batch classification:

- Batch 2A — safest first candidates
  - `.git/index.lock.stale-20260504-after-write-tree`
  - `.git/index.lock.stale-20260504-omcode-checkpoint`
  - reason: both are zero-byte stale lock artifacts
  - status: quarantined to `/private/tmp/omdala-git-quarantine-20260508-165129`
  - verification:
    - both files are absent from `.git`
    - both files exist in quarantine
    - `git rev-parse --verify HEAD` still resolves after the move

- Batch 2B — byte-identical duplicate pack artifacts
  - `.git/objects/pack/pack-97011f9f267fbe84d94fab0c773de1e37b1fcb6d 2.idx`
  - `.git/objects/pack/pack-97011f9f267fbe84d94fab0c773de1e37b1fcb6d 2.pack`
  - verification:
    - duplicate `.idx` matches primary file byte-for-byte
    - duplicate `.pack` matches primary file byte-for-byte
  - status: quarantined to `/private/tmp/omdala-git-quarantine-20260508-165129`
  - post-move verification:
    - both duplicate pack files are absent from `.git/objects/pack`
    - both duplicate pack files exist in quarantine
    - `git rev-parse --verify HEAD` still resolves after the move

- Batch 2C — higher-risk candidates, do not quarantine early
  - `.git/index 2`
  - `.git/index 3`
  - reason: neither file is byte-identical to the active `.git/index`
  - further verification:
    - both files are parseable as valid Git index files
    - both expose the same tracked path set size: `711`
    - the active index currently exposes only `43` tracked paths on the current brand-demo branch
    - at least `695` paths in `index 2` are absent from the current active index path set
  - interpretation:
    - these look more like preserved index snapshots from a materially broader working tree than disposable duplicate garbage
    - do not quarantine them until there is a stronger recovery rationale
  - status: next unresolved higher-risk batch

- Batch 2D — ref anomaly after backup and early low-risk cleanup
  - `.git/refs/remotes/origin/feat/omniverse-auth-o1-o2 2`
  - reason: malformed duplicate remote-tracking ref shape; should be handled after lower-risk stale-lock and byte-identical duplicate cleanup
  - status: quarantined to `/private/tmp/omdala-git-quarantine-20260508-165129/omniverse-auth-o1-o2 2`
  - post-move verification:
    - duplicate ref is absent from `.git/refs/remotes/origin`
    - primary ref `feat/omniverse-auth-o1-o2` still exists and still points to `49b4b94313a83c224da4520bbac7e0cacd8124e4`
    - `git rev-parse --verify HEAD` still resolves after the move

### Phase 3

Run light integrity verification after Phase 2 quarantine:

- prefer `git fsck --no-dangling`
- stop if the result is unclear or introduces a new failure mode

## Hard Stop

Do not run destructive cleanup, `git gc`, `.git` deletion, or large push attempts until:

- a valid backup path exists
- Phase 2 targets are quarantined in small batches
- each step is verified and documented

## Definition Of Done

This blocker is closed only when:

- a valid backup exists
- stale duplicate/temp Git internals are quarantined
- `HEAD` still resolves
- normal local Git workflows become reliable again
- the final true state is recorded in the execution board

## Latest Post-Cleanup Verification Snapshot

Checked at: 2026-05-08 Asia/Ho_Chi_Minh

Observed results:

- `git status --short`: completed successfully
- `git rev-parse --verify HEAD`: completed successfully
- `git rev-list --count HEAD`: completed successfully and returned `5`
- `git rev-list HEAD --objects --max-count=5`: partially returned objects, then failed by re-entering the promisor-remote fetch path
- `git rev-list --objects --max-count=20 HEAD --not --remotes=origin`: completed successfully with no promisor-fetch failure

Interpretation:

- Early low-risk cleanup appears to have improved basic local Git behavior enough for lightweight status and revision-count operations to succeed
- The repo is still not healthy enough for broad object traversal without hitting promisor-remote integrity problems
- However, object traversal limited to local-only commits outside current origin refs now succeeds, which narrows the remaining failure surface further
- The remaining blocker has narrowed further: basic local commands are partly healthier, but object-graph traversal still crosses into unresolved promisor-fetch failure

## Latest `git fsck --no-dangling` Snapshot

Checked at: 2026-05-08 Asia/Ho_Chi_Minh

Observed results:

- command exited non-zero with concrete integrity failures
- repeated invalid reflog target:
  - missing commit `374321b2ecbcaec000c95ca1c48ce74e4b2f9e4c`
- affected reflogs:
  - `HEAD`
  - `refs/heads/claude/omdala-brand-system-L4Gzx`
  - `refs/remotes/origin/claude/omdala-brand-system-L4Gzx`
- broken links:
  - tree `ad5b7bfb8e798ae0bc6c892244a16a533947ca9b` -> blob `c34653308687815cbbd3d23fb92650f11fb9780c`
  - tree `9d03e82157a809ce0eb8798e222f4aa751fdffa1` -> tree `e54106aa44d48082885be136125d45bebbc69f1c`
  - tree `2d8e7b9595bfd4282c8bca589c825ab8377258b0` -> tree `0ba699a0f638b8e2dbe91148ddd3120a208f3d3f`
  - commit `d92638cda2590f4e2fe02e97dc8c82c9ecb8a2c3` -> commit `374321b2ecbcaec000c95ca1c48ce74e4b2f9e4c`
- missing objects confirmed by `fsck`:
  - commit `374321b2ecbcaec000c95ca1c48ce74e4b2f9e4c`
  - tree `e54106aa44d48082885be136125d45bebbc69f1c`
  - tree `0ba699a0f638b8e2dbe91148ddd3120a208f3d3f`
  - blob `c34653308687815cbbd3d23fb92650f11fb9780c`

Interpretation:

- The remaining Git blocker is now more concrete than a generic promisor-fetch problem.
- We have direct evidence of reflog corruption plus missing historical objects.
- Low-risk cleanup did improve day-to-day local Git commands, but it did not repair historical integrity for all reachable history and reflog paths.
- `index 2` and `index 3` remain deferred because `fsck` now points at missing commit/tree/blob history, not at those preserved index snapshots.

Next action:

- Keep destructive cleanup paused.
- Treat the next recovery phase as historical object and reflog triage, not duplicate-temp cleanup.
- Map whether the missing commit and objects belong only to old Claude-side history or to any path still needed for active Omdala.com publishing.

## Latest Reflog Scope Probe

Checked at: 2026-05-08 Asia/Ho_Chi_Minh

Observed results:

- direct string hits for the missing commit `374321b2ecbcaec000c95ca1c48ce74e4b2f9e4c` were found in:
  - `.git/logs/HEAD`
  - `.git/logs/refs/heads/claude/omdala-brand-system-L4Gzx`
  - `.git/logs/refs/remotes/origin/claude/omdala-brand-system-L4Gzx`
- the same reflog sequence also mentions:
  - commit `d92638cda2590f4e2fe02e97dc8c82c9ecb8a2c3`
  - commit `cd823f87043dbf6957307ab97368b4c249973460`
- current active refs do not point at the missing commit:
  - local heads resolve to:
    - `63433d32c0ad4adfbdd566800c0b11174b75499e` (`IAI.ONE/beautiful-bassi-5923d8`)
    - `a60a190cf69dc655e1199f6c064e9b50dc41f573` (`OMCODE/chore/wip-checkpoint-2026-05-04`)
    - `6d715ffd13ed58b79f31847e1003075dc7e05633` (`brand/v2.0-signal-substrate`)
    - `38dfc87987cf41b805be6aef25da4874cc04ecab` (`feat/omniverse-auth-o1-o2`)
    - `02d9cf8217720fb0378804747fddc298fdcaa834` (`wip/founder-2026-05-08`)
- `refs/heads/claude/omdala-brand-system-L4Gzx` is no longer a valid local ref
- `refs/remotes/origin/claude/omdala-brand-system-L4Gzx` still exists, but currently resolves to `9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`, not to the missing commit chain

Interpretation:

- The currently visible failure surface is increasingly isolated to old Claude-side reflog history rather than to the active Omdala.com publishing heads.
- The missing commit still pollutes `HEAD` reflog history, so the repo is not historically clean yet.
- However, there is still no direct evidence from current refs that active publishing branches themselves point at `374321b2ecbcaec000c95ca1c48ce74e4b2f9e4c`.

Next action:

- Keep active publishing heads treated as provisionally separate from the missing-commit chain.
- Continue read-only triage on whether the broken objects are reachable only through stale reflog entries and obsolete side-lane history.

## Latest Descendant Chain Probe

Checked at: 2026-05-08 Asia/Ho_Chi_Minh

Observed results:

- the commits immediately after the missing commit in the old reflog chain still exist as valid commit objects:
  - `d92638cda2590f4e2fe02e97dc8c82c9ecb8a2c3`
  - `cd823f87043dbf6957307ab97368b4c249973460`
  - `9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`
- reflog evidence shows the old Claude-side lane progressed through:
  - `374321b2ecbcaec000c95ca1c48ce74e4b2f9e4c` -> `d92638cda2590f4e2fe02e97dc8c82c9ecb8a2c3`
  - `d92638cda2590f4e2fe02e97dc8c82c9ecb8a2c3` -> `cd823f87043dbf6957307ab97368b4c249973460`
  - `cd823f87043dbf6957307ab97368b4c249973460` -> `a4a31f180531da5066302fa21a026ed04395f810`
  - `9ed5f9fa9e0637bde8cb5343785a8ee0e18ce503` -> `9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`
- current refs still do not point at the missing commit itself, but they do include descendants on that broader lane:
  - `refs/remotes/origin/claude/omdala-brand-system-L4Gzx` -> `9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`
  - `refs/remotes/origin/copilot/check-security-vulnerabilities` -> `9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`
- local development history also touched that surviving descendant:
  - `refs/heads/feat/omniverse-auth-o1-o2` was created from `9f7ebd9bf0a0912a78a49b25f6e4a29be4222864` before moving forward

Interpretation:

- The missing commit appears to be an early broken ancestor or reflog anchor inside an older Claude-side development lane, not a missing tip commit.
- This is stronger than the earlier hypothesis that the problem was purely stale reflog text; some surviving current refs still sit on later descendants from that broader lane.
- However, active Omdala.com publishing heads still do not directly resolve to the missing commit itself.

Next action:

- Keep distinguishing between active publishing heads and side-lane development history.
- In the next read-only triage pass, determine whether the missing commit and broken tree/blob objects are required for ancestry traversal from any still-live refs, or only for historical completeness and reflog hygiene.

## Latest Reachability Split Probe

Checked at: 2026-05-08 Asia/Ho_Chi_Minh

Observed results:

- ancestry traversal for these still-live side-lane remote refs fails at the same missing ancestor chain:
  - `refs/remotes/origin/claude/omdala-brand-system-L4Gzx`
  - `refs/remotes/origin/copilot/check-security-vulnerabilities`
- both probes returned the same visible prefix, then failed:
  - `9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`
  - `9ed5f9fa9e0637bde8cb5343785a8ee0e18ce503`
  - `a4a31f180531da5066302fa21a026ed04395f810`
  - `cd823f87043dbf6957307ab97368b4c249973460`
  - failure at missing commit `374321b2ecbcaec000c95ca1c48ce74e4b2f9e4c` while traversing parents of `d92638cda2590f4e2fe02e97dc8c82c9ecb8a2c3`
- ancestry traversal for local `refs/heads/feat/omniverse-auth-o1-o2` succeeds cleanly for at least the first `20` commits sampled

Interpretation:

- The missing ancestor is not only a reflog cleanliness issue; it actively breaks ancestry traversal for at least two still-live side-lane remote refs.
- The problem is still not repo-wide in the same way for every active line: `feat/omniverse-auth-o1-o2` traverses normally in the sampled range.
- This gives a cleaner split:
  - affected: surviving Claude-side and mirrored copilot side-lane refs
  - not currently affected in the same sampled way: local `feat/omniverse-auth-o1-o2`

Next action:

- Keep destructive cleanup paused.
- Treat the next recovery phase as ref-scope triage:
  - determine whether those broken side-lane remote refs must be preserved
  - or whether they can be isolated from the active Omdala.com working set without risking the live publishing lines

## Latest Governance-Scope Check

Checked at: 2026-05-08 Asia/Ho_Chi_Minh

Observed results:

- the affected side-lane refs do not appear in the active Omdala.com governance stack except inside the Git blocker analysis itself:
  - `refs/remotes/origin/claude/omdala-brand-system-L4Gzx`
  - `refs/remotes/origin/copilot/check-security-vulnerabilities`
- repository docs continue to treat these as the active Omdala.com lanes:
  - `OMCODE/chore/wip-checkpoint-2026-05-04`
  - `brand/v2.0-signal-substrate`
  - `feat/omniverse-auth-o1-o2`
- the side-lane refs are absent from the startup-truth docs as active execution lanes and only appear in:
  - `docs/OMDALA_GIT_HYGIENE_RECOVERY_PLAN_2026-05-07.md`
  - `docs/OMDALA_STOP_THE_BLEEDING_EXECUTION_BOARD_2026-05-04.md`

Interpretation:

- From a governance perspective, the affected Claude-side and mirrored copilot refs are not part of the current canonical Omdala.com execution lanes.
- This does not yet authorize deleting or isolating them, but it does reduce the risk that they are silently required by the current founder-approved operating plan.
- The active daily Omdala.com local working set is increasingly distinguishable from the broken side-lane refs.

Next action:

- Keep destructive changes paused.
- Use this governance evidence in the next phase to decide whether those affected side-lane refs can be treated as non-canonical local baggage for day-to-day Omdala.com work, pending explicit founder approval before any isolation step.

## Latest Canonical Lane Traversal Check

Checked at: 2026-05-08 Asia/Ho_Chi_Minh

Observed results:

- `git rev-list --max-count=10 OMCODE/chore/wip-checkpoint-2026-05-04` completed successfully
- `git rev-list --max-count=10 brand/v2.0-signal-substrate` completed successfully
- `git rev-list --max-count=10 refs/remotes/origin/main` completed successfully

Interpretation:

- The current canonical Omdala.com lanes all traverse cleanly in sampled history.
- This strengthens the split already seen in earlier probes:
  - canonical lanes are locally usable
  - the broken ancestry is concentrated in non-canonical side-lane remote refs
- This is still not a license to remove or isolate those side-lane refs unilaterally, but it materially lowers the risk that they are needed for the founder-approved daily operating lanes.

Isolation recommendation draft:

- treat `refs/remotes/origin/claude/omdala-brand-system-L4Gzx` and `refs/remotes/origin/copilot/check-security-vulnerabilities` as non-canonical Git baggage candidates
- do not mutate them automatically in heartbeat mode
- if founder approves a narrow Git hygiene action later, isolate those two refs first before considering any deeper historical surgery

Next action:

- Keep destructive changes paused.
- Prepare a narrow founder-facing recommendation that any future isolation step should target the two broken side-lane remote refs first, while leaving the canonical Omdala.com lanes untouched.
