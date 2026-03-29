# DNS_SUBDOMAIN_DEPLOYMENT_LOCK_OMDALA.md

## OMDALA SYSTEM
## DNS + Subdomain + Cloudflare Deployment Lock
## Version 1.0

---

## 1. PURPOSE

This file locks:
- DNS architecture
- subdomain deployment targets
- Cloudflare configuration
- routing logic
- environment separation strategy
- security rules

Goal: deploy a scalable, secure, SEO-safe subdomain system from day one with zero architectural debt.

---

## 2. ROOT DOMAIN CONFIG

Primary domain: `omdala.com`

Registrar / DNS provider: **Cloudflare**

Required Cloudflare settings:
- SSL/TLS mode: **Full (strict)**
- Always Use HTTPS: **ON**
- Automatic HTTPS Rewrites: **ON**
- HTTP → HTTPS redirect: **ON**
- HSTS: enabled with includeSubDomains after all subdomains are HTTPS-ready

---

## 3. CANONICAL HOST RULE

Preferred canonical:
```
https://omdala.com
```

Required redirect rules (Cloudflare Redirect Rules or Pages `_redirects`):

```
http://omdala.com/*          → https://omdala.com/:splat    (301)
http://www.omdala.com/*      → https://omdala.com/:splat    (301)
https://www.omdala.com/*     → https://omdala.com/:splat    (301)
```

---

## 4. CORE DNS RECORDS

### 4.1 Apex Domain

```
Type:   A  (or CNAME if using Cloudflare Pages CNAME flattening)
Name:   @
Value:  Cloudflare Pages deployment URL
Proxy:  ON (orange cloud)
TTL:    Auto
```

### 4.2 WWW Redirect

```
Type:   CNAME
Name:   www
Value:  omdala.com
Proxy:  ON
TTL:    Auto
```

Handle the actual redirect via Cloudflare Redirect Rule, not DNS alone.

---

## 5. CORE SUBDOMAIN DNS RECORDS

Each production subdomain is explicitly defined — no reliance on wildcard as substitute.

### 5.1 app.omdala.com

```
Type:   CNAME
Name:   app
Value:  <cloudflare-pages-app-project>.pages.dev
Proxy:  ON
```

Cloudflare Pages custom domain: `app.omdala.com`

Environment:
- Production → `main` branch
- Staging → `develop` branch
- Preview → PR branches (auto-generated preview URL)

### 5.2 api.omdala.com

```
Type:   CNAME (or Worker Route)
Name:   api
Value:  <worker-name>.workers.dev
Proxy:  ON
```

Cloudflare Worker custom domain: `api.omdala.com`

Worker route:
```
api.omdala.com/*  →  omdala-api Worker
```

Note: Cloudflare Workers Custom Domains require explicit subdomain configuration per domain. Wildcard custom domains are not supported for Workers. Declare `api.omdala.com` explicitly.

### 5.3 docs.omdala.com

```
Type:   CNAME
Name:   docs
Value:  <docs-pages-project>.pages.dev
Proxy:  ON
```

Cloudflare Pages custom domain: `docs.omdala.com`

### 5.4 admin.omdala.com

```
Type:   CNAME
Name:   admin
Value:  <admin-pages-project>.pages.dev
Proxy:  ON
```

Security requirement: must be placed behind **Cloudflare Zero Trust Access** policy before any internal user accesses it.

Access policy:
- Require identity provider authentication
- Allowlist specific email domains only
- Log all access attempts

### 5.5 trust.omdala.com

```
Type:   CNAME
Name:   trust
Value:  <trust-pages-project>.pages.dev
Proxy:  ON
```

Public-facing. No access restriction. SEO-indexable.

### 5.6 status.omdala.com

```
Type:   CNAME
Name:   status
Value:  <status-service-endpoint>
Proxy:  ON
```

Can use Cloudflare Pages or an external status service (e.g. Instatus, Betterstack).

---

## 6. OMDALAT DOMAIN

Separate domain: `omdalat.com`

Configured independently but semantically linked to OMDALA.

### 6.1 DNS Records

```
Type:   A or CNAME
Name:   @
Value:  <omdalat-pages-project>.pages.dev
Proxy:  ON

Type:   CNAME
Name:   www
Value:  omdalat.com
Proxy:  ON
```

