# App Kickoff Checklist

Use this checklist after web exit criteria is met.

## Prerequisites

- [x] `app.omdala.com` production verified
- [x] `api.omdala.com` production verified
- [x] web auth + timeline + scene flows stable
- [x] API contract for app consumption frozen

## Technical setup

- [x] create app workspace/module structure
- [x] wire env config for production/staging API base
- [x] implement shared API envelope parser
- [x] implement session/token storage policy

## Feature MVP

- [x] magic-link request + callback handling
- [x] timeline list screen
- [x] run detail/proof detail screen
- [x] scene list + run action
- [x] settings/logout screen

## Quality gates

- [x] unit tests for core modules
- [x] integration tests for API client
- [x] smoke test script for app login/timeline/scene (`npm run verify:app`)
- [ ] beta distribution checklist complete
