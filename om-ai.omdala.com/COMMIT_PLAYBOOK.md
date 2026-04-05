# Commit Playbook

Use this playbook to create clean commits by domain. Run from repo root.

## 0. Optional Precheck

```bash
git fsck --full
```

If your local git object database has packfile errors, fix that first before pushing.

## 1) Specs and Product Planning

```bash
git add AI_OM_*.md README_INDEX.md DEV_TASK_BREAKDOWN.md
git commit -m "docs(ai-om): lock master specs and implementation handoff set"
```

## 2) Backend Foundation and API

```bash
git add backend/src backend/package.json backend/tsconfig.json backend/migrations backend/.env.example backend/Dockerfile
git commit -m "feat(backend): add reality api skeleton with policy, proof, approvals, and docs"
```

## 3) Web Foundation

```bash
git add web/src web/package.json web/tsconfig.json web/vite.config.ts web/index.html web/.env.example web/Dockerfile
git commit -m "feat(web): add vite orchestration shell with planner and device hooks"
```

## 4) Gateway Foundation

```bash
git add gateway/src gateway/package.json gateway/tsconfig.json gateway/.env.example gateway/Dockerfile
git commit -m "feat(gateway): add plugin registry and command dispatcher runtime"
```

## 5) iOS Structure

```bash
git add ios
git commit -m "feat(ios): scaffold features-core module structure for om ai cockpit"
```

## 6) DevOps and Runtime Tooling

```bash
git add Makefile docker-compose.yml package.json .env.example scripts
git commit -m "chore(devops): add ci scripts, smoke flow, compose, and release utilities"
```

## 7) Governance and Release Process

```bash
git add .github CHANGELOG.md RELEASE_*.md SECURITY.md CONTRIBUTING.md BRANCH_PROTECTION_CHECKLIST.md FINAL_HANDOFF_SUMMARY.md COMMIT_GROUPING_PLAN.md COMMIT_PLAYBOOK.md
git commit -m "docs(governance): add pr templates, codeowners, release and branch protection guides"
```

## 8) Final Check

```bash
npm run ci
git log --oneline -10
```
