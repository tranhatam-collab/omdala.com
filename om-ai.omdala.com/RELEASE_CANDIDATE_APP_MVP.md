# Release Candidate - App MVP / Ban ung vien phat hanh - App MVP

Date / Ngay: 2026-04-05  
Status / Trang thai: Final release candidate verified / Da xac minh RC cuoi cung

Verification note / Ghi chu xac minh:

- `verify:app` and `e2e:app:mvp:strict` pass on current environment.
- `verify:web:gates` passes with smoke fallback when Playwright runtime is incompatible with current Node runtime.
- VN: `verify:app` va `e2e:app:mvp:strict` da pass tren moi truong hien tai.
- VN: `verify:web:gates` da pass voi fallback smoke khi Playwright khong tuong thich runtime Node hien tai.

## Scope / Pham vi

- web gates finalized (requestId diagnostics UI, smoke script, lighthouse baseline script) / da hoan tat cong web
- shared contract locked at `shared/api-contracts.ts` version `1.0.0` / contract dung chung da khoa
- app session manager aligned with `APP_SESSION_POLICY.md` / session manager da dong bo policy
- app MVP flows implemented / cac luong MVP da duoc trien khai:
  - magic-link request + callback handling / gui magic-link va xu ly callback
  - timeline list + run detail / danh sach timeline va chi tiet run
  - scene list + run action / danh sach scene va thao tac chay
  - settings/logout / cai dat va dang xuat
- app smoke + CI pipeline prepared / da chuan bi smoke va pipeline CI
- strict launch blockers cleared (`/v2/reality/scenes`, `/v2/reality/runs` now return 200) / da go blocker strict launch
- production deployment verified (`deploy:prod:full`) / da xac minh deploy production

## Verification commands / Lenh xac minh

```bash
npm run verify:prod
npm run verify:app
npm run e2e:app:mvp
npm run e2e:app:mvp:strict
npm run verify:web:gates
npm run deploy:prod:full
```

## Release notes summary / Tom tat ghi chu phat hanh

- unified web and app contracts on versioned shared types / thong nhat contract web-app tren shared type co version
- completed app MVP core user journey (sign in -> timeline -> scene run -> settings) / hoan tat hanh trinh nguoi dung cot loi
- added app CI workflow and smoke scripts for release confidence / bo sung workflow CI va script smoke
- passed strict app gate and closed launch blockers on production API / vuot cong strict app va dong blocker launch tren production API
