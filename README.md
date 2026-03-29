# OMDALA

OMDALA is the master global brand.

This repository is the foundation for:

- `omdala.com`
- `app.omdala.com`
- `api.omdala.com`
- future `docs.omdala.com`

OMDALA is not a city website and not a tourism site. It is the global operating layer for real-world value, trust, and coordination.

## Role in the brand system

- `OMDALA` = master/global platform brand
- `OMDALAT` = first city implementation and living lab

## Positioning

Primary line:

- OMDALA
- The Operating Layer for Real-World Value

Supporting line:

- Activate people, places, and intelligence.

## Start here

Read:

1. `docs/MASTER_BUILD_SYSTEM_OMDALA_OMDALAT.md`
2. `docs/BRAND_ARCHITECTURE_OMDALA.md`
3. `docs/README_DEV_HANDOFF_OMDALA.md`

## Repo structure

```text
omdala.com/
  apps/
    web/
    app/
  packages/
    ui/
  services/
    api/
  docs/
  index.html
  styles.css
```

## Immediate build intent

This repo starts as a static-first foundation plus handoff docs.
The next build phase should turn it into the real master platform surface for the OMDALA ecosystem.

## Local development

The active frontend now lives in `apps/web` as a Next.js app.

```bash
npm install
npm run dev
```

Default local URL:

- `http://localhost:3000`

If that port is already in use, Next.js uses the next available port.

## Web build

```bash
npm run build
```

## Application shell

The logged-in product shell now lives in `apps/app`.

```bash
cd apps/app
npm install
cd ../..
npm run dev:app
```

Default local URL:

- `http://localhost:3000`

You can point the app shell at the backend skeleton with:

```bash
NEXT_PUBLIC_OMDALA_API_BASE_URL=http://127.0.0.1:8789 npm run dev:app
```

## API skeleton

The backend boundary now lives in `services/api` as a Cloudflare Worker.

```bash
cd services/api
npm install
cd ../..
npm run dev:api
```

Default local URL:

- `http://127.0.0.1:8789`

## Static prototype commands

The original static foundation at the repo root is still available:

```bash
npm run dev:static
npm run build:static
npm run preview:static
```

`npm run build:static` writes a deployable static bundle to `dist/`.
