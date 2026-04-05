# Om AI Backend Service Map

Version: 2.0
Status: Locked for DEV handoff

## Reality Services

- identity service
- space service
- device service
- scene service
- planner service
- execution service
- approval service
- proof service
- memory service
- connector registry service
- gateway registry service
- policy service

## Live Services

- persona registry service
- live session orchestration service
- realtime token/session broker
- avatar provider adapter service
- lesson plan service
- recap generation service
- usage metering service
- subscription service
- moderation and escalation service

## Shared Behaviors

- deterministic request validation
- explicit error codes
- audit-ready logging
- idempotent execution endpoints where possible
- support for run, proof, and live-session correlation
- backend-owned usage enforcement for free and paid plans
- provider abstraction so Tavus, HeyGen, or future providers can be swapped without client contract breakage
