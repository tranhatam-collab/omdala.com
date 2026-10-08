# Deploy home page to Cloudflare Pages

This repository includes a deploy-ready setup for the `web` app as a public introduction home page.

## One-time setup on Cloudflare

1. Create a Cloudflare Pages project named `ai-omdala-home`.
2. Create an API token with minimum permissions for Pages deploy.
3. Export local env vars before deploy:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Optional but recommended: set a custom domain in Cloudflare Pages (for example `app.omdala.com`).

## Manual deploy from local

```bash
npm install
npm --prefix web install
npm run deploy:home

# optional post-deploy check
HOME_URL="https://<your-pages-domain>" npm run verify:home
```

## Build metadata on landing page

The landing page can show deploy metadata with Vite env values at build time:

- `VITE_DEPLOY_STATUS` (example: `production`)
- `VITE_RELEASE_TAG` (example: git SHA or semantic tag)
- `VITE_API_BASE_URL` (example: `https://api.omdala.com`)

Example local build:

```bash
VITE_DEPLOY_STATUS=production \
VITE_RELEASE_TAG=v2026.04.04-rc.1 \
VITE_API_BASE_URL=https://api.omdala.com \
npm run build:home
```

## Direct deploy from local CLI (recommended)

Use local deploy as the primary path (no GitHub dependency):

```bash
npm install
npm --prefix web install
VITE_DEPLOY_STATUS=production \
VITE_RELEASE_TAG=manual-local \
VITE_API_BASE_URL=https://api.omdala.com \
npm run deploy:home
```

One-command direct path (recommended for daily deploy):

```bash
CLOUDFLARE_ACCOUNT_ID=<your-account-id> \
CLOUDFLARE_API_TOKEN=<your-token> \
VITE_DEPLOY_STATUS=production \
VITE_RELEASE_TAG=manual-local \
VITE_API_BASE_URL=https://api.omdala.com \
npm run deploy:home:direct
```

This command builds, deploys, then prints current deployment list.

Deploy directly to production environment (Pages `main` branch):

```bash
CLOUDFLARE_ACCOUNT_ID=<your-account-id> \
CLOUDFLARE_API_TOKEN=<your-token> \
VITE_DEPLOY_STATUS=production \
VITE_RELEASE_TAG=manual-prod \
VITE_API_BASE_URL=https://api.omdala.com \
npm run deploy:home:prod
```

One command deploy + production verification:

```bash
CLOUDFLARE_ACCOUNT_ID=<your-account-id> \
CLOUDFLARE_API_TOKEN=<your-token> \
VITE_DEPLOY_STATUS=production \
VITE_RELEASE_TAG=manual-prod \
VITE_API_BASE_URL=https://api.omdala.com \
HOME_URL=https://app.omdala.com \
API_BASE_URL=https://api.omdala.com \
npm run deploy:prod:full
```

## Fast rollback (production)

If a new production deployment is bad, rollback by redeploying a previous local artifact.

The deploy script stores each built artifact under `.deploy-artifacts/<timestamp>-<release-tag>`.

Auto rollback to previous artifact:

```bash
CLOUDFLARE_ACCOUNT_ID=<your-account-id> \
CLOUDFLARE_API_TOKEN=<your-token> \
npm run rollback:home:prod
```

Rollback to a specific artifact:

```bash
CLOUDFLARE_ACCOUNT_ID=<your-account-id> \
CLOUDFLARE_API_TOKEN=<your-token> \
BACKUP_DIR=.deploy-artifacts/<timestamp>-<release-tag> \
npm run rollback:home:prod
```

## Release snapshot log

Write a local markdown snapshot with deployment list and release metadata:

```bash
CLOUDFLARE_ACCOUNT_ID=<your-account-id> \
CLOUDFLARE_API_TOKEN=<your-token> \
RELEASE_TAG=v2026.04.04 \
HOME_URL=https://app.omdala.com \
API_BASE_URL=https://api.omdala.com \
npm run release:snapshot
```

Output path: `release-snapshots/<timestamp>-<release-tag>.md`

## GitHub Actions (optional, manual only)

Workflow file: `.github/workflows/deploy-home.yml`

- Trigger is `workflow_dispatch` only.
- No automatic deploy on push.
- Build step injects `VITE_DEPLOY_STATUS`, `VITE_RELEASE_TAG`, `VITE_API_BASE_URL`.

If you use this optional workflow, then add GitHub secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Custom domain + redirects

In Cloudflare Pages project settings:

1. Add custom domain (e.g. `app.ai-omdala.com`).
2. Add redirect rules if needed:
   - apex to app: `ai-omdala.com/*` -> `https://app.ai-omdala.com/:splat` (301)
   - docs path forwarding can be handled similarly if required.

## Local verification

```bash
npm run build:home
npm --prefix web run preview
HOME_URL="http://localhost:4173" npm run verify:home
```

## Production verification (direct)

```bash
HOME_URL="https://app.omdala.com" \
API_BASE_URL="https://api.omdala.com" \
npm run verify:prod
```
