# Release Tag Checklist / Checklist tao tag phat hanh

## Before Tagging / Truoc khi tao tag

- [ ] `npm run ci` passes on target commit / `npm run ci` pass tren commit muc tieu
- [ ] `npm --prefix backend run e2e` passes / e2e backend pass
- [ ] `npm run smoke` passes against running backend / smoke pass voi backend dang chay
- [ ] `CHANGELOG.md` updated / `CHANGELOG.md` da cap nhat
- [ ] `RELEASE_CHECKLIST.md` completed for target environment / `RELEASE_CHECKLIST.md` da hoan tat cho moi truong muc tieu
- [ ] no pending migration ambiguity / khong con mo ho migration
- [ ] no unresolved policy/proof regressions / khong co hoi quy policy/proof chua xu ly

## Tag Naming / Quy uoc dat ten tag

- format: `vYYYY.MM.DD-rc.N` for release candidates / dinh dang RC
- format: `vMAJOR.MINOR.PATCH` for stable releases / dinh dang ban on dinh

## Tag Command / Lenh tao tag

```bash
git tag -a vYYYY.MM.DD-rc.1 -m "Om AI release candidate"
git push origin vYYYY.MM.DD-rc.1
```

## Post-Tag / Sau khi tao tag

- [ ] create release notes from template / tao release notes tu mau
- [ ] link changelog and major spec updates / lien ket changelog va cap nhat spec quan trong
- [ ] announce compatibility notes (API envelope/auth/proof) / thong bao ghi chu tuong thich (API envelope/auth/proof)
