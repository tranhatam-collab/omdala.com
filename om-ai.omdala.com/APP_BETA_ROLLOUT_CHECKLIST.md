# App Beta Rollout Checklist

## 1) Build readiness

- [x] App MVP flow implemented (SignIn, Timeline, Run detail, Scenes, Settings)
- [x] Shared API contract locked (`shared/api-contracts.ts` v1.0.0)
- [x] Session manager implemented with secure storage
- [x] App smoke verify command available (`npm run verify:app`)

## 2) Environment readiness

- [x] API base domain unified to `https://api.omdala.com`

## 3) Launch-ready blockers (final)

- [x] `v2/reality/scenes` endpoint available on production
- [x] `v2/reality/runs` endpoint available on production

Helper commands:

- `npm run api:strict:precheck`
- `npm run api:strict:status`

## 4) Test gates

- [x] Unit tests pass (`npm run app:test`)
- [x] App smoke pass (`npm run e2e:app:mvp`)
- [x] Strict app smoke pass (`npm run e2e:app:mvp:strict`)
- [x] Web gates pass (`npm run verify:web:gates`)

## 5) CI gates

- [x] App CI workflow present (`.github/workflows/app-ci.yml`)
- [x] App CI strict mode can be toggled by repo variable `LAUNCH_STRICT` (`1` = enabled)

## 6) Beta release controls

- [x] Generate release snapshot and changelog note
- [x] Create release tag for app RC
- [x] Verify rollback command and previous artifact reference
- [x] Internal beta announcement + known limitations
