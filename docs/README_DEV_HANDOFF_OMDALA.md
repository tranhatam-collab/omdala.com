# README_DEV_HANDOFF_OMDALA

# PROJECT: OMDALA

## 1. Core concept

OMDALA is the global coordination system.

It is the master brand and platform layer for:

- identity
- resources
- matching
- trust
- AI orchestration
- real-world action

OMDALAT is not a sibling brand. It is the first city implementation under OMDALA.

## 2. Domain model

- `omdala.com` = global homepage
- `app.omdala.com` = web app
- `api.omdala.com` = backend
- `docs.omdala.com` = docs

## 3. Recommended repo structure

```text
/apps
  /web
  /app

/packages
  /ui
  /core
  /api-types

/services
  /api
  /auth
  /matching
  /trust
  /ai
```

## 4. Tech direction

Frontend:

- Next.js
- Tailwind CSS
- Framer Motion only where useful

Backend:

- Cloudflare Workers
- D1 initially
- R2 for proofs and files

Auth:

- Magic link or passwordless-first

Payments:

- Stripe

AI:

- external LLM gateway with structured outputs

## 5. Core modules

- Identity
- Node
- Resources
- Offers
- Requests
- Matching
- Messaging
- Booking
- Payment
- Trust
- AI
- Admin

## 6. MVP priority

P1:

- auth
- node
- homepage

P2:

- resources
- offers
- requests

P3:

- matching
- messaging

P4:

- booking
- payment

P5:

- trust
- proof

P6:

- AI

## 7. Design rules

- Signal & Substrate UI: deep space substrate, cyan signal, gold only for verified proof
- minimal, clear, premium, mobile-aware, action-focused
- squared system surfaces, not soft lifestyle cards
- no decorative gold, no hype gradients, no local-travel visual language
- respect `prefers-reduced-motion`

## 8. Copy rules

Avoid:

- hype
- startup jargon
- empty futurism

Use:

- clear
- operational
- calm
- premium

## 9. Critical principle

If a feature does not help:

- activate value
- coordinate action
- build trust

do not build it.

## 10. Initial implementation sequence

1. freeze domain language through `docs/OMDALA_BRANDPRO_LOCK_2026-05-12.md`
2. run `npm run brand:lint` and `npm run brand:lint:static`
3. build master homepage
4. scaffold app shell
5. implement node and resource model
6. implement requests and offers
7. implement matching and messaging
8. implement booking and trust
9. add AI action layer

## 11. Team dev brand gate

Before a team merges a UI/copy/docs route change, it must check:

1. `docs/BRAND_ARCHITECTURE_OMDALA.md`
2. `docs/OMDALA_V2_SIGNAL_SUBSTRATE.md`
3. `docs/OMDALA_BRANDPRO_LOCK_2026-05-12.md`
4. `docs/OMDALA_BRANDPRO_APPLY_REPORT_2026-05-12.md`

Team-specific rules:

- Team 1 / repo-health: keep the lock packet and branch evidence current; do not stage unrelated worktree noise.
- Team 2 / docs-admin: remove stale wording that makes OMDALA sound like a local listing board, tourism product, generic marketplace, or chatbot.
- Team 3 / release-evidence: package before/after proof for web, static fallback, brand-lint, and build commands.

## 12. Final definition

OMDALA is not just a product.
OMDALA is the global operating layer.
