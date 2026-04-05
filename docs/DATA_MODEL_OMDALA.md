# DATA_MODEL_OMDALA

## OMDALA
## Core Data Model
## Version 1.0

---

## 1. Data model purpose

The OMDALA data model must support:

- identity
- resource visibility
- operational coordination
- trust accumulation
- proof-backed outcomes

The model should stay platform-first and implementation-agnostic.

---

## 2. Core entities

Primary entities:

- `User`
- `Node`
- `Resource`
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

## 3. Entity intent

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

## 4. Relationship rules

- `User` owns or manages one or more `Node` records.
- `Node` owns `Resource`, `Offer`, and `Request` records.
- `Match` connects two entities with a score and explanation.
- `Booking` converts an accepted offer into a scheduled commitment.
- `Payment` tracks economic state independently from booking state.
- `Proof` can attach to bookings, tasks, offers, requests, nodes, or trust events.

---

## 5. Minimum fields by entity

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

## 6. State discipline

Important states must be explicit:

- offer: `draft | published | paused | archived | flagged`
- request: `draft | published | matched | fulfilled | archived | flagged`
- match: `suggested | interested | negotiating | confirmed | completed | dismissed`
- booking: `pending | confirmed | in_progress | completed | cancelled | disputed`
- proof: `uploaded | pending_review | verified | rejected`

No entity should jump between incompatible states without an auditable transition.

---

## 7. Visibility model

Core visibility values:

- `private`
- `network`
- `restricted_public`
- `public`

Visibility must be stored on nodes, resources, offers, requests, and proofs where relevant.

---

## 8. Event model

Important domain events:

- `user.created`
- `node.created`
- `resource.created`
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

## 9. Final rule

If a record affects trust, coordination, money, or discoverability, it must have a durable identifier,
a clear owner, and an auditable state.
