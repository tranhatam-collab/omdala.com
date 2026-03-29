# DEPLOYMENT_RUNBOOK_OMDALA

## OMDALA.COM
## Deployment Runbook
## Version 1.0

---

## 1. Purpose

This file defines the first practical deployment path for OMDALA demo surfaces on Cloudflare Pages.

---

## 2. Provisioned Pages targets

- `omdala-web`
- `omdala-app`
- `omdala-admin`
- `omdala-docs`

Cloudflare account:

- `93112cc89181e75335cbd7ef7e392ba3`

---

## 3. Local deploy commands

From repo root:

- `pnpm install`
- `pnpm deploy:web:preview`
- `pnpm deploy:app:preview`
- `pnpm deploy:admin:preview`
- `pnpm deploy:docs:preview`

These commands:

1. build the selected Next app as a static export
2. read the corresponding `out/` directory
3. deploy that folder to the matching Cloudflare Pages project

---

## 4. GitHub Actions deploy path

Use `.github/workflows/deploy-pages.yml`.

Required secret:

- `CLOUDFLARE_API_TOKEN`

Manual inputs:

- `surface`: `web`, `app`, `admin`, or `docs`
- `deploy_branch`: use `preview` for demo iterations, or `main` only when intentionally promoting

---

## 5. Current rule

Until a richer server-capable deployment path is introduced, all four demo surfaces should remain static-exportable so preview demos can be published quickly and inspected in Cloudflare.
