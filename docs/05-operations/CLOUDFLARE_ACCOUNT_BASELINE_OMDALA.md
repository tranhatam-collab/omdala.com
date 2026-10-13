# CLOUDFLARE_ACCOUNT_BASELINE_OMDALA

## OMDALA.COM
## Cloudflare Account Baseline
## Version 1.0

---

## 1. Purpose

This file records the real Cloudflare baseline that is already reachable for OMDALA development.

It exists to prevent:

- wrong account selection
- accidental reuse of unrelated infrastructure
- inconsistent Pages project naming
- ambiguous D1 and R2 binding decisions later

---

## 2. Active account

Primary Cloudflare account for current OMDALA work:

- `93112cc89181e75335cbd7ef7e392ba3`
- label: `Tranhatam66@gmail.com's Account`

This account was confirmed through `wrangler` using explicit `CLOUDFLARE_ACCOUNT_ID`.

---

## 3. Current non-OMDALA Pages inventory

Observed non-OMDALA Pages projects already present in this account:

- `nhachung-app`
- `cios-iai-one`
- `iai-dash`
- `iai-flow-frontend`
- `iai-developer`
- `nhachung-landing`
- `ai-muonnoi-org`
- `noos-iai-one`
- `thanhtamfoundation-com`
- `docs-iai-one`
- `iai-web`

Rule:

- none of these projects should be repurposed as the canonical OMDALA deploy target
- OMDALA should use clean, dedicated project names

---

## 4. Current D1 inventory

Observed D1 databases:

- `NHACHUNG_DB`
- `iai-db`
- `iai-flow-db`

Rule:

- do not bind OMDALA runtime to these databases by default
- create a dedicated OMDALA D1 database when the API layer is ready for persistence

---

## 5. Current R2 inventory

Observed R2 buckets:

- `iai-flow-files`
- `iai-media`
- `iai-media-dev`

Rule:

- do not bind OMDALA proof or media storage to these buckets by default
- create a dedicated OMDALA R2 bucket when proofs/media move beyond mock data

---

## 6. Locked OMDALA target names

Provisioned Pages targets for OMDALA:

- Pages: `omdala-web` → `omdala-web.pages.dev`
- Pages: `omdala-app` → `omdala-app.pages.dev`
- Pages: `omdala-admin` → `omdala-admin.pages.dev`
- Pages: `omdala-docs` → `omdala-docs.pages.dev`

Locked worker target:

- Worker: `omdala-api`

Reserved future resource names:

- D1: `omdala-db`
- R2: `omdala-files`

These names should be treated as the default unless a later approved rename is made intentionally.

---

## 7. Final rule

Cloudflare work for OMDALA must always pin the account explicitly, use OMDALA-specific resource names, and avoid inheriting unrelated infrastructure unless the repository documents that choice clearly first.
