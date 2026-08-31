# OMDALA Brandpro Lock

Date: 2026-05-12
Status: ACTIVE DEV LOCK
Scope: `omdala.com` master web surface only
Brandpro source: `/Users/tranhatam/Documents/Devnewproject/Brandpro-all`

## 1. Purpose

This file locks how Brandpro-all applies to OMDALA so parallel teams can keep one brand standard while working in the same repo.

It does not replace product specs, API contracts, auth work, or OMDALAT execution docs. It is the brand gate for OMDALA master web, public copy, route naming, and team-facing UI decisions.

## 2. Brandpro application result

Brandpro gate mapping:

| Brandpro gate | OMDALA lock |
|---|---|
| Founder brief | OMDALA is the master global operating layer |
| Forensics | Do not position as social, travel, marketplace, or generic AI |
| Risk matrix | Highest risk is category dilution across Om AI, AI Omniverse, OMDALAT, and OMDALA |
| Naming | User-facing master brand is always `OMDALA` |
| Pillars | Visibility, trust, coordination, proof, real-world activation |
| Verbal identity | Calm, operational, premium, precise |
| Visual identity | Signal & Substrate: deep space, cyan signal, gold verification only |
| SEO/entity | `omdala.com` is master homepage; app/API/docs are sub-surfaces |
| Legal/defense | Avoid investment promises, guaranteed outcomes, and confusing third-party category claims |
| Governance | Every team must run brand lint before merging UI/copy/docs changes |

## 3. Naming lock

Approved:

- `OMDALA`
- `OMDALA Web`
- `OMDALA App`
- `OMDALA API`
- `OMDALA Docs`
- `OMDALA Trust`
- `OMDALA Admin`
- `OMDALA Match`
- `OMDALA Flow`
- `OMDALAT` only as the first proof/city implementation under OMDALA

Avoid:

- `Omdala` in public copy
- `Omdala marketplace`
- `Omdala travel`
- `Omdala social`
- `OMDALA chatbot`
- `AI Om` as a public-facing OMDALA master brand

## 4. Positioning lock

Primary statement:

> OMDALA is the operating layer for real-world state transitions.

Supporting statement:

> OMDALA turns underused people, places, skills, and trust into visible, verifiable coordination.

Approved category phrases:

- verified coordination infrastructure
- global operating layer
- Human Coordination OS
- Life Resource Operating System

Forbidden category drift:

- social app
- travel platform
- tourism platform
- simple marketplace
- chatbot platform
- AI tool as the primary category

## 5. Visual lock

Signal & Substrate is the active dev lock for OMDALA web:

| Layer | Rule |
|---|---|
| Substrate | `#040816`, `#08101f`, `#0b1326`, `#101c33` |
| Signal | `#3de7ff`, `#7ef2ff`, `#3d8bff` |
| Verification | `#D4AF37`, `#E5C158`, `#FFD700` only for verified proof or approved lock state |
| Surface radius | Sharp system cards, 8px default |
| Typography | Operational sans UI, no decorative luxury serif as the master web default |
| Motion | Slow scan and interaction feedback only; reduced motion must be respected |

Do not use gold as decoration. Gold means proof, approval, or verified state.

## 6. Team gate

Before merge, every UI/copy/docs PR touching OMDALA master surfaces must pass:

```zsh
npm run brand:lint
npm run brand:lint:static
npm run build
npm run build:static
```

Ownership:

| Team | Responsibility |
|---|---|
| Team 1 | Repo hygiene, branch scope, staged-file discipline |
| Team 2 | Docs, admin wording, stale copy removal |
| Team 3 | Release evidence, screenshots, before/after proof |
| UI owners | Components, layout, accessibility, reduced motion |
| Product owners | Naming, route language, category integrity |

## 7. Files now in lock scope

- `apps/web/app/page.js`
- `apps/web/app/layout.js`
- `apps/web/app/globals.css`
- `index.html`
- `styles.css`
- `docs/BRAND_ARCHITECTURE_OMDALA.md`
- `docs/OMDALA_V2_SIGNAL_SUBSTRATE.md`
- `docs/README_DEV_HANDOFF_OMDALA.md`
- `scripts/brand-lint-omdala.sh`
- `package.json`
- `README.md`
- `tsconfig.base.json` (build blocker fix for current team TS configs)

Do not assume this lock applies to `apps/app`, `apps/admin`, `apps/auth`, `apps/docs`, `om-ai.omdala.com`, or `omniverse.omdala.com` until a separate surface-specific extension packet is created.

## 8. Reject rule

Reject any OMDALA master web change that makes the brand feel like:

- a generic startup page
- a local listing board
- a travel/city guide
- a social network
- a chatbot product
- an investment-promise funnel

The master web surface must stay calm, precise, systemic, trustworthy, and operational.
