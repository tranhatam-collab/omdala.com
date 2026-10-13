# OMDALA MASTER ARCHITECTURE

## 1. Purpose

Define the foundational system architecture for OMDALA as a Reality Operating System.

This document is implementation-oriented and serves as the primary reference for developers.

---

## 2. System Definition

OMDALA is a system that coordinates:

- identity
- intent
- resources
- actions
- trust
- AI agents

into a unified execution layer.

---

## 3. High-Level Architecture

User / AI
↓
Intent Layer
↓
Matching & Coordination Engine
↓
Action Execution Layer
↓
Trust & Verification Layer
↓
Data & Storage Layer

---

## 4. Core Layers

### 4.1 Identity Layer

- User identity
- Organization identity
- Agent identity

Responsibilities:

- authentication
- identity mapping
- permission control

---

### 4.2 Intent Layer

- user goals
- requests
- structured input

Responsibilities:

- normalize intent
- validate intent
- route intent

---

### 4.3 Matching Engine

- match intent with resources
- prioritize optimal execution paths

Responsibilities:

- ranking
- filtering
- optimization

---

### 4.4 Resource Layer

- assets
- skills
- availability

Responsibilities:

- allocation
- tracking
- optimization

---

### 4.5 Action Layer

- tasks
- workflows
- execution

Responsibilities:

- create tasks
- assign execution
- monitor status

---

### 4.6 Trust Layer

- reputation
- verification
- history

Responsibilities:

- scoring
- fraud detection
- validation

---

### 4.7 AI Agent Layer

- automated execution
- task optimization
- decision support

Responsibilities:

- perform actions
- assist users
- improve system efficiency

---

### 4.8 Data Layer

- storage
- logs
- audit

Responsibilities:

- persistence
- consistency
- traceability

---

## 5. System Boundaries

OMDALA must separate:

- frontend (app)
- backend (api)
- shared logic (packages)
- infrastructure (infra)
- documentation (docs)

---

## 6. API Boundaries

All interactions must go through:

- structured API endpoints
- clear contracts
- versioned interfaces

No direct coupling between layers.

---

## 7. Data Flow

1. User defines intent
2. Intent is normalized
3. System matches resources
4. Action is created
5. Execution happens
6. Trust is updated
7. Data is stored

---

## 8. Build Order

### Phase 1 — Foundation

- identity
- intent
- basic API

### Phase 2 — Core System

- matching engine
- action system
- resource allocation

### Phase 3 — Intelligence

- AI agents
- optimization logic

### Phase 4 — Scale

- performance
- distributed systems
- global deployment

---

## 9. Risks

- over-engineering early
- unclear boundaries
- uncontrolled AI changes
- lack of data structure discipline

---

## 10. Open Questions

- identity standard
- trust scoring model
- matching algorithm design
- agent autonomy level

---

## 11. Principles

- simplicity over complexity
- clarity over abstraction
- explicit over implicit
- scalable from day one

---

## XIII. Global Routing Rule

All routing must follow this rule:

- `omdalat.com` public surface links only to `docs.omdala.com` or `app.omdala.com`
- `docs.omdala.com` links only to `app.omdala.com`
- `app.omdala.com` does not link back to `omdalat.com`

Correct flow:

- `omdalat.com` → `docs.omdala.com` → `app.omdala.com`

Incorrect flow:

- `app.omdala.com` → `omdalat.com`
- `docs.omdala.com` → `omdalat.com`

---

## XIV. Session & Auth Domain Strategy

Auth domain:

- `auth.omdala.com`

Cookie scope:

- `domain=.omdala.com`

Login flow:

1. `app.omdala.com` → `auth.omdala.com`
2. `auth.omdala.com` authenticates the session
3. redirect back to `app.omdala.com`

Do not use `omdalat.com` for auth.

---

## XV. Future Domain Rule

All future subdomains must belong to:

- `*.omdala.com`

Do not introduce new production subdomains under `*.omdalat.com`, except the city web surface if it is explicitly approved.

Correct examples:

- `finance.omdala.com`
- `trust.omdala.com`
- `graph.omdala.com`

Incorrect examples:

- `finance.omdalat.com`
- `trust.omdalat.com`
