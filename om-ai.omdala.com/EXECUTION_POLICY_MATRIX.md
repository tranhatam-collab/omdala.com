# Om AI Execution Policy Matrix

Version: 1.0
Status: Draft for DEV handoff
Product: Om AI

## 1. Purpose

Define policy rules that determine whether Om AI may execute a command, require confirmation, or deny action.

## 2. Policy Inputs

- actor identity
- role
- space context
- device class
- action class
- time window
- location state
- safety class
- household or business mode
- approval history

## 3. Policy Outputs

- allow
- allow_with_logging
- suggest_only
- confirm_required
- location_required
- time_window_required
- two_person_approval
- admin_only
- denied

## 4. Policy Matrix

| Action Class | Low Risk Device | Medium Risk Device | Sensitive Device | High Risk Device |
|---|---|---|---|---|
| Observe state | allow | allow | allow | allow |
| Toggle light or fan | allow | allow | allow_with_logging | suggest_only |
| Set temperature | allow | allow_with_logging | confirm_required | suggest_only |
| Run scene | allow | allow_with_logging | confirm_required | confirm_required |
| Lock or unlock | suggest_only | confirm_required | two_person_approval | denied |
| Open gate / access | denied | confirm_required | two_person_approval | denied |
| Disable alarm | denied | confirm_required | two_person_approval | denied |
| Power critical relay | denied | denied | confirm_required | two_person_approval |
| Payment or finance action | denied | denied | denied | denied |

## 5. Mandatory Rules

1. Sensitive actions always pass policy evaluation.
2. Dangerous actions never bypass approval logic.
3. Any denied action must produce a reason string.
4. Every allowed action must produce a proof record.
5. Business mode may impose stricter rules than household mode.

## 6. Special Cases

- emergency override is only allowed under explicit emergency policy
- guest roles must never gain administrative rights through conversation alone
- unverified devices default to deny or suggest_only
