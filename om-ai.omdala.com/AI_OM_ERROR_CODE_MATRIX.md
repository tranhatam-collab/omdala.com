# Om AI Error Code Matrix

Version: 1.0
Status: Draft for DEV handoff

## 1. Purpose

Define the canonical error set for Om AI.

## 2. Error Codes

| Code | Meaning |
|---|---|
| `unauthorized` | Authentication failed |
| `forbidden` | Permission denied |
| `policy_denied` | Policy rejected action |
| `approval_required` | Human approval needed |
| `unsupported_device` | Device cannot be handled |
| `offline_gateway` | Gateway unreachable |
| `execution_failed` | Action execution failed |
| `verification_failed` | State could not be verified |
| `partial_success` | Some steps succeeded |
| `timeout` | Operation timed out |

## 3. Error Rules

- every error must be typed
- every denied action must have a reason
- partial success must still produce proof
