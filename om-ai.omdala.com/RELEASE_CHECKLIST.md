# Release Checklist / Checklist phat hanh

## Dev / Moi truong phat trien

- `npm run ci` passes / `npm run ci` pass
- `npm --prefix backend run e2e` passes / e2e backend pass
- `npm run build:all` passes / build tong pass
- `docker compose up --build` starts all services / lenh docker khoi dong day du service
- `/health`, `/ready`, `/openapi.json`, `/docs` accessible / cac endpoint giamsat va tai lieu truy cap duoc

## Staging / Moi truong staging

- deploy from tagged commit / deploy tu commit da gan tag
- verify env vars are set per service / xac minh bien moi truong theo tung service
- run smoke test against staging backend / chay smoke tren backend staging
- verify approval and proof flow with real auth mode / xac minh luong phe duyet va bang chung voi auth thuc
- verify observability dashboards and logs / xac minh dashboard va log giamsat

## Production / Moi truong production

- change auth mode from dev to production-safe config / chuyen auth mode sang cau hinh an toan cho production
- rotate secrets and validate token scopes / xoay vong secret va xac minh scope token
- run migration plan if persistence backend changes / chay ke hoach migration neu thay doi backend luu tru
- run smoke test on production readiness endpoint / chay smoke tren readiness endpoint production
- verify rollback plan and on-call ownership / xac minh ke hoach rollback va phan cong on-call
