# Om AI Safety Class Spec 2026

## Purpose

Define the safety hierarchy for all Om AI actions.

## Safety Classes

### observe_only

Read-only access. No state changes.

### suggest_only

May recommend actions but cannot execute them.

### confirm_required

User must confirm before execution.

### two_person_approval

Requires approval from two authorized actors.

### location_required

Execution requires actor presence in an approved location.

### scheduled_only

Action can only run in approved time windows.

### restricted_hours

Action blocked during locked hours unless explicitly overridden.

### emergency_override

Allowed only under a predefined emergency policy.

## Sensitive Actions

- door unlock
- gate open
- camera privacy changes
- high-power device control
- alarm disarm
- security system changes
- payment or finance-related flows

## Rule

The highest applicable safety class always wins.
