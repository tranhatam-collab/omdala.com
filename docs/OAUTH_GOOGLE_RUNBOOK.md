# OAuth Google Runbook — OMDALA Auth

## Environment Variables

### Required (all environments)

| Variable | Description | Source |
|----------|-------------|--------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Must match authorized redirect in GCP | `https://api.omdala.com/v1/auth/google/callback` |
| `GOOGLE_OAUTH_STATE_SECRET` | HMAC key for state parameter validation | Generate with: `openssl rand -hex 32` |
| `MAGIC_LINK_SECRET` | Fallback if `GOOGLE_OAUTH_STATE_SECRET` unset | Shared with magic-link flow |

### Runtime (auth web app)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_AUTH_API_BASE` | API base URL for OAuth start endpoint | `http://localhost:8787` (dev) / `OMDALA_API_ORIGIN` (prod) |
| `NEXT_PUBLIC_API_URL` | API base URL for session exchange & magic-link | `OMDALA_API_ORIGIN` from `@omdala/core` |

## Auth Topology

```
app.omdala.com  ──→  auth.omdala.com  ──→  api.omdala.com
     │                    │                        │
     │  (1) redirect       │  (2) GET /login        │
     │  to login           │  ?next=/dashboard      │
     ▼                    ▼                        │
  User clicks          Google OAuth             (3) GET /v1/auth/google/start
  "Continue with       button                         │
  Google"                     │                 302 redirect to accounts.google.com
                              │                        │
                              ▼                        │
                         User authenticates       (4) POST /v1/auth/google/callback
                         with Google                  │
                              │                  Exchange code for tokens
                              ▼                  Fetch user profile
                         Redirect back to         Validate email_verified
                         api.omdala.com           Create session (access+refresh)
                              │                  Set cookies on .omdala.com
                              ▼
                         302 to app.omdala.com
                              │
                              ▼
                         Authenticated session
```

## Cookie Specification

| Cookie | Type | Max-Age | Domain | Secure | HttpOnly |
|--------|------|---------|--------|--------|----------|
| `omdala_session` | access | 1 hour | `.omdala.com` | yes | yes |
| `omdala_refresh` | refresh | 7 days | `.omdala.com` | yes | yes |

Session tokens are stateless HMAC-signed JWTs (not stored in DB). Verification uses the same `MAGIC_LINK_SECRET`.

## Error Redirect Codes

| Error code | Condition | HTTP status |
|-----------|-----------|-------------|
| `provider_not_configured` | Missing env vars | 302 → /login?error=... |
| `oauth_provider_error` | Google returned ?error= | 302 → /login?error=... |
| `missing_code_or_state` | Missing query params | 302 → /login?error=... |
| `invalid_oauth_state` | State HMAC mismatch/expired | 302 → /login?error=... |
| `oauth_exchange_failed` | Token exchange non-200 | 302 → /login?error=... |
| `oauth_profile_failed` | Userinfo endpoint failed | 302 → /login?error=... |
| `oauth_email_unverified` | email_verified === false | 302 → /login?error=... |

## Dev Setup

```bash
# 1. Start API locally
npm --prefix services/api run dev

# 2. Start auth app locally
pnpm --prefix apps/auth run dev

# 3. Set env vars in .dev.vars (wrangler) or .env.local (next)
# services/api/.dev.vars:
#   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
#   GOOGLE_CLIENT_SECRET=xxx
#   GOOGLE_REDIRECT_URI=http://localhost:8787/v1/auth/google/callback
#   GOOGLE_OAUTH_STATE_SECRET=xxx (openssl rand -hex 32)
#   MAGIC_LINK_SECRET=xxx
#   ENVIRONMENT=development
#
# apps/auth/.env.local:
#   NEXT_PUBLIC_AUTH_API_BASE=http://localhost:8787
```

## Prod Deploy Checklist

- [ ] All 5 env vars set in Cloudflare Workers secrets (`wrangler secret`)
- [ ] `GOOGLE_REDIRECT_URI` matches exact URI in GCP OAuth consent screen
- [ ] `GOOGLE_OAUTH_STATE_SECRET` is unique per environment
- [ ] `MAGIC_LINK_SECRET` rotates on key compromise
- [ ] Session cookie domain `.omdala.com` covers all subdomains
- [ ] `NEXT_PUBLIC_AUTH_API_BASE` set in auth.omdala.com deployment
