# apps/app

Authenticated product shell for `app.omdala.com`.

## Current completion scope

- Core auth flow wired to API magic-link request/verify endpoints.
- Dashboard route guard checks local session and redirects to login when missing.
- Signup access request flow uses unified API envelope handling.
- Runtime dashboard surfaces remain backed by structured mock graph data.

## E2E smoke

```bash
pnpm test:app:e2e:prod
```

- Validates login screen interaction.
- Validates dashboard redirect-to-login when session is missing.
