# OMDALA API BOUNDARIES

## 1. Purpose

Define where API responsibilities begin and end.

This document prevents UI, docs, shared domain logic, and infra concerns from leaking into backend endpoints.

---

## 2. API Responsibility

The API owns:

- request validation
- response shaping
- auth checks
- domain orchestration
- versioned contracts
- persistence coordination

---

## 3. API Must Not Own

- product documentation
- UI state management
- deployment configuration
- shared domain types that belong in `packages/`
- presentation logic

---

## 4. Shared Logic Rule

If logic is reused by both app and api, it belongs in `packages/`.

If logic is deployment-specific, it belongs in `infra/`.

If logic is visual or interactive, it belongs in `app/`.

---

## 5. Versioning Rule

All public API contracts must be versioned.

Rules:

- do not break existing contract shape without a version change
- keep request and response schemas explicit
- document breaking changes before implementation

---

## 6. Boundary Examples

### Allowed in API

- `POST /commitments`
- `GET /nodes/:id`
- auth middleware
- schema validation

### Not allowed in API

- homepage copy
- design tokens
- frontend menu logic
- Cloudflare deployment config

---

## 7. Open Questions

- What runtime will serve the API?
- What is the first public version namespace?
- Which endpoints are public versus authenticated?

---

## 8. Next Actions

1. Define API versioning.
2. Define shared request/response contracts.
3. Add a minimal API skeleton only after the contract layer is fixed.
