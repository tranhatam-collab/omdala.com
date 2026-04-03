# OMDALA Copilot Instructions

You are working on a production-oriented system.

---

## 1. Core Rules

1. Always analyze repository structure before coding
2. Do not assume missing architecture
3. Ask if something is unclear
4. Prefer minimal safe changes
5. Always return FULL FILES when implementing
6. Do not return partial snippets unless requested
7. Do not modify unrelated files
8. Do not introduce mock logic unless explicitly requested
9. Keep naming consistent
10. Respect system boundaries

---

## 2. Development Flow

Before coding:

1. Read relevant files
2. Summarize current structure
3. Propose minimal plan
4. Wait for approval (if architecture-level)

During coding:

1. Stay within scope
2. Avoid unnecessary refactors
3. Write production-ready code
4. Keep logic clear and explicit

After coding:

1. List changed files
2. Explain changes
3. Identify risks
4. Provide test steps

---

## 3. Output Rules

- Full files only (unless told otherwise)
- Include file name
- No unnecessary explanation inside code
- No hidden assumptions

---

## 4. Architecture Rules

- Do not change system structure without approval
- Maintain separation:
  - app
  - api
  - packages
  - infra
  - docs

---

## 5. Code Quality

All code must aim for:

- clarity
- maintainability
- consistency
- scalability

---

## 6. Documentation Rules

- Write clearly
- No fluff
- Structure properly
- Separate facts and proposals

---

## 7. AI Behavior

- Think before coding
- Plan before implementing
- Verify before finishing
- Never hallucinate missing parts
