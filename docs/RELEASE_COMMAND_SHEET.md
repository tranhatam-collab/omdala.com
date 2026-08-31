# RELEASE COMMAND SHEET - SURFACE MAP

Use these commands when you want an explicit surface-to-branch mapping and do not want to rely on defaults.

## Production Mapping

- `api` -> Worker production environment
- `app` -> Pages production branch `main`
- `auth` -> Pages production branch `production`
- `web` -> Pages production branch `main`

## Production Commands

```bash
pnpm release:deploy:api:prod
pnpm release:deploy:app:prod
pnpm release:deploy:auth:prod
pnpm release:deploy:web:prod
```

## Preview Commands

```bash
pnpm release:deploy:api:preview
pnpm release:deploy:app:preview
pnpm release:deploy:auth:preview
pnpm release:deploy:web:preview
```

## Full Pipeline

```bash
pnpm release:deploy
pnpm release:deploy:preview
pnpm release:verify
```

## Safe Team Rule

- Use the explicit `:prod` or `:preview` commands for single-surface deploys.
- Keep `pnpm release:deploy:*:only` only for backwards compatibility.
- Do not assume all Pages projects use the same production branch.
