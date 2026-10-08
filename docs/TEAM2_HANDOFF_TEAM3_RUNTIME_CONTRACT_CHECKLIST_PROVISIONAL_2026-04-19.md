# Team 2 -> Team 3 Handoff (Runtime Contract Checklist) - Provisional

Date: 2026-04-19
Owner: Team 2
Receiver: Team 3
Status: PROVISIONAL CONTRACT REVIEW REQUEST

Primary reference:

- `docs/TEAM2_ROUTE_INVENTORY_REDIRECT_MATRIX_PROVISIONAL_2026-04-19.md`

## Goal

Ask Team 3 to validate runtime/auth/session assumptions consumed by Team 2 redirect and guard logic.

## Rules Team 2 is following

1. Team 2 does not final-lock redirect/guard logic before Team 3 contract handoff.
2. Team 2 does not self-close Sprint 3 without evidence pass delivered to Team 3.

## Contract checklist (Team 3)

Mark each line as `Approved` / `Needs change`.

### A. Domain and redirect contract

- [ ] Auth host is `auth.omdala.com` for login entry
- [ ] App host is `app.omdala.com` for post-auth redirect return
- [ ] Redirect parameter contract is `next` (URL-encoded internal path)
- [ ] Locale propagation with `lang` query is approved

### B. Session verification contract

- [ ] `GET /v1/auth/session` is canonical for app session validity checks
- [ ] Session response includes `expiresAt` and this remains stable
- [ ] Cookie scope for auth session is `.omdala.com`

### C. Magic-link contract

- [ ] `POST /v1/auth/magic-link/request` payload shape (`email`, `redirectTo`) is approved
- [ ] `redirectTo` must be internal path (starts with `/`) is approved
- [ ] `POST /v1/auth/session/exchange` payload shape (`token`, `next`) is approved
- [ ] Exchange response field `redirectTo` is approved and stable

### D. Guard behavior contract

- [ ] App dashboard guard redirect (`auth.omdala.com/login?lang=...&next=...`) is approved
- [ ] Auth surface post-exchange redirect to `https://app.omdala.com${redirectTo}` is approved
- [ ] Admin temporary local role gate (`mock session`) is acceptable in provisional phase

## Redirect rule to contract mapping

- R1 maps to: A1, A3, A4, B1, B2
- R2 maps to: A1, A3
- R3 maps to: C3, C4, B3
- R4 maps to: C1, C2
- R6 maps to: A1 (auth route authority)
- R7 maps to: A2, C3, C4
- R8 maps to: C1, C2
- R9 maps to: D3

## Blocking impact if not approved

If Team 3 does not sign this packet, Team 2 keeps all redirect/guard logic in provisional state and does not mark Sprint 3 route/session work as complete.

## Expected response format from Team 3

1. Approved runtime contract version identifier.
2. Any endpoint/payload/host changes required.
3. Effective date for contract freeze.