Redirect: `www.omdalat.com` → `omdalat.com` (301)

### 6.2 app.omdalat.com

```
Type:   CNAME
Name:   app
Value:  <omdalat-app-pages-project>.pages.dev
Proxy:  ON
```

### 6.3 SSL

SSL for omdalat.com must be configured separately. Cloudflare manages SSL per-zone. Add omdalat.com as a separate zone in Cloudflare.

---

## 7. WILDCARD DNS STRATEGY

### 7.1 Optional Wildcard Record

```
Type:   CNAME
Name:   *
Value:  fallback.omdala.com
Proxy:  ON
```

Use only for:
- preview environments
- experimental features
- temporary staging layers

### 7.2 Wildcard Rules

- Wildcard DNS records do **not** replace explicit subdomain DNS records for production.
- Cloudflare Workers Custom Domains do **not** support wildcard matching — each subdomain must be configured individually.
- Cloudflare Pages custom domains do **not** support wildcard matching — each project's domain must be explicitly added.
- Never use wildcard as the primary production routing mechanism for any branded subdomain.

---

## 8. CLOUDFLARE PAGES DEPLOYMENT

### 8.1 Required Projects

| Project Name | Custom Domain | Branch (Production) |
|---|---|---|
| `omdala-web` | `omdala.com` | `main` |
| `omdala-app` | `app.omdala.com` | `main` |
| `omdala-docs` | `docs.omdala.com` | `main` |
| `omdala-admin` | `admin.omdala.com` | `main` |
| `omdala-trust` | `trust.omdala.com` | `main` |
| `omdalat-web` | `omdalat.com` | `main` |
| `omdalat-app` | `app.omdalat.com` | `main` |

### 8.2 Each Cloudflare Pages Project Must Have

- Connected to GitHub repository (specific directory or repo)
- Automatic deploy on push to `main`
- Preview deploys enabled for pull requests
- Environment variables set per environment (Production / Preview)
- Build command and output directory correctly set

---

## 9. ENVIRONMENT STRATEGY

### 9.1 Environments

| Environment | Branch | Domain Pattern |
|---|---|---|
| Production | `main` | `omdala.com`, `app.omdala.com`, etc. |
| Staging | `develop` | `staging.omdala.com` or Pages preview URL |
| Preview | PR branches | Auto-generated `.pages.dev` URL |

### 9.2 Environment Variable Rules

- Production secrets must never be used in preview environments.
- Each environment must have its own `API_URL`, `APP_URL`, analytics keys, etc.
- Use Cloudflare Pages environment variables per-environment, not a single shared set.

---

## 10. PREVIEW DOMAIN SEO RULE

All preview and staging domains must:
- include `<meta name="robots" content="noindex, nofollow">` in HTML
- return `X-Robots-Tag: noindex` in HTTP response headers
- never be submitted to search engines
- never be linked from production pages

Enforce via `_headers` file:

```
# For preview / staging environments only
/*
  X-Robots-Tag: noindex, nofollow
```

---

## 11. CLOUDFLARE WORKERS ROUTING

### 11.1 API Worker

```
Route:   api.omdala.com/*
Worker:  omdala-api
```

### 11.2 Background Jobs (optional future)

```
Route:   jobs.omdala.com/*
Worker:  omdala-jobs
```

### 11.3 Worker Deployment Rule

For every Worker deployed to a custom domain:
- Add the custom domain explicitly in the Worker settings
- Do not assume `workers.dev` subdomain mapping carries over
- Verify the route is not conflicting with any Pages deployment

---

## 12. SECURITY RULES

### 12.1 Must Enable (all zones)

- **WAF** (Web Application Firewall) — Cloudflare managed rules ON
- **Bot Fight Mode** — ON
- **DDoS Protection** — always ON (free tier minimum)
- **Rate Limiting** — apply to `api.omdala.com/*` with aggressive thresholds
- **Hotlink Protection** — ON for media assets

### 12.2 Admin Subdomain

`admin.omdala.com` must:
- be protected via **Cloudflare Zero Trust Access**
- require SSO or identity provider login
- never be publicly accessible
- have all access logged

### 12.3 API Subdomain

