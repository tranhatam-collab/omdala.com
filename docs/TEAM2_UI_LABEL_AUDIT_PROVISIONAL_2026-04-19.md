# Team 2 UI Label Audit (Provisional)

Date: 2026-04-19
Owner: Team 2
Status: PROVISIONAL (not final lock)

## Dependency gates (must pass before final lock)

1. Team 1 must hand off naming and CTA authority before Team 2 finalizes product-facing labels.
2. Team 3 must hand off auth/session/runtime contract before Team 2 finalizes redirect/guard logic.
3. Team 2 Sprint 3 cannot be self-closed before evidence pass is delivered to Team 3.

## Audit scope

- `apps/app`
- `apps/auth`
- `apps/admin`

## Findings (provisional)

### P1 - Mixed product naming on admin provider surface

- File: `apps/admin/app/providers/ProviderObservabilityDashboard.tsx`
- Current labels include: `Om AI provider routing health` and translated variants with `Om AI`.
- Risk: cross-surface naming drift in Team 2-owned product/admin interfaces.
- Provisional action: mark these labels as pending Team 1 naming authority; do not final-lock wording yet.

### P1 - Product copy contains internal team references

- File: `apps/app/app/(dashboard)/settings/page.tsx`
- Current copy includes `Team 1 entry point` and `billing-aware Om AI events are now locked`.
- Risk: user-facing copy leaks org-internal language and mixed product naming.
- Provisional action: replace with neutral product wording after Team 1 handoff.

### P2 - Legacy placeholder wording remains on admin landing

- File: `apps/admin/app/page.tsx`
- Current copy includes `former placeholder`.
- Risk: production surface still references implementation history.
- Provisional action: rewrite to capability-focused summary once Team 1 copy authority is synced.

### P2 - Route authority ambiguity due parallel legacy JS routes

- File: `apps/app/app/nodes/page.js`
- Current copy includes `Placeholder lane for the next build phase.`
- Related legacy paths present in route tree: `apps/app/app/sign-in/page.js`, `apps/app/app/requests/page.js`, `apps/app/app/trust/page.js`.
- Risk: duplicate route paradigms (legacy JS pages vs grouped `(auth)/(dashboard)` routes) can create CTA/label ambiguity.
- Provisional action: keep route map as provisional and defer final route/label freeze until Team 1 CTA authority and Team 3 runtime contract are both confirmed.

### P3 - Redirect guard uses hardcoded auth host (await Team 3 contract freeze)

- File: `apps/app/app/(dashboard)/DashboardAuthGate.tsx`
- Current behavior redirects to `https://auth.omdala.com/login?...` when session invalid.
- Risk: if Team 3 runtime contract changes callback/cookie/session rules, Team 2 lock would be premature.
- Provisional action: keep behavior as provisional-compliant; finalize only after Team 3 handoff.

## Provisional normalization targets (not yet final)

1. Replace `Om AI` labels on Team 2 product/admin surfaces with Team 1-approved naming token set.
2. Remove internal process terms (`Team 1 entry point`, `former placeholder`) from user-facing copy.
3. Remove `placeholder` wording from active surfaces.
4. Keep redirect/guard copy aligned to Team 3 auth/session terminology once contract handoff arrives.

## Evidence notes

- Confirmed detections via source scan in listed files.
- Some workspace files intermittently returned I/O timeouts during reads; findings above are based on successfully read high-impact UI files.

## Provisional actions applied (2026-04-19)

1. `apps/admin/app/page.tsx`
- Removed phrase `former placeholder` from admin landing copy.

2. `apps/admin/app/providers/ProviderObservabilityDashboard.tsx`
- Replaced `Om AI` in provider routing title labels with neutral provider wording across supported languages.

3. `apps/app/app/(dashboard)/settings/page.tsx`
- Removed internal org wording (`Team 1 entry point`) from user-facing copy.
- Replaced `billing-aware Om AI events` with neutral `billing-aware provider events`.

4. `apps/app/app/nodes/page.js`
- Replaced `Placeholder lane` wording with rollout-oriented wording.

## Exit from provisional to final

Team 2 can convert this audit to FINAL only when:

1. Team 1 sends naming + CTA authority handoff.
2. Team 3 sends auth/session/runtime contract handoff.
3. Team 2 reruns label + redirect audit and submits evidence pass to Team 3 release gate.
