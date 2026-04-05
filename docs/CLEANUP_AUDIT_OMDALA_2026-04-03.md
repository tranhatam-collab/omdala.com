# OMDALA Cleanup Audit

Date: 2026-04-03
Scope: local workspace cleanup before further DEV
Branch: `claude/omdala-brand-system-L4Gzx`

## Snapshot

Current local state at audit time:

- `README.md` is modified
- `47` files are untracked
- repo contains both strategic docs and one-off/generated files
- there is also a Git integrity warning on at least one missing historical object, so cleanup should be careful and incremental

This audit groups files into four buckets:

1. keep
2. keep but merge before commit
3. generated or temporary
4. remove from repo scope

## 1. Keep

These files look intentional, useful, and aligned with the current OMDALA repo direction.

### Keep and likely commit

- `.github/copilot-instructions.md`
- `.github/agents/architect.agent.md`
- `.github/agents/builder.agent.md`
- `.github/agents/debugger.agent.md`
- `.github/agents/docs.agent.md`
- `.github/agents/reviewer.agent.md`
- `.github/prompts/architecture.prompt.md`
- `.github/prompts/build-feature.prompt.md`
- `.github/prompts/fix-bug.prompt.md`
- `.github/prompts/refactor.prompt.md`
- `.github/prompts/review-changes.prompt.md`
- `.github/prompts/write-docs.prompt.md`
- `docs/OMDALA_API_BOUNDARIES.md`
- `docs/OMDALA_INFORMATION_ARCHITECTURE.md`
- `docs/OMDALA_MASTER_ARCHITECTURE.md`
- `docs/OMDALA_PRODUCT_PRINCIPLES.md`
- `docs/OMDALA_ROADMAP.md`
- `docs/OMDALA_TASK_SYSTEM.md`

Reason:

- these are not generated files
- they define engineering process, repo behavior, and system boundaries
- some tracked files already reference this `.github` structure directly

## 2. Keep, but merge before commit

These files contain useful content, but should not be committed exactly as they are now.

### `README.md`

Keep the intent, but do not commit the current version as-is.

Why:

- the current draft is directionally useful
- but the repository structure section is outdated and does not match the actual monorepo layout (`apps/web`, `apps/app`, `services/api`, etc.)
- it would create documentation drift if committed unchanged

### `docs/OMDALA_DATA_MODEL.md`

Keep the content, but merge into the existing canonical tracked doc:

- `docs/DATA_MODEL_OMDALA.md`

Why:

- current repo already has a tracked canonical data-model file
- keeping both names will create duplicate truth sources

### `docs/OMDALA_MASTER_SYSTEM_ARCHITECTURE_2026_FINAL.md`

Keep the content, but reconcile it with the already tracked architecture doc:

- `docs/architecture/OMDALA_MASTER_SYSTEM_ARCHITECTURE_2026_FINAL.md`

Why:

- the repo already has a tracked architecture location for this document family
- two parallel copies at different paths will drift quickly

## 3. Generated or temporary

These files look like build artifacts, transpiled mirrors, ad-hoc migration helpers, translation scratch files, or one-off patching tools.

They should not be committed to the main repo in their current form.

### JS mirrors / transpiled duplicates

- `apps/app/app/layout.js`
- `apps/app/app/page.js`
- `apps/app/lib/api.js`
- `apps/app/lib/navigation.js`
- `apps/web/app/layout.js`
- `apps/web/app/page.js`
- `services/api/src/index.js`

### Wrong package-manager artifact

- `services/api/package-lock.json`

Why:

- repo standard is `pnpm`
- root `.gitignore` already reflects that direction
- this file is noise unless the repo intentionally adopts npm for this package, which it currently does not

### One-off deploy / patch / translation helpers

- `deploy.js`
- `deploy_prod.js`
- `patch_content.js`
- `patch_content_mock.js`
- `patch_css.js`
- `patch_layout.js`
- `patch_layout2.js`
- `patch_localized_text.js`
- `patch_menu.js`
- `patch_page.js`
- `patch_page_clean.js`
- `robust_translate.js`
- `translate_content.py`
- `update_content_script.js`

### Scratch text dumps

- `en_strings.txt`
- `full_content.txt`

### Legacy static-first helpers

- `scripts/build-static.mjs`
- `scripts/dev-server.mjs`

Why:

- not referenced by current root scripts
- overlap with the tracked Next.js and Pages deployment flow
- likely came from content migration or static-first experimentation

Recommendation:

- keep locally only if still needed for manual recovery
- otherwise remove from workspace and add ignore protection if these are likely to reappear

## 4. Remove from repo scope

These files are outside the current approved repo scope and should not be committed into `omdala.com`.

### Mixed-brand document

- `docs/MASTER_BUILD_SYSTEM_OMDALA_OMDALAT.md`

Why:

- this repo is currently locked to OMDALA-only scope
- this file reintroduces OMDALAT mixed-brand and mixed-domain architecture
- it would directly conflict with the current repo direction and naming discipline

Recommendation:

- move it to a separate archive location outside the active OMDALA repo if it still matters historically
- do not commit it here

## Safe cleanup order

1. Do not mass-delete blindly because the local Git object history is not fully healthy.
2. First keep a plain filesystem backup of the untracked strategic docs if needed.
3. Commit only the intentional repo-governance files and canonical merged docs.
4. Drop generated/temp files from the workspace.
5. Add ignore rules only for files that are likely to be regenerated.
6. After cleanup, rerun `typecheck` and `build` before continuing feature DEV.

## Immediate recommendation

If we want the safest next step, the cleanup should happen in this order:

1. decide final canonical location for the new docs
2. merge `README.md`, `docs/OMDALA_DATA_MODEL.md`, and `docs/OMDALA_MASTER_SYSTEM_ARCHITECTURE_2026_FINAL.md`
3. commit `.github/*` plus the kept docs
4. remove the generated/temp group
5. remove the mixed-brand OMDALAT document from repo scope

