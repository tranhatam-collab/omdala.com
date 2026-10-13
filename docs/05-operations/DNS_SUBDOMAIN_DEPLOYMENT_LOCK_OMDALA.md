# DNS_SUBDOMAIN_DEPLOYMENT_LOCK_OMDALA

## OMDALA SYSTEM
## DNS + Cloudflare Deployment Lock
## Version 1.1

---

## 1. Purpose

This file locks:

- DNS architecture
- subdomain ownership
- Cloudflare routing
- deployment separation
- security expectations per surface

---

## 2. Root domain

Primary domain:

`omdala.com`

Required:

- Cloudflare-managed zone
- SSL mode `Full (strict)`
- Always Use HTTPS enabled
- non-www redirect enforced

---

## 3. Core DNS records

Required first-party records:

- `@` → web project
- `www` → redirect to apex
- `app` → product app
- `api` → worker or API edge service
- `docs` → docs project
- `admin` → admin project
- `trust` → public trust project or dedicated route
- `status` → status project or external status surface

Use explicit records for all production surfaces. Do not rely on wildcard routing for branded hosts.

---

## 4. Cloudflare Pages / Workers split

Recommended projects:

- `omdala-web`
- `omdala-app`
- `omdala-docs`
- `omdala-admin`
- `omdala-api`

Current Pages target status:

- `omdala-web` provisioned
- `omdala-app` provisioned
- `omdala-docs` provisioned
- `omdala-admin` provisioned

If `trust.omdala.com` is separated later, create a dedicated deployment target for it.

Observed Cloudflare account baseline:

- account id `93112cc89181e75335cbd7ef7e392ba3`
- active Pages projects already exist for other systems
- active D1 databases currently include `NHACHUNG_DB`, `iai-db`, and `iai-flow-db`
- active R2 buckets currently include `iai-flow-files`, `iai-media`, and `iai-media-dev`

Rule:

- do not silently reuse legacy `iai-*` or `nhachung-*` data/storage surfaces for OMDALA
- provision dedicated OMDALA Pages targets first
- provision dedicated OMDALA D1 and R2 resources only when backend binding is ready

---

## 5. Environment policy

Production:

- `main`

Preview:

- pull request previews only

Rules:

- previews must be noindex
- previews must not become canonical
- staging or preview URLs must never enter public sitemaps

---

## 6. Edge security

Required:

- WAF
- bot protection
- rate limiting on API
- Zero Trust on `admin.omdala.com`

`admin.omdala.com` must never be treated as a public surface.

---

## 7. Cache policy

Static assets:

- aggressively cached

HTML:

- cache with revalidation discipline

API:

- no blind caching for sensitive or authenticated endpoints

---

## 8. Required headers

At minimum:

- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Content-Security-Policy`

---

## 9. Final deployment rule

Every subdomain must have:

- clear business purpose
- clear technical owner
- clear index/noindex policy
- clear deployment target

No random subdomain should be created for experimentation without an owner and an SEO policy.
