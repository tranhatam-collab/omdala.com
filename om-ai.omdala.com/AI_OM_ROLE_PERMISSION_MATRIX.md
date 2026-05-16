# Om AI Role Permission Matrix

Version: 1.1
Status: Normalized for DEV handoff
Canonical product name: Om AI
Date: April 10, 2026
Owner: Team Om AI

## Boundary Normalization

This matrix now describes permissions for Om AI live interaction, family, education, and organization use.

Older facility / device-control role assumptions are bridge-only unless reused by a shared platform integration.

## 1. Purpose

Define role-based permissions for personal, family, school, and business modes.

## 2. Roles

- owner
- parent_admin
- family_member
- learner
- teacher_admin
- org_admin
- team_manager
- support_observer

## 3. Permission Rules

| Role | View Profile | Start Session | View Recap | Edit Memory | Manage Personas | Manage Policy | Manage Billing |
|---|---|---|---|---|---|---|---|
| owner | yes | yes | yes | yes | yes | yes | yes |
| parent_admin | yes | yes | yes | limited | limited | yes | limited |
| family_member | yes | yes | yes | limited | no | no | no |
| learner | yes | yes | yes | limited | no | no | no |
| teacher_admin | yes | yes | yes | limited | limited | limited | no |
| org_admin | yes | yes | yes | yes | yes | yes | yes |
| team_manager | yes | yes | yes | limited | limited | limited | no |
| support_observer | limited | no | limited | no | no | no | no |

## 4. Rule

Family, school, and business mode may further restrict any role based on workspace policy, safe-mode settings, or child/account protections.
