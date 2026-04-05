# DATA_MODEL_OMDALA

## OMDALA
## Core Data Model
## Version 1.1

---

## 1. Data model purpose

The OMDALA data model must support:

- identity
- resource visibility
- operational coordination
- trust accumulation
- proof-backed outcomes
- governed movement from current state to desired state

The model should stay platform-first and implementation-agnostic.

---

## 2. Canonical primitives

These primitives define the deeper system model behind OMDALA:

- `Node`
- `Resource`
- `State`
- `Commitment`
- `Transition`
- `Proof`
- `Trust`

These primitives should shape architecture decisions even when user-facing flows are still expressed as offers, requests, matches, bookings, and payments.

---

## 3. Core entities

Primary entities:

- `User`
- `Node`
- `Resource`
- `State`
- `Commitment`
- `Transition`
- `Offer`
- `Request`
- `Match`
- `Conversation`
- `Message`
- `Booking`
- `Payment`
- `Proof`
- `TrustEvent`
- `Verification`
- `Workspace`
- `Task`
- `Notification`

---

## 4. Entity intent

`User`

- human account
- auth identity
- profile owner

`Node`

- operational unit in the network
- can represent person, team, business, place, or community

`Resource`

- any capacity that can be activated
- time, space, skill, service, knowledge, asset, or access

`State`

- current condition, desired condition, and transition context

`Commitment`

- structured promise between nodes with conditions, timing, and required proof

`Transition`

- governed path from current state to desired state

`Offer`

- structured supply object

`Request`

- structured need object

`Match`

- scored relationship between two objects or nodes

`Proof`

- evidence artifact attached to actions and outcomes

`TrustEvent`

- append-only trust-affecting event

---

## 5. Model principles

- keep entities explicit
- keep field names stable
- do not overload a single entity with unrelated concerns
- prefer simple canonical types over duplicated local shapes
- if a concept affects trust, money, coordination, or discoverability, it needs a durable model

---

## 6. Relationship rules

- `User` owns or manages one or more `Node` records.
- `Node` owns `Resource`, `Offer`, and `Request` records.
- `Node` can create or accept `Commitment` records.
- `State` captures current and desired conditions for nodes, resources, workflows, or commitments.
- `Transition` moves a subject from one state to another under policy and governance rules.
- `Match` connects two entities with a score and explanation.
- `Booking` converts an accepted offer into a scheduled commitment.
- `Payment` tracks economic state independently from booking state.
- `Proof` can attach to bookings, tasks, offers, requests, nodes, commitments, transitions, or trust events.
- `Proof` updates `Trust` through durable `TrustEvent` records.

---

## 7. Minimum fields by entity

`User`

- `id`
- `email`
- `display_name`
- `account_status`
- `verification_status`

`Node`

- `id`
- `node_type`
- `name`
- `slug`
- `owner_user_id`
- `visibility_status`
- `trust_profile_id`

`Resource`

- `id`
- `owner_node_id`
- `resource_type`
- `title`
- `availability_mode`
- `status`

`State`

- `id`
- `subject_type`
- `subject_id`
- `state_type`
- `current_value`
- `desired_value`
- `status`

`Commitment`

- `id`
- `creator_node_id`
- `counterparty_node_id`
- `title`
- `status`
- `due_at`
- `proof_requirement`

`Transition`

- `id`
- `subject_type`
- `subject_id`
- `from_state_id`
- `to_state_id`
- `status`
- `policy_mode`

`Offer`

- `id`
- `provider_node_id`
- `title`
- `category`
- `price_mode`
- `status`

`Request`

- `id`
- `requester_node_id`
- `title`
- `category`
- `urgency_level`
- `status`

`Match`

- `id`
- `match_type`
- `left_entity_type`
- `left_entity_id`
- `right_entity_type`
- `right_entity_id`
- `score`
- `status`

`Proof`

- `id`
- `linked_entity_type`
- `linked_entity_id`
- `proof_type`
- `verification_status`

`TrustEvent`

- `id`
- `subject_type`
- `subject_id`
- `event_type`
- `event_weight`
- `created_at`

---

## 8. State discipline

Important states must be explicit:

- offer: `draft | published | paused | archived | flagged`
- request: `draft | published | matched | fulfilled | archived | flagged`
- match: `suggested | interested | negotiating | confirmed | completed | dismissed`
- booking: `pending | confirmed | in_progress | completed | cancelled | disputed`
- proof: `uploaded | pending_review | verified | rejected`
- commitment: `draft | proposed | accepted | active | completed | broken | disputed | archived`
- transition: `planned | approved | executing | blocked | completed | rolled_back | failed`

No entity should jump between incompatible states without an auditable transition.

---

## 9. Visibility model

Core visibility values:

- `private`
- `network`
- `restricted_public`
- `public`

Visibility must be stored on nodes, resources, offers, requests, and proofs where relevant.

---

## 10. Implementation rule

Shared entity types should live in a shared package before any app or API module duplicates them.

If a new flow needs its own shape, it should extend the canonical model rather than fork it.

---

## 11. Event model

Important domain events:

- `user.created`
- `node.created`
- `resource.created`
- `state.recorded`
- `commitment.created`
- `transition.planned`
- `transition.executed`
- `offer.published`
- `request.published`
- `match.generated`
- `match.confirmed`
- `booking.created`
- `payment.completed`
- `proof.uploaded`
- `trust.event.recorded`

These events support notifications, analytics, trust, and audit.

---

## 12. Open questions

- Which entity is the canonical source for ownership in cross-node workflows?
- Which entity stores system audit metadata versus domain-facing metadata?
- Which fields are required at creation time versus progressively enriched later?

---

## 13. Final rule

If a record affects trust, coordination, money, discoverability, or governed state transitions, it must have a durable identifier, a clear owner, and an auditable state.
