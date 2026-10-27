# OMDALA INFORMATION ARCHITECTURE

## 1. Purpose

Define the information layers the repository should expose to Copilot and engineers.

This document is the reference for where system truth lives and how development guidance should be organized.

---

## 2. Information Layers

OMDALA should expose the repository through these layers:

1. repository instructions
2. architecture docs
3. workflow prompts
4. role-specific agents
5. app code
6. api code
7. shared packages
8. infra

---

## 3. Expected Behavior

- Instructions guide behavior.
- Prompts guide task execution.
- Agents specialize responsibility.
- Docs define system truth.
- Code implements the approved system.

---

## 4. Information Ownership

### `.github/copilot-instructions.md`

Owns repo-wide working rules for Copilot.

### `.github/prompts/*`

Owns task-shaped execution templates.

### `.github/agents/*`

Owns role-specific behavior for architecture, building, debugging, review, and docs.

### `docs/*`

Owns architectural truth, product principles, data model, and implementation decisions.

### `app/`

Owns user-facing application code.

### `api/`

Owns backend API code.

### `packages/`

Owns shared code reused across app and api.

### `infra/`

Owns deployment and environment infrastructure.

---

## 5. Decision Rules

- Do not duplicate the same decision in multiple places.
- Do not keep code rules only in chat.
- Do not bury system truth inside implementation files.
- Prefer docs for policy, code for execution.

---

## 6. Open Questions

- Which docs are authoritative for product decisions versus technical decisions?
- Which package owns shared domain types?
- Which repository layer owns deployment defaults?

---

## 7. Next Actions

1. Keep file naming stable.
2. Avoid duplicate sources of truth.
3. Add app/api/package skeletons only after this layer is in place.
