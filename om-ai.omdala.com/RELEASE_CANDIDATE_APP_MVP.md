# Release Candidate - App MVP

Date: 2026-04-04  
Status: Candidate prepared

## Scope

- web gates finalized (requestId diagnostics UI, smoke script, lighthouse baseline script)
- shared contract locked at `shared/api-contracts.ts` version `1.0.0`
- app session manager aligned with `APP_SESSION_POLICY.md`
- app MVP flows implemented:
  - magic-link request + callback handling
  - timeline list + run detail
  - scene list + run action
  - settings/logout
- app smoke + CI pipeline prepared

## Verification commands

```bash
npm run verify:prod
npm run verify:app
npm run e2e:app:mvp
npm run verify:web:gates
```

## Release notes summary

- unified web and app contracts on versioned shared types
- completed app MVP core user journey (sign in -> timeline -> scene run -> settings)
- added app CI workflow and smoke scripts for release confidence
