# IAI_CODEX_TEAM_USAGE_SYSTEM.md

**Version**: 1.0  
**Status**: ACTIVE REFERENCE — TEAM AI USAGE SYSTEM  
**Date**: April 9, 2026  
**Scope**: Quy chuẩn dùng Codex/AI cho team để tối ưu chi phí, chất lượng, và độ ổn định đầu ra

---

## PURPOSE

Optimize Codex usage for a team:

- reduce token usage
- prevent context overflow
- increase output quality
- maintain consistency

---

# 1. CORE PRINCIPLE

AI usage is not unlimited.

Optimize by:

- reducing context
- reducing turns
- assigning correct model
- splitting tasks

---

# 2. TEAM MODEL STRATEGY

## DEFAULT MODEL

- GPT-5.4 mini

## CORE CODING

- GPT-5.3 Codex

## COMPLEX THINKING

- GPT-5.4

---

# 3. TASK CLASSIFICATION (MANDATORY)

Every task must be classified:

## TYPE 1 — SMALL

- fix UI
- small function

Use:

- MINI model

## TYPE 2 — STANDARD

- feature
- API

Use:

- CODEX

## TYPE 3 — COMPLEX

- architecture
- multi-module

Use:

- GPT-5.4

---

# 4. CONTEXT CONTROL

## RULE

DO NOT:

- keep long chat history
- reuse old conversations blindly

DO:

- reset context frequently
- use context engine file
- summarize instead of repeating

---

# 5. TURN CONTROL (CRITICAL)

AI cost increases with turns.

RULE:

- max 3–5 turns per task
- if not solved -> restart with better prompt

---

# 6. PROMPT STANDARD

Every prompt must follow:

1. Context
2. Task
3. Constraints
4. Output format

Example:

```text
Context:
[short]

Task:
[clear]

Constraints:
- full file
- no mock
- minimal change

Output:
- code only
```

---

# 7. TEAM WORKFLOW

## STEP 1

Architect agent -> analyze

## STEP 2

Builder agent -> implement

## STEP 3

Reviewer agent -> check

## STEP 4

Commit

---

# 8. CONTEXT ENGINE INTEGRATION

Always use:

- `docs/PROJECT_CONTEXT_ENGINE.md`

AI must:

- read first
- update after work

---

# 9. MEMORY RULE

- do not reload full repo
- reuse summaries
- track only current module

---

# 10. COST OPTIMIZATION

## DO

- use mini model for 70% tasks
- use Codex only for real coding
- use large model only when stuck

## DO NOT

- use heavy model for everything
- over-explain
- generate unnecessary code

---

# 11. TEAM RULES

- each feature = new chat/session
- no infinite conversation
- no mixing tasks in one thread

---

# 12. FAILURE HANDLING

If:

- context too large
- AI confused
- output degraded

-> RESET

---

# 13. PERFORMANCE TARGET

- reduce token usage by 50–70%
- reduce errors by 60%
- maintain consistent output

---

# 14. FINAL RULE

AI is not unlimited.

Smart usage = system + discipline

---

# END OF FILE
