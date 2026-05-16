# Bilingual Hard-code Scan

- Generated at: 2026-04-23T13:43:59.795Z
- Files scanned: 140
- Findings: 53
- Team 2 unresolved P0: 12
- Team 2 inventory: present

## Findings By Owner

- Team 1: 8
- Team 2: 45

## Findings By Risk

- P1: 22
- P0: 13
- P2: 18

## Top Unresolved Team 2 P0

- apps/app/app/sign-in/page.js:8:13 [jsx_attr:title] Passwordless-first entry for operators and members.
- apps/app/app/sign-in/page.js:12:42 [jsx_text] Current skeleton
- apps/app/app/sign-in/page.js:14:17 [jsx_text] Magic-link request endpoint
- apps/app/app/sign-in/page.js:15:17 [jsx_text] Anonymous session fallback
- apps/app/app/sign-in/page.js:16:17 [jsx_text] Room to add wallet or invite flows later
- apps/app/app/sign-in/page.js:25:42 [jsx_text] How this behaves now
- apps/app/app/sign-in/page.js:26:15 [jsx_text] The backend returns a real API response, but does not send email yet.
- apps/app/app/sign-in/page.js:28:13 [jsx_text] This is deliberate. It gives the frontend a stable auth contract before we wire providers, persistence, or session storage.
- apps/app/components/magic-link-form.js:45:15 [jsx_text] Email
- apps/app/components/magic-link-form.js:65:13 [jsx_text] Request ID:
- apps/app/components/magic-link-form.js:72:19 [jsx_text] Auth request failed
- apps/auth/app/layout.tsx:10:16 [object_property:description] Central authentication surface for OMDALA domains.