`api.omdala.com` must:
- enforce rate limiting
- require authentication on all non-public endpoints
- return appropriate CORS headers — never open wildcard `*` in production
- never serve raw error stack traces in production responses

---

## 13. CACHE RULES

### 13.1 Static Assets

```
Cache-Control: public, max-age=31536000, immutable
```

Apply to: fonts, hashed JS/CSS bundles, static images.

### 13.2 HTML Pages

```
Cache-Control: public, max-age=0, must-revalidate
```

Or use Cloudflare Cache Rules with short TTL + stale-while-revalidate for public marketing pages.

### 13.3 API Responses

```
Cache-Control: no-store
```

Apply to all dynamic, authenticated, or sensitive API endpoints.

---

## 14. REQUIRED HTTP HEADERS

Configure via `_headers` file (Cloudflare Pages) or Cloudflare Transform Rules:

```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Content-Security-Policy must be tuned per-subdomain based on what third-party scripts are loaded. Do not use blanket `unsafe-inline` in production.

---

## 15. REDIRECTS FILE (_redirects)

Root of each Cloudflare Pages project:

```
# HTTP to HTTPS (handled by Cloudflare, but defense-in-depth)
http://* https://:splat 301

# www to non-www (if not handled at DNS layer)
https://www.omdala.com/* https://omdala.com/:splat 301
```

For single-page app routing (if needed):
```
/* /index.html 200
```

---

## 16. FULL DEPLOYMENT MAP

```
omdala.com
  DNS:        A → Cloudflare Pages
  Project:    omdala-web
  Branch:     main
  Index:      yes
  Security:   standard headers, WAF

app.omdala.com
  DNS:        CNAME → omdala-app.pages.dev
  Project:    omdala-app
  Branch:     main
  Index:      no (noindex on all routes)
  Security:   auth required, standard headers

api.omdala.com
  DNS:        CNAME → Worker route
  Worker:     omdala-api
  Index:      no
  Security:   rate limiting, WAF, no wildcard CORS

docs.omdala.com
  DNS:        CNAME → omdala-docs.pages.dev
  Project:    omdala-docs
  Branch:     main
  Index:      yes (public routes only)
  Security:   standard headers

admin.omdala.com
  DNS:        CNAME → omdala-admin.pages.dev
  Project:    omdala-admin
  Branch:     main
  Index:      no
  Security:   Cloudflare Zero Trust Access, restricted

trust.omdala.com
  DNS:        CNAME → omdala-trust.pages.dev
  Project:    omdala-trust
  Branch:     main
  Index:      yes
  Security:   standard headers

status.omdala.com
  DNS:        CNAME → status service
  Index:      yes (low priority)
  Security:   standard headers

omdalat.com
  DNS:        A → Cloudflare Pages
  Project:    omdalat-web
  Branch:     main
  Index:      yes
  Security:   standard headers, WAF

app.omdalat.com
  DNS:        CNAME → omdalat-app.pages.dev
  Project:    omdalat-app
  Branch:     main
  Index:      mixed (public pages only)
  Security:   auth required on private routes
```

---

## 17. LAUNCH READINESS CHECKLIST — DNS + DEPLOY

Before going live, verify:

- [ ] All DNS records created and propagated
- [ ] All Cloudflare Pages projects connected to GitHub
- [ ] Custom domains added to each Pages project
- [ ] SSL active on all subdomains
- [ ] `www` redirect configured and tested
- [ ] `http://` → `https://` redirect verified
- [ ] Security headers present on all subdomains
- [ ] WAF enabled
- [ ] Rate limiting on API enabled
- [ ] admin.omdala.com behind Zero Trust Access
- [ ] Preview environments serving `noindex` headers
- [ ] Environment variables set per environment
- [ ] No subdomain accidentally serving production data in staging

---

## 18. FINAL RULE

Every subdomain must have:
- a clear purpose
- a clear deployment target
- a clear SEO policy
- a clear security rule

No random subdomains allowed.

No production subdomain left on wildcard routing alone.

No security headers forgotten on launch.

---

*DNS_SUBDOMAIN_DEPLOYMENT_LOCK_OMDALA.md — Version 1.0*
*Status: Final Deployment Lock*
