# services/api

Future backend service boundary for `api.omdala.com`.

## Deploy environments

- `production` uses default `wrangler.toml` `[vars]`.
- `preview` uses `[env.preview.vars]`.
- `staging` uses `[env.staging.vars]`.

Use:

- `pnpm --filter @omdala/api deploy` for production
- `pnpm --filter @omdala/api deploy -- --env preview`
- `pnpm --filter @omdala/api deploy -- --env staging`

