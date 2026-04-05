# Om AI Security Model

Version: 1.0
Status: Draft for DEV handoff

## 1. Identity

- strong authentication
- device-bound sessions
- biometric re-auth for sensitive actions

## 2. Authorization

- role-based access control
- context-based checks
- per-space permissions
- per-device policy constraints

## 3. Transport

- TLS everywhere
- signed requests for gateway and sensitive execution
- anti-replay protections

## 4. Secrets

- least-privilege tokens
- segmented secrets by connector
- secure at-rest storage

## 5. Audit

- immutable-ish audit trail
- proof linked to every executed action
- denied actions logged with reasons
