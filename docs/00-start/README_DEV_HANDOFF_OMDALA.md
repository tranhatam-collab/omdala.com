# README_DEV_HANDOFF_OMDALA

## PROJECT: OMDALA

Version: 1.1  
Status: master handoff for design, product, frontend, backend, AI, and operations

---

## 1. Core concept

OMDALA is the master operating layer for:

- identity
- resources
- requests and offers
- matching
- trust
- orchestration
- proof-backed action

It is the parent system, not a local implementation.

---

## 2. Official surfaces

- `omdala.com` — public brand and category surface
- `app.omdala.com` — authenticated product surface
- `api.omdala.com` — versioned API layer
- `docs.omdala.com` — public documentation
- `admin.omdala.com` — internal operations and moderation

---

## 3. Repo model

```text
/apps
  /web
  /app
  /admin
  /docs

/packages
  /ui
  /types
  /seo

/services
  /api
```

Planned next shared layers:

- `packages/core`
- `packages/brand`
- `services/auth`
- `services/trust`
- `services/matching`
- `services/notifications`
- `services/ai`

---

## 4. Tech direction

Frontend:

- Next.js
- TypeScript
- shared design tokens

Backend:

- Cloudflare Workers
- D1 or relational core later
- R2 for files and proofs

Payments:

- Stripe

AI:

- structured-output agentic workflows

---

## 5. Core modules

- Identity and node model
- Resources
- Offers and requests
- Matching
- Messaging
- Booking
- Payments
- Proofs
- Trust
- AI orchestration
- Admin operations

---

## 6. Product principles

- Build for action, not browsing.
- Trust must be explainable and auditable.
- AI must create operational value, not decoration.
- The public brand must remain calm, premium, and clear.
- No local implementation logic should pollute the master OMDALA scope.

---

## 7. Immediate implementation order

1. Keep domain language stable.
2. Build the public OMDALA routes completely.
3. Implement auth and node foundations in the app.
4. Add structured domain objects for resources, offers, and requests.
5. Ship matching and trust services behind typed contracts.
6. Add booking, payment, and proof flows.
7. Expand AI orchestration only after the operational objects are real.

---

## 8. Required docs

These files are now the minimum source of truth:

- `PRODUCT_SPEC_OMDALA.md`
- `DATA_MODEL_OMDALA.md`
- `API_SPEC_OMDALA.md`
- `TRUST_ENGINE_OMDALA.md`
- `MATCHING_ENGINE_OMDALA.md`
- `SEO_MASTER_LOCK_OMDALA_SYSTEM.md`
- `DNS_SUBDOMAIN_DEPLOYMENT_LOCK_OMDALA.md`
- `TECHNICAL_SEO_IMPLEMENTATION_FILES_OMDALA.md`

---

## 9. Final rule

If a feature does not help users see value, coordinate action, or build trust, it is not core OMDALA work.
