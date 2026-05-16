# OMDALA Git Isolation Recommendation

Date: 2026-05-08
Scope: Omdala.com only
Status: Founder review recommended before any destructive action

## Verdict

`NARROW_GIT_ISOLATION_CAN_BE_PREPARED`

## True State

- Composite `.git` backup exists and has been verified.
- Low-risk duplicate/temp cleanup has already been completed.
- Canonical Omdala.com lanes traverse cleanly in sampled history:
  - `OMCODE/chore/wip-checkpoint-2026-05-04`
  - `brand/v2.0-signal-substrate`
  - `origin/main`
- Remaining ancestry failure is concentrated in two non-canonical side-lane remote refs:
  - `refs/remotes/origin/claude/omdala-brand-system-L4Gzx`
  - `refs/remotes/origin/copilot/check-security-vulnerabilities`

## What We Know

1. `git fsck --no-dangling` still reports historical integrity problems:
   - missing commit `374321b2ecbcaec000c95ca1c48ce74e4b2f9e4c`
   - linked missing tree/blob objects
   - invalid reflog entries touching the old Claude-side lane

2. The broken ancestor is not only reflog noise:
   - ancestry traversal fails for both affected remote side-lane refs
   - both fail when traversal reaches the missing ancestor chain

3. The current founder-facing Omdala.com lanes do not show the same sampled failure:
   - checkpoint lane traverses
   - brand demo lane traverses
   - `origin/main` traverses
   - local `feat/omniverse-auth-o1-o2` also traversed cleanly in sampled history

4. Governance evidence says the affected side-lane refs are non-canonical for current Omdala.com operations:
   - they do not appear as active execution lanes in the startup-truth docs
   - they appear only inside Git blocker documentation

## Recommendation

If founder approves a narrow Git hygiene action later, isolate these two refs first:

- `refs/remotes/origin/claude/omdala-brand-system-L4Gzx`
- `refs/remotes/origin/copilot/check-security-vulnerabilities`

Current verified targets at check time:

- `refs/remotes/origin/claude/omdala-brand-system-L4Gzx` -> `9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`
- `refs/remotes/origin/copilot/check-security-vulnerabilities` -> `9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`

Current storage shape at check time:

- both target refs are present in `.git/packed-refs`
- neither target exists as a loose file under `.git/refs/remotes/origin/...`
- both target reflog files do exist:
  - `.git/logs/refs/remotes/origin/claude/omdala-brand-system-L4Gzx`
  - `.git/logs/refs/remotes/origin/copilot/check-security-vulnerabilities`

Do not begin with:

- canonical checkpoint lane
- `brand/v2.0-signal-substrate`
- `origin/main`
- `feat/omniverse-auth-o1-o2`
- `.git/index 2`
- `.git/index 3`

## Why This Is The Narrowest Safe Candidate Set

- They are the only still-live refs currently proven to hit the broken ancestor chain.
- They are outside the founder-approved canonical Omdala.com operating lanes.
- They are already behaving like historical side-lane baggage rather than required daily refs.
- Their current storage shape is explicit enough to plan a narrow ref-aware isolation step without guessing whether loose ref files are involved.

## Required Approval Boundary

This document is a recommendation only.

It does not authorize:

- deleting refs
- rewriting reflogs
- pruning objects
- running `git gc`
- editing packed refs
- force-updating remote state

Any actual isolation step should happen only after explicit founder approval for a narrow Git-ref action.

## Founder Approval Checklist

An execution approval should be considered valid only if it clearly confirms all of these:

- approve isolating only these two refs:
  - `refs/remotes/origin/claude/omdala-brand-system-L4Gzx`
  - `refs/remotes/origin/copilot/check-security-vulnerabilities`
- do not touch canonical lanes:
  - `OMCODE/chore/wip-checkpoint-2026-05-04`
  - `brand/v2.0-signal-substrate`
  - `origin/main`
  - `feat/omniverse-auth-o1-o2`
- use Git-native ref operations only
- run the documented preflight checks first
- run the documented post-verification checks immediately after
- stop after the narrow ref isolation step and re-evaluate before any deeper Git surgery

Non-approval examples:

- “looks fine”
- “continue”
- “clean it up”
- “fix Git”

Approval examples:

