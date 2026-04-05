# Release Tag Checklist

## Before Tagging

- [ ] `npm run ci` passes on target commit
- [ ] `npm --prefix backend run e2e` passes
- [ ] `npm run smoke` passes against running backend
- [ ] `CHANGELOG.md` updated
- [ ] `RELEASE_CHECKLIST.md` completed for target environment
- [ ] no pending migration ambiguity
- [ ] no unresolved policy/proof regressions

## Tag Naming

- format: `vYYYY.MM.DD-rc.N` for release candidates
- format: `vMAJOR.MINOR.PATCH` for stable releases

## Tag Command

```bash
git tag -a vYYYY.MM.DD-rc.1 -m "Om AI release candidate"
git push origin vYYYY.MM.DD-rc.1
```

## Post-Tag

- [ ] create release notes from template
- [ ] link changelog and major spec updates
- [ ] announce compatibility notes (API envelope/auth/proof)
