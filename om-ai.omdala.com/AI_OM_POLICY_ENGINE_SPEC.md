# Om AI Policy Engine Spec

Version: 1.0
Status: Draft for DEV handoff

## Boundary normalization — April 9, 2026

This file contains policy logic from an older mixed physical-control scope.

Current rule:

- Om AI current policy focus is live interaction safety, moderation, memory boundaries, and usage governance
- device/space/action execution policy below is legacy-transition or bridge-only context
- do not use this file as current Om AI product-core policy ownership

## 1. Purpose

Define the historical policy engine that once evaluated physical or device-linked actions before execution.

## 2. Inputs

- actor
- role
- space
- device
- action class
- safety class
- time
- location
- mode
- approval history

## 3. Outputs

- allow
- allow_with_logging
- suggest_only
- confirm_required
- location_required
- time_window_required
- two_person_approval
- admin_only
- denied

## 4. Evaluation Order

1. identify actor
2. resolve device and space
3. map action class
4. apply safety class rules
5. apply role rules
6. apply time and location rules
7. apply mode rules
8. resolve final decision

## 5. Special Rules

- sensitive device classes default to stricter outcomes
- business mode may override household defaults with stricter rules
- denied decisions must include a reason
