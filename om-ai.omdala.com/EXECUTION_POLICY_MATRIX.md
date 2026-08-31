# Om AI Execution Policy Matrix

Version: 2.0
Status: Locked Om AI policy matrix
Canonical product name: Om AI
Date: April 9, 2026

## Boundary normalization — April 9, 2026

This file is now normalized to the current Om AI product boundary.

Current rule:

- policy evaluation for Om AI focuses on live session eligibility, family-safe restrictions, plan restrictions, moderation-sensitive flows, and workspace permissions
- old device-action policy matrices are `legacy-transition` or `bridge-only`

## 1. Purpose

Define policy rules that determine whether Om AI may allow, restrict, or deny a live product action.

## 2. Policy Inputs

- actor identity
- workspace type
- plan level
- persona category
- lesson or session context
- family-safe mode
- moderation state
- role and admin privileges

## 3. Policy Outputs

- allow
- allow_with_logging
- suggest_only
- confirm_required
- parent_required
- admin_only
- denied

## 4. Policy Matrix

| Action Class | Free User | Paid User | Child Profile | Admin / Parent |
|---|---|---|---|---|
| Browse personas | allow | allow | allow_with_logging | allow |
| Start basic call | allow | allow | allow_if_safe | allow |
| Start premium persona call | suggest_only | allow | denied | allow |
| Enter restricted persona category | denied | denied | denied | allow_if_safe |
| Change family restrictions | denied | denied | denied | admin_only |
| Export memory | suggest_only | allow_with_logging | denied | allow_with_logging |
| Override safety block | denied | denied | denied | denied |

## 5. Mandatory Rules

1. Restricted live flows always pass policy evaluation.
2. Child-safe restrictions must be enforced server-side.
3. Any denied action must produce a reason string.
4. Important allow decisions must still produce audit or evidence records.
5. Workspace rules may be stricter than plan rules.

## 6. Legacy Transition Rule

Older device or scene execution policies may remain archived, but they are not current Om AI policy truth.

## 7. Final Lock

The Om AI execution policy matrix is now session, persona, family, and plan centered.
