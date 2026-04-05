# Contributing

## Local Setup

1. `make install`
2. `make ci`
3. `make dev`

## Branching

- use focused branches per feature or fix
- keep changes scoped by domain (`backend`, `web`, `gateway`, `ios`)

## Required Checks

- `npm run ci`
- `npm run build:all`
- backend tests pass

## Commit Guidance

- concise intent-first messages
- mention policy/proof impact for execution changes
- include test notes in PR description
