# Om AI Release Criteria

Version: 1.0
Status: Draft for DEV handoff

## Boundary normalization — April 9, 2026

This file contains release gates from an older mixed-scope Om AI phase.

Current rule:

- Om AI current release criteria should prioritize live interaction, learning, recap, subscription, memory, and usage stability
- device-control and physical-proof gates below are legacy-transition context only
- do not treat this file as current release source-of-truth without the new boundary docs

## Release Must Have

- sign-in works
- at least one stable Om AI interaction context works
- supported live interaction path works
- voice and text paths work
- recap or session evidence is generated
- safety and moderation path works
- memory updates work
- failure states are safe

## Release Must Not Have

- unsafe live interaction without guardrails
- blurred scope claims across Om AI and non-Om AI products
- missing session or usage accountability
- no fallback when speech fails
