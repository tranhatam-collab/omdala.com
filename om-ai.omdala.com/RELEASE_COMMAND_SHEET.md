# Release Command Sheet

One-shot checklist and command flow for release candidate and stable release.

## A. Pre-release Verification

```bash
npm run ci
npm --prefix backend run e2e
npm run smoke
```

## B. Optional Git Health Check

```bash
git fsck --full
```

If errors appear, follow `GIT_RECOVERY_NOTES.md` first.

## C. Commit Flow (Using Playbook)

Use groups in `COMMIT_PLAYBOOK.md`.

After final commit:

```bash
git log --oneline -10
```

## D. Generate Release Notes Draft

```bash
npm run release:notes -- v2026.04.04-rc.1
```

Edit generated file and `RELEASE_NOTES_DRAFT.md` before publishing.

## E. Tag and Push

```bash
git tag -a v2026.04.04-rc.1 -m "Om AI release candidate"
git push origin main
git push origin v2026.04.04-rc.1
```

## F. Post-tag Checks

- confirm CI green on pushed commit
- confirm `/openapi.json` and `/docs` in deployed backend
- confirm smoke flow on target environment

## G. Stable Release (Example)

```bash
git tag -a v1.0.0 -m "Om AI v1.0.0"
git push origin v1.0.0
```
