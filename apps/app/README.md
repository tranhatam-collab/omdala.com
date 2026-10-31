# apps/app

Next.js application shell for `app.omdala.com`.

## Commands

From the repo root:

```bash
npm run dev:app
npm run build:app
```

The API origin comes from `NEXT_PUBLIC_API_URL` together with `NEXT_PUBLIC_RELEASE_ENVIRONMENT` (see `lib/api-client.ts`); there is no localhost default.
