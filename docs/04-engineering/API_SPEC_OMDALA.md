# API_SPEC_OMDALA

## OMDALA
## Master API Specification
## Version 1.0

---

## 1. API purpose

The OMDALA API exposes the platform contract for:

- identity
- nodes
- resources
- offers and requests
- matches
- trust
- proof
- action flows

Base URL:

`https://api.omdala.com/v1`

---

## 2. Auth model

Initial direction:

- session or bearer token
- passwordless or magic-link compatible
- role-aware authorization

Every write endpoint must enforce:

- authentication
- ownership or role checks
- auditability

---

## 3. Response envelope

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "forbidden",
    "message": "You do not have access to this resource."
  }
}
```

---

## 4. Route groups

Identity:

- `POST /auth/login`
- `POST /auth/logout`
- `GET /users/me`

Nodes:

- `GET /nodes`
- `POST /nodes`
- `GET /nodes/:id`
- `PATCH /nodes/:id`

Resources:

- `GET /resources`
- `POST /resources`
- `GET /resources/:id`
- `PATCH /resources/:id`

Offers:

- `GET /offers`
- `POST /offers`
- `GET /offers/:id`
- `PATCH /offers/:id`

Requests:

- `GET /requests`
- `POST /requests`
- `GET /requests/:id`
- `PATCH /requests/:id`

Matches:

- `GET /matches`
- `POST /matches/generate`
- `POST /matches/:id/accept`
- `POST /matches/:id/dismiss`

Conversations:

- `GET /conversations`
- `POST /conversations`
- `GET /conversations/:id/messages`
- `POST /conversations/:id/messages`

Bookings and payments:

- `POST /bookings`
- `PATCH /bookings/:id/status`
- `POST /payments`
- `GET /payments/:id`

Proofs and trust:

- `POST /proofs`
- `GET /proofs/:id`
- `GET /trust/:subjectType/:subjectId`
- `POST /trust/events`

Admin:

- `POST /admin/flags`
- `POST /admin/verifications/:id/review`
- `POST /admin/trust/override`

---

## 5. Authorization rules

Public read is allowed only where a surface is intentionally public.

Sensitive write actions require:

- authenticated actor
- subject ownership or delegated role
- audit metadata

Admin routes must never be available to standard members.

---

## 6. Idempotency and audit

Use idempotency for:

- payments
- booking creation where external provider retries may occur
- trust event writes triggered by webhooks

Every sensitive mutation must record:

- actor
- target
- timestamp
- action type

---

## 7. Final rule

The API is not just transport. It is the system contract. If a route cannot explain ownership,
authorization, and resulting state change clearly, it is not ready.
