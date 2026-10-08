# OMDALA DEPLOYMENT LIVE SYSTEM 2026

## 1. Purpose

Define the live deployment model for OMDALA across frontend, API, auth, storage, and operational monitoring.

This document is intended for infra and deployment handoff.

---

## 2. Domains

Production domains should map as follows:

- `omdala.com` → Cloudflare Pages
- `docs.omdala.com` → Cloudflare Pages
- `app.omdala.com` → Cloudflare Pages
- `admin.omdala.com` → Cloudflare Pages if exposed
- `api.omdala.com` → Cloudflare Workers
- `auth.omdala.com` → Cloudflare Workers or auth service entrypoint

Rules:

- keep docs and app on the global domain layer
- keep auth on `auth.omdala.com`
- do not route core auth or global services through city-node domains

---

## 3. Cloudflare Setup

Minimum setup:

- create Pages projects for global web surfaces
- create Worker services for API and auth
- bind PostgreSQL connection through environment variables
- bind R2 for proof storage
- bind Queues for async processing where needed

---

## 4. Database Strategy

Production recommendation:

- PostgreSQL via Neon, Supabase, or equivalent managed provider

Development / early-stage option:

- D1 only for lightweight experimentation or local-friendly setup

Rules:

- production truth should live in PostgreSQL
- proof blobs should not live in the primary transactional tables

---

## 5. CI/CD

Recommended GitHub Actions flow:

- install dependencies
- typecheck
- build workspace targets
- deploy Workers
- deploy Pages

Recommended deployment modes:

- preview deploys per branch
- production deploys from protected branch only

---

## 6. Security Requirements

Required baseline:

- HTTPS everywhere
- JWT or signed session auth
- rate limiting
- WAF
- environment separation
- restricted secret handling

Additional requirements:

- audit logs for auth-sensitive actions
- proof access control
- policy enforcement for high-trust operations

---

## 7. Monitoring and Reliability

Required monitoring:

- Cloudflare logs
- uptime checks
- error alerts
- latency tracking
- auth redirect health
- API health endpoint monitoring

Recommended operational dashboards:

- web status
- API status
- proof processing health
- trust update health

---

## 8. Deployment Risks

- broken auth redirects across domains
- stale environment config between preview and production
- silent proof storage failures
- missing observability for async jobs

---

## 9. Next Actions

1. Lock Pages and Worker project names.
2. Define production env variables by environment.
3. Add CI/CD workflow for build and deploy.
4. Add monitoring for API, auth, and proof pipelines.
