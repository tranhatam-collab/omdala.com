# Team 2 -> Team 1 Handoff (CTA + Naming) - Provisional

Date: 2026-04-19
Owner: Team 2
Receiver: Team 1
Status: PROVISIONAL REVIEW REQUEST

Primary reference:

- `docs/TEAM2_ROUTE_INVENTORY_REDIRECT_MATRIX_PROVISIONAL_2026-04-19.md`

## Goal

Ask Team 1 to confirm naming/CTA authority for product surfaces before Team 2 final label lock.

## What Team 2 needs from Team 1

1. Canonical naming token for product-facing references currently shown as:
- `OMDALA App`
- `OMDALA Auth`
- `OMDALA Admin`
- generic `Provider` wording on observability surface

2. CTA destination validation for cross-surface entry points:
- `app -> auth` login bridge CTA (`/login` on app surface)
- `signup -> login` CTA inside app auth-group routes
- dashboard quick-action CTAs (`nodes/resources/trust/offers/requests`)

3. Approval on whether legacy route labels should remain visible during transition:
- `/sign-in` (legacy)
- `/nodes`, `/requests`, `/trust` legacy `.js` pages parallel to grouped routes

## Decision checklist (Team 1)

Mark each line as `Approved` / `Needs change`.

### A. Product naming

- [ ] `OMDALA App` label is approved for app surface shell
- [ ] `OMDALA Auth` label is approved for auth surface shell
- [ ] `OMDALA Admin` label is approved for admin surface shell
- [ ] `Provider routing health` wording is approved as neutral naming

### B. CTA mapping

- [ ] App `/login` CTA target to `https://auth.omdala.com/login?next=...` is approved
- [ ] App signup page CTA back to `/login` is approved
- [ ] Dashboard CTA map (`/nodes`, `/resources`, `/trust`, `/offers`, `/requests`) is approved

### C. Transition wording

- [ ] Legacy route labels can remain during provisional phase
- [ ] Team 1 requests immediate hide/deprecate treatment for legacy routes

## Blocking impact if not approved

If Team 1 does not sign this packet, Team 2 will keep label/CTA state as provisional and will not final-lock Sprint 3 interface labels.

## Expected response format from Team 1

1. Approved naming tokens list (final strings).
2. CTA matrix delta (if any route target must change).
3. Legacy route visibility decision (keep or hide).
