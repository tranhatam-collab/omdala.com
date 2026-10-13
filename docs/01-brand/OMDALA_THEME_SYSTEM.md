# OMDALA_THEME_SYSTEM

## OMDALA.COM
## Final Theme Lock for Design + Frontend
## Version 1.2 — canonical brand lock for every *.omdala.com surface

---

## 1. Theme intent

OMDALA must feel like a global operating layer:

- deep
- calm
- intelligent
- premium
- systemic

The interface should suggest infrastructure, not spectacle.

---

## 2. Color system

Primary palette:

```css
--omdala-space-950: #040816;
--omdala-space-900: #08101F;
--omdala-space-850: #0B1326;
--omdala-space-800: #101C33;

--omdala-blue-700: #153A72;
--omdala-blue-600: #1D5BBF;
--omdala-blue-500: #3D8BFF;
--omdala-blue-400: #6BB2FF;

--omdala-cyan-500: #3DE7FF;
--omdala-cyan-400: #7EF2FF;

--omdala-white-100: #F7FBFF;
--omdala-white-200: #DDE8F5;
--omdala-white-300: #BFCDE1;
```

Meaning:

- space colors = depth and system gravity
- blue = technology and trust
- cyan = intelligence signal
- white = clarity and restraint

---

## 3. Typography

Primary UI font:

- Inter

Heading font:

- Sora

Rules:

- no decorative serif
- no playful display fonts
- no cyberpunk techno fonts

---

## 4. Surface language

Cards:

- dark glass
- low-noise border
- precise shadow
- rounded 16 to 20px

Buttons:

- pill shape for primary CTAs
- restrained glow
- no glossy gimmicks

Backgrounds:

- layered gradients
- subtle atmospheric light
- no noisy starfield or web3 visuals

---

## 5. Motion

Approved motion tone:

- slow
- intentional
- gliding
- layered

Never use:

- bounce-heavy motion
- gaming-style flashes
- random looping animation with no meaning

---

## 6. Component priorities

The first component set must include:

- navigation
- hero panels
- section shells
- cards
- badges
- status chips
- inline code surfaces
- trust indicators

---

## 7. Anti-patterns

Do not let OMDALA look like:

- a crypto dashboard
- a generic SaaS landing page
- a travel site
- a neon AI toy

---

## 8. Implementation rule

Design tokens must be defined once and shared across:

- `apps/web`
- `apps/app`
- `apps/docs`
- `apps/admin`

Theme drift is not allowed.

---

## 9. Status colors (v1.2)

Product surfaces (app, admin) need state colors. They are tuned to the space palette and are never used as decoration:

```css
--omdala-success: #3EE6A8;
--omdala-warning: #FFB020;
--omdala-danger:  #FF6B6B;
--omdala-danger-soft: #FFD6D6;
```

`#00FF88`, `#FF4444`, `#0B0B0B` and `#111111` from earlier drafts are retired: they read as neon/generic and break the space-950 depth.

---

## 10. Where this lives in code

| What | File |
|---|---|
| CSS tokens (single source of truth) | `packages/ui/src/styles/tokens.css` |
| JS mirror (themeColor, OG, email) | `packages/ui/src/tokens.ts` |
| Logo, icon, OG image | `packages/ui/assets/` |
| Shared components | `packages/ui/src/components/` |
| Drift guard (CI) | `pnpm brand:check` → `scripts/brand-check.mjs` |

Rules:

- every app root layout imports `@omdala/ui/styles/tokens.css` before its own `globals.css`
- app CSS may only alias tokens (`--app-bg: var(--omdala-bg-primary)`), never declare raw hex
- change a brand value in `tokens.css` and `tokens.ts` together, then run `pnpm brand:sync` if assets changed
