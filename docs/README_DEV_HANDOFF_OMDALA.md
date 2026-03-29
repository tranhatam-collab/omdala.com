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

- minimal
- clear
- premium
- mobile-aware
- action-focused

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

1. freeze domain language
2. build master homepage
3. scaffold app shell
4. implement node and resource model
5. implement requests and offers
6. implement matching and messaging
7. implement booking and trust
8. add AI action layer

## 11. Final definition

OMDALA is not just a product.
OMDALA is the global operating layer.

