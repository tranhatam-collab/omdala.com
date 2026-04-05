# Om AI Role Permission Matrix

Version: 1.0
Status: Draft for DEV handoff

## 1. Purpose

Define role-based permissions for household and business modes.

## 2. Roles

- owner
- family admin
- family member
- guest
- operator
- facility admin
- technician
- observer

## 3. Permission Rules

| Role | View | Control Low Risk | Control Sensitive | Approve Sensitive | Edit Policy |
|---|---|---|---|---|---|
| owner | yes | yes | yes | yes | yes |
| family admin | yes | yes | yes | yes | limited |
| family member | yes | yes | limited | no | no |
| guest | limited | limited | no | no | no |
| operator | yes | yes | limited | limited | no |
| facility admin | yes | yes | yes | yes | limited |
| technician | yes | limited | no | no | no |
| observer | yes | no | no | no | no |

## 4. Rule

Business mode may further restrict any role based on site policy.
