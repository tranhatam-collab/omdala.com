# App Beta Rollout Checklist / Checklist trien khai Beta App

## 1) Build readiness / San sang ban build

- [x] App MVP flow implemented (SignIn, Timeline, Run detail, Scenes, Settings) / Luong MVP da hoan tat (Dang nhap, Timeline, Chi tiet run, Scenes, Cai dat)
- [x] Shared API contract locked (`shared/api-contracts.ts` v1.0.0) / Contract API dung chung da khoa phien ban
- [x] Session manager implemented with secure storage / Session manager da dung secure storage
- [x] App smoke verify command available (`npm run verify:app`) / Da co lenh smoke verify cho app

## 2) Environment readiness / San sang moi truong

- [x] API base domain unified to `https://api.omdala.com` / Da thong nhat domain API goc

## 3) Launch-ready blockers (final) / Blocker truoc launch (cuoi cung)

- [x] `v2/reality/scenes` endpoint available on production / Endpoint `v2/reality/scenes` da san sang tren production
- [x] `v2/reality/runs` endpoint available on production / Endpoint `v2/reality/runs` da san sang tren production

Helper commands / Lenh ho tro:

- `npm run api:strict:precheck`
- `npm run api:strict:status`

## 4) Test gates / Cong kiem thu

- [x] Unit tests pass (`npm run app:test`) / Unit test da pass
- [x] App smoke pass (`npm run e2e:app:mvp`) / App smoke da pass
- [x] Strict app smoke pass (`npm run e2e:app:mvp:strict`) / Strict app smoke da pass
- [x] Web gates pass (`npm run verify:web:gates`) / Web gate da pass

## 5) CI gates / Cong CI

- [x] App CI workflow present (`.github/workflows/app-ci.yml`) / Da co workflow CI cho app
- [x] App CI strict mode can be toggled by repo variable `LAUNCH_STRICT` (`1` = enabled) / Co the bat tat strict mode bang bien repo `LAUNCH_STRICT`

## 6) Beta release controls / Kiem soat phat hanh beta

- [x] Generate release snapshot and changelog note / Da tao release snapshot va cap nhat changelog
- [x] Create release tag for app RC (`v2026.04.05-app-rc`) / Da xac nhan tag app RC (`v2026.04.05-app-rc`)
- [x] Verify rollback command and previous artifact reference / Da xac minh lenh rollback va artifact tham chieu truoc do
- [x] Internal beta announcement + known limitations / Da co thong bao beta noi bo va gioi han hien tai

Release control references / Tai lieu tham chieu phat hanh:

- Announcement draft / Ban nhap thong bao: `INTERNAL_BETA_ANNOUNCEMENT_APP_MVP.md`
- Rollback command / Lenh rollback: `scripts/rollback-home-prod.sh`
- Previous artifact seed / Artifact moc truoc: `.deploy-artifacts/20260404T071032Z-rollback-test-seed`
