# Om AI Command Grammar Spec 2026

Version: 2.0
Status: Locked Om AI interaction grammar
Canonical product name: Om AI
Date: April 9, 2026

## Boundary normalization — April 9, 2026

This file is now normalized to the current Om AI product boundary.

Current rule:

- Om AI command grammar must prioritize live interaction, lesson continuation, recap access, memory control, and safe support actions
- old device, scene, or physical execution grammar is `legacy-transition` or `bridge-only`

## 1. Purpose

Define the normalized interaction language used by Om AI before any live product action is executed.

## 2. Design Rules

- every user intent must reduce to a typed Om AI action
- ambiguous actions must request clarification
- restricted actions must require policy evaluation
- unsupported actions must fail safely

## 3. Canonical Actions

```text
start_call(persona_id)
continue_call(session_id)
start_lesson(lesson_id)
continue_lesson(lesson_id)
open_recap(session_id)
show_usage(scope)
update_preference(key, value)
request_support(topic)
```

## 4. Typed Arguments

- `persona_id` must resolve to an approved persona
- `session_id` must resolve to a session visible to the current user
- `lesson_id` must resolve to a valid lesson path node
- `scope` must resolve to today, cycle, or plan visibility
- `key` must resolve to an allowed preference field

## 5. Command Lifecycle

1. parse intent
2. normalize entities
3. validate plan and policy eligibility
4. create or route the Om AI action
5. record evidence or outcome
6. return recap, usage, or next-step state where relevant

## 6. Legacy Transition Rule

Older command forms such as direct device control or scene execution are no longer canonical Om AI grammar.

## 7. Final Lock

The Om AI command grammar is now live-product-first, lesson-aware, and safety-bounded.
