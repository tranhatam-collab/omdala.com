# TEAM BACKEND CONTRACT

Product: Om AI
Repo: `omdala.com/om-ai.omdala.com`
Status: active

## Mission

Freeze the product-specific backend contract for Om AI mobile execution.

## Must freeze

- `/v2/live` session lifecycle
- persona list and detail payloads
- lesson list and detail payloads
- recap and memory payloads
- moderation states
- usage metering states
- subscription visibility payloads
- push registration payloads

## Sprint order

1. Sprint 1: live session and auth contract
2. Sprint 2: persona, lesson, recap, memory, transcript
3. Sprint 3: moderation, metering, push, error audit

## Rules

- no breaking field rename after sprint 2 begins
- audio session states must be machine-readable
- free-minute and usage limits must be explicit

## Done when

- iOS and Android teams can build without guessing
- live-call, recap, memory, and subscription flows are stable