- “Approve isolating only the two non-canonical packed remote refs in OMDALA_GIT_ISOLATION_RECOMMENDATION_2026-05-08.md, then stop and report.”

## Proposed Next Step After Approval

1. Record the exact two target refs again.
2. Verify canonical lanes still resolve before action.
3. Quarantine or isolate only those two remote-tracking refs.
4. Re-run:
   - `git rev-parse --verify HEAD`
   - `git status --short`
   - `git fsck --no-dangling`
   - sampled traversal on canonical lanes
5. Re-evaluate whether historical integrity improved enough to justify any deeper step.

## Proposed Preflight And Verification Sequence

Before any approved isolation step:

1. Reconfirm the two ref targets:
   - `git show-ref --verify refs/remotes/origin/claude/omdala-brand-system-L4Gzx`
   - `git show-ref --verify refs/remotes/origin/copilot/check-security-vulnerabilities`
2. Reconfirm storage shape:
   - verify both targets are still in `.git/packed-refs`
   - verify whether either target has become a loose ref file
   - verify both reflog files still exist
3. Reconfirm canonical lane traversal:
   - `git rev-list --max-count=10 OMCODE/chore/wip-checkpoint-2026-05-04`
   - `git rev-list --max-count=10 brand/v2.0-signal-substrate`
   - `git rev-list --max-count=10 refs/remotes/origin/main`
4. Reconfirm baseline local safety:
   - `git rev-parse --verify HEAD`
   - `git status --short`

After any approved isolation step:

1. Re-run:
   - `git rev-parse --verify HEAD`
   - `git status --short`
   - `git fsck --no-dangling`
2. Re-run canonical traversal sampling:
   - `git rev-list --max-count=10 OMCODE/chore/wip-checkpoint-2026-05-04`
   - `git rev-list --max-count=10 brand/v2.0-signal-substrate`
   - `git rev-list --max-count=10 refs/remotes/origin/main`
3. Recheck the packed-ref and reflog surfaces for the two target refs.
4. Re-run the previously failing side-lane traversal probe only if the refs still exist.

## Implementation Constraint

Because the two target refs are packed-only at the moment, an approved isolation step should be designed around ref-aware Git operations or packed-ref-safe handling. It should not assume there are loose ref files available to move under `.git/refs/remotes/origin/...`.

## Tested Git-Native Mechanism

Observed in disposable sandbox repo at check time:

- a remote-tracking ref was created, packed with `git pack-refs --all --prune`, and then deleted with:
  - `git update-ref -d refs/remotes/origin/test-packed <expected-sha>`
- result in sandbox:
  - packed ref entry was removed from `.git/packed-refs`
  - no loose ref file remained
  - the matching reflog file was also removed

Interpretation:

- A future approved isolation step does not need to rely on manual editing of `.git/packed-refs`.
- A Git-native `update-ref -d` path is a plausible narrow mechanism for packed-only remote-tracking ref isolation.
- This is still only mechanism evidence from a sandbox, not authorization to run it in the Omdala.com repo.

Candidate mechanism after explicit approval:

- `git update-ref -d refs/remotes/origin/claude/omdala-brand-system-L4Gzx 9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`
- `git update-ref -d refs/remotes/origin/copilot/check-security-vulnerabilities 9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`

## Tested Rollback Mechanism

Observed in the same disposable sandbox repo:

- after deleting a packed-only remote-tracking ref with `git update-ref -d`, the ref was restored successfully with:
  - `git update-ref refs/remotes/origin/test-packed <sha>`
- result in sandbox:
  - ref became present again as a loose ref under `.git/refs/remotes/origin/...`
  - matching reflog file was recreated
  - `git show-ref --verify` resolved the restored ref successfully

Interpretation:

- A future approved narrow isolation step has a Git-native rollback path.
- The rollback shape is not identical to the pre-delete storage shape:
  - original packed-only ref came back as a loose ref
- That difference is acceptable for rollback planning, but it should be documented in any approval note.

Candidate rollback commands after explicit approval:

- `git update-ref refs/remotes/origin/claude/omdala-brand-system-L4Gzx 9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`
- `git update-ref refs/remotes/origin/copilot/check-security-vulnerabilities 9f7ebd9bf0a0912a78a49b25f6e4a29be4222864`

## Hard Stop

Do not treat this recommendation as permission to perform the isolation automatically in heartbeat mode.
