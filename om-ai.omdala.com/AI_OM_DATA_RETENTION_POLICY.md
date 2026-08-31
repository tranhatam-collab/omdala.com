# Om AI Data Retention Policy

Version: 1.1
Status: Normalized for DEV handoff
Canonical product name: Om AI
Date: April 10, 2026
Owner: Team Om AI

## Boundary Normalization

This policy now applies to Om AI as an AI human interaction product.

Current data priority is:

- identity and account state
- profile and preferences
- session history
- recap and lesson data
- memory entries
- metering and subscription usage
- moderation and safety traces
- analytics and audit records

Older device / room / scene / gateway assumptions are bridge-only unless re-approved by root canonical docs.

## 1. Purpose

Define how Om AI stores, retains, exports, and deletes user and workspace data.

## 2. Data Categories

- identity data
- account profile and preferences
- workspace and plan metadata
- persona selections and favorites
- live session records
- recap artifacts
- lesson and curriculum progress
- memory entries
- usage and billing records
- moderation and escalation records
- analytics and operational logs
- provider configuration references

## 3. Retention Rules

- live session recap, metering, and moderation records are retained according to product, billing, and audit policy
- user-visible memory must remain reviewable and editable where policy allows
- raw operational logs should be retained only as long as needed for debugging, fraud review, and audit support
- provider credentials and secrets must remain separated from user-visible product data
- child and family-related records must respect parent/admin controls and policy retention rules

## 4. User Rights

- inspect important account and memory data
- export meaningful summaries where policy allows
- delete or reset user-controlled history where policy allows
- correct profile, preferences, and memory entries

## 5. Safety Rule

Deletion must not silently erase required billing, abuse-review, safety, or audit records.
