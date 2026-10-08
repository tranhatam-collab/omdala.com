# OMDALA v2.0 Founder Review Checklist

Date: 2026-05-09
Scope: Omdala.com only
Branch: `brand/v2.0-signal-substrate`
Status: Review packet

## Verdict

`DEMO_REVIEW_PACKET_READY`

## Current Truth

- Branch exists: `brand/v2.0-signal-substrate`
- Branch is tracking remote: `origin/brand/v2.0-signal-substrate`
- Current demo verdict: founder review pending
- Verified implementation scope remains limited to `apps/web`
- The branch is still not merge-ready

## Verified Evidence

- brand change is append-only CSS overlay in `apps/web/app/globals.css`
- supporting brand document exists:
  - `docs/OMDALA_V2_SIGNAL_SUBSTRATE.md`
- brand-lint script exists and passes:
  - `bash scripts/brand-lint-omdala.sh apps/web/app`
- remote branch ref resolves successfully:
  - `refs/remotes/origin/brand/v2.0-signal-substrate`
- `apps/web` production build passes on the demo branch:
  - `docs/OMDALA_V2_BUILD_SEPARATION_NOTE_2026-05-09.md`

## Review Questions

Founder review should answer these in order:

1. Does the Signal & Substrate direction fit OMDALA as a platform brand?
2. Does gold remain sufficiently constrained to verification-only use?
3. Is the visual shift strong enough to justify moving beyond demo status?
4. Should this remain web-only for now, or is expansion sequencing in the v2.0 doc still correct?

## Evidence Still Missing Before Merge

- preview/render evidence for the branch

## Founder Sign-Off Checklist

- [ ] approve or reject the visual direction
- [ ] approve or reject gold-as-verification-only usage
- [ ] approve or reject keeping this branch web-only for now
- [ ] approve or reject moving from demo-ready to PR-ready after evidence closure

## Non-Approval Examples

- “looks interesting”
- “continue”
- “we can revisit later”

## Approval Example

- “Approve the brand/v2.0-signal-substrate direction as the Omdala web demo direction. Keep it web-only for now, close the remaining preview/render evidence gap, then return for PR-ready review.”

## Next Action

- keep this branch in demo-only state
- close the remaining preview/render evidence gap
- return to founder with the same checklist and explicit evidence attached
