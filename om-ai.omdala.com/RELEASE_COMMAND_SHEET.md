# Release Command Sheet / Bang lenh phat hanh

One-shot checklist and command flow for release candidate and stable release. / Checklist nhanh va luong lenh cho ban RC va ban on dinh.

## A. Pre-release Verification / Xac minh truoc phat hanh

```bash
npm run ci
npm --prefix backend run e2e
npm run smoke
```

## B. Optional Git Health Check / Kiem tra suc khoe Git (tuy chon)

```bash
git fsck --full
```

If errors appear, follow `GIT_RECOVERY_NOTES.md` first. / Neu co loi, thuc hien theo `GIT_RECOVERY_NOTES.md` truoc.

## C. Commit Flow (Using Playbook) / Luong commit (theo playbook)

Use groups in `COMMIT_PLAYBOOK.md`. / Dung nhom commit trong `COMMIT_PLAYBOOK.md`.

After final commit: / Sau commit cuoi cung:

```bash
git log --oneline -10
```

## D. Generate Release Notes Draft / Tao ban nhap ghi chu phat hanh

```bash
npm run release:notes -- v2026.04.04-rc.1
```

Edit generated file and `RELEASE_NOTES_DRAFT.md` before publishing. / Chinh sua file sinh ra va `RELEASE_NOTES_DRAFT.md` truoc khi cong bo.

## E. Tag and Push / Tao tag va day len remote

```bash
git tag -a v2026.04.04-rc.1 -m "Om AI release candidate"
git push origin main
git push origin v2026.04.04-rc.1
```

## F. Post-tag Checks / Kiem tra sau khi tao tag

- confirm CI green on pushed commit / xac nhan CI xanh tren commit da push
- confirm `/openapi.json` and `/docs` in deployed backend / xac nhan endpoint tai lieu da truy cap duoc tren backend deploy
- confirm smoke flow on target environment / xac nhan smoke flow tren moi truong muc tieu

## G. Stable Release (Example) / Ban on dinh (vi du)

```bash
git tag -a v1.0.0 -m "Om AI v1.0.0"
git push origin v1.0.0
```
