# OMDALA SCALE MVP PLAN 2026

## 1. Purpose

Define how Zero Overdue evolves from MVP into a production system that can scale operationally, technically, and commercially.

This document is intended for product, engineering, operations, and fundraising alignment.

---

## 2. Scale Objective

Zero Overdue must scale in three stages:

1. 1,000 SMEs with stable core flows
2. 10,000 SMEs with reliable event handling and trust updates
3. 100,000+ commitments per month with clear observability and operational control

The system must preserve:

- low latency
- reliable commitment state transitions
- auditable proof storage
- explainable trust updates

---

## 3. MVP Baseline

The MVP assumes the following minimum working loop:

1. business creates invoice-backed commitment
2. customer receives and accepts commitment
3. payment proof is attached
4. trust signal is updated
5. operator can review and resolve exceptions

Current MVP scope:

- commitments
- proofs
- trust basic
- simple operator UI

---

## 4. Scale Architecture

### Tier 1: 0 to 10k users

Goal:

- validate product-market and workflow fit

Recommended stack:

- Cloudflare Workers
- Cloudflare D1
- KV for lightweight cache and session-adjacent reads
- R2 for proof assets

Characteristics:

- minimal moving parts
- fast deploy cycle
- low ops overhead

### Tier 2: 10k to 100k users

Goal:

- support higher write volume and more complex workflows

Recommended stack:

- PostgreSQL (`Neon`, `Supabase`, or equivalent)
- queue-backed async processing
- append-only event log
- dedicated trust recompute jobs

Characteristics:

- stronger transactional integrity
- background processing for proofs and trust
- more durable analytics pipeline

### Tier 3: 100k+ users

Goal:

- support cross-domain coordination and platform expansion

Recommended additions:

- dedicated DB cluster
- graph service for relationship and trust projections
- planner service for transition recommendations
- advanced observability and anomaly detection

Characteristics:

- service decomposition where justified
- stronger policy enforcement
- tenant-aware scaling strategy

---

## 5. Performance Targets

Initial performance targets:

- API read latency: under 150ms for normal requests
- commitment creation: under 300ms
- proof upload acknowledgement: under 500ms
- trust calculation: async where possible
- dashboard summary refresh: under 2 seconds

Rules:

- do not block user-critical flows on full trust recomputation
- keep write-path logic small and explicit
- move expensive scoring and analytics off the synchronous path

---

## 6. Trust Scaling Strategy

Trust must not be recalculated from scratch on every user action.

Required strategy:

- incremental trust updates on verified events
- periodic background recomputation for consistency
- anomaly detection for suspicious proof or payment behavior
- explainable scoring output for operators and disputes

Trust inputs should include:

- proof validity
- completion history
- payment reliability
- dispute history
- governance actions

---

## 7. Data and Event Model

Core system records should include:

- commitments
- proofs
- trust scores
- payment-linked events
- policy actions
- audit logs

Required event types:

- `commitment.created`
- `commitment.accepted`
- `commitment.overdue`
- `proof.submitted`
- `proof.verified`
- `trust.updated`

Rules:

- events must be append-only
- business-critical state must be reconstructable
- every trust change must be traceable to an event or policy decision

---

## 8. Key Metrics

Product metrics:

- overdue rate
- commitment completion rate
- average days to proof submission
- average days to payment resolution

Trust metrics:

- trust accuracy against operator review
- dispute rate
- false-positive anomaly flags

Business metrics:

- SME retention
- active commitments per SME
- paid conversion
- net revenue retention

---

## 9. Deployment Model

Recommended production deployment:

- Cloudflare Pages for frontend surfaces
- Workers for API edge execution
- PostgreSQL for primary system data
- R2 for proof storage
- queue system for async jobs

Operational requirements:

- rollback-safe deploys
- environment separation by stage
- status visibility for frontend and API

---

## 10. 90-Day Execution Plan

### Week 1 to 2

- stabilize API contracts
- fix auth baseline
- lock commitment lifecycle
- define proof acceptance rules

### Week 3 to 6

- add event pipeline
- move trust updates off synchronous request path
- add operator review queue
- improve analytics baseline

### Week 7 to 12

- ship trust engine v1
- add overdue detection jobs
- add dashboard analytics for SMEs
- instrument reliability and performance metrics

---

## 11. Risks

- overbuilding before real SME usage patterns appear
- coupling trust logic too tightly to synchronous API paths
- weak proof standards leading to noisy trust outcomes
- lack of operator tooling for exceptions and disputes

---

## 12. Next Actions

1. Lock the commitment state machine.
2. Define proof verification rules.
3. Implement event-based trust updates.
4. Build the first operator dashboard for Zero Overdue.
