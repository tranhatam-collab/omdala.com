# Om AI Architecture Overview

Version: 2.0
Status: Locked for DEV handoff
Canonical product name: Om AI

## 1. System Layers

1. native iOS reality execution cockpit
2. native iOS live call surface
3. `ai.omdala.com` orchestration and admin surface
4. `api.omdala.com` reality + live API
5. Om Gateway local bridge
6. OMDALA graph, policy, proof, memory, moderation, and metering backbone

## 2. Runtime Boundary

- iOS owns trusted interaction, live calls, and native device control
- web owns orchestration, admin, and review surfaces
- backend owns planning, policy, proof, memory, moderation, metering, and subscriptions
- gateway owns local device bridging
- avatar providers remain replaceable adapters, not core product owners

## 3. Data Flows

### Reality

intent -> planner -> policy -> execution -> verification -> proof -> memory

### Live

persona select -> plan check -> session create -> realtime conversation -> recap -> memory -> usage metering -> subscription prompts

## 4. Non-Negotiables

- no sensitive action without policy
- no physical execution without proof
- no live session without backend-owned metering
- no regulated-care claims in wellness personas
- no hard dependency on a single avatar provider
