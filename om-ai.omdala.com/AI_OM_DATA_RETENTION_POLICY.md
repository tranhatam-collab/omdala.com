# Om AI Data Retention Policy

Version: 1.0
Status: Draft for DEV handoff

## 1. Purpose

Define how Om AI stores, retains, exports, and deletes data.

## 2. Data Categories

- identity data
- device metadata
- room and space data
- scenes and routines
- memory entries
- execution runs
- proofs
- approvals
- logs
- connector secrets

## 3. Retention Rules

- proofs and execution runs retained by policy
- memory is user-visible and editable
- raw logs retained only as needed for debugging and audit
- secrets stored separately from general user data

## 4. User Rights

- inspect
- export
- delete where allowed
- correct memory entries

## 5. Safety Rule

Deletion must not silently erase mandatory audit records.
