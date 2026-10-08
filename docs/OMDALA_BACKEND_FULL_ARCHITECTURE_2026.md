# OMDALA BACKEND FULL ARCHITECTURE 2026

## 1. Purpose

Define the full backend architecture for OMDALA in a form that can guide implementation from MVP to scalable production services.

This document focuses on service boundaries, data responsibilities, event flow, security, and scalability.

---

## 2. Core Backend Services

The backend should be organized around these core services:

- API Gateway
- Auth Service
- Commitment Service
- Transition Engine
- Proof Service
- Trust Engine
- Policy Engine

Each service should own its responsibility clearly and avoid UI or docs concerns.

---

## 3. Service Responsibilities

### API Gateway

Responsibilities:

- request routing
- auth enforcement
- request validation entry
- response normalization
- versioned API contract exposure

Suggested runtime:

- Cloudflare Workers

### Auth Service

Responsibilities:

- login and session validation
- token issuance
- org and role resolution
- auth redirect handling

Boundary rule:

- auth should stay under the OMDALA global domain model

### Commitment Service

Responsibilities:

- create commitments
- validate commitment state changes
- enforce lifecycle rules
- emit commitment events

### Transition Engine

Responsibilities:

- move state from one step to another
- validate allowed transitions
- handle expiry, retry, and failure

### Proof Service

Responsibilities:

- accept proof submissions
- attach proof to commitments or transitions
- coordinate verification workflow

### Trust Engine

Responsibilities:

- compute trust signals
- update trust scores
- provide explainable trust output

### Policy Engine

Responsibilities:

- evaluate policy constraints
- gate sensitive actions
- support operator override and audit

---

## 4. Data Layer

Recommended primary store:

- PostgreSQL

Core tables:

- `nodes`
- `resources`
- `commitments`
- `transitions`
- `proofs`
- `trust_scores`
- `events`

Supporting data stores may include:

- R2 for proof objects
- KV for lightweight cache
- queue-backed persistence for async tasks

Rules:

- use relational storage for canonical state
- store events append-only
- keep proof binaries out of hot transactional tables

---

## 5. Event System

The backend should be event-driven for all major lifecycle changes.

Required events:

- `commitment.created`
- `commitment.accepted`
- `commitment.completed`
- `proof.submitted`
- `proof.verified`
- `trust.updated`

Queue strategy:

- early stage: Cloudflare Queues
- later stage: Kafka or equivalent if volume justifies it

Rules:

- do not bury event creation deep inside unrelated handlers
- every event should map to a domain action
- keep event payloads explicit and versionable

---

## 6. Trust Engine Model

Trust engine inputs:

- verified proofs
- completion behavior
- failure and dispute history
- governance decisions
- historical consistency

Trust engine outputs:

- trust score
- explanation payload
- reason codes
- confidence metadata

Rules:

- trust must be auditable
- trust must not be a black box in production workflows
- trust recomputation should be background-first where possible

---

## 7. Security Model

Minimum security requirements:

- JWT auth or equivalent signed session model
- RBAC
- audit logs
- rate limiting
- input validation on every public endpoint

Additional production requirements:

- role-aware authorization checks
- proof access control
- event traceability for sensitive actions
- operator override audit trail

---

## 8. Scalability Model

The backend should scale under these rules:

- stateless API where possible
- async processing for heavy jobs
- horizontal scaling at the gateway layer
- queue-backed background processing
- DB optimization before premature service explosion

Do not split into too many services too early.

Service separation should happen only when:

- load profile proves it
- ownership boundaries are clear
- operational complexity is justified

---

## 9. Suggested Repo Structure

Suggested backend shape:

```text
services/api/
  src/
    index.ts
    routes/
    middleware/
    domain/
    db/
    events/
    policy/
services/auth/
services/trust/
services/matching/
```

Shared contracts and types should live in `packages/`.

---

## 10. Risks

- over-splitting services before volume requires it
- mixing policy logic into route handlers
- synchronous trust calculation slowing user flows
- weak auditability for proofs and trust changes

---

## 11. Next Actions

1. Lock service boundaries.
2. Define database schema v1.
3. Define event payloads.
4. Implement minimal API gateway and commitment flow.
