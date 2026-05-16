# RELEASE CHECKLIST

Product: Om AI
Repo: `omdala.com/om-ai.omdala.com`

## Build and CI

- [ ] `npm run ci` passes
- [ ] `npm run build:all` passes
- [ ] mobile release builds succeed
- [ ] no blocking contract drift remains

## Product checks

- [ ] live session works end to end
- [ ] reconnect path works
- [ ] personas, lessons, recap, memory, and transcript work
- [ ] family controls entry points work
- [ ] push works

## Backend checks

- [ ] `/health`, `/ready`, `/openapi.json`, and docs are reachable
- [ ] `/v2/live` contract matches shipped mobile build
- [ ] moderation and metering states are stable
- [ ] staging smoke passes against backend

## QA checks

- [ ] network-drop and reconnect smoke passes
- [ ] observability dashboards and logs are healthy
- [ ] no P0 or P1 blocker remains

## Release-owner checks

- [ ] tagged commit chosen
- [ ] env vars verified per service
- [ ] production-safe auth mode enabled
- [ ] secrets rotated if required
- [ ] rollback and on-call ownership confirmed
