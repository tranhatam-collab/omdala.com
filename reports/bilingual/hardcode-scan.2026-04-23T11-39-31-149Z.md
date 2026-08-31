# Bilingual Hard-code Scan

- Generated at: 2026-04-23T11:39:31.149Z
- Files scanned: 142
- Findings: 390
- Team 2 unresolved P0: 41
- Team 2 inventory: missing

## Findings By Owner

- Team 1: 19
- Team 2: 371

## Findings By Risk

- P1: 331
- P0: 41
- P2: 18

## Top Unresolved Team 2 P0

- apps/app/app/(auth)/login/page.tsx:33:17 [jsx_text] auth host -&gt; api session exchange -&gt; cookie session -&gt; app
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
- apps/app/e2e/smoke-auth-dashboard.spec.ts:33:21 [object_property:name] OpenAI Realtime
- apps/app/e2e/smoke-auth-dashboard.spec.ts:40:21 [object_property:name] OpenAI Responses
- apps/app/e2e/smoke-auth-dashboard.spec.ts:47:21 [object_property:name] Fallback Mock Provider
- apps/app/e2e/smoke-auth-dashboard.spec.ts:72:27 [object_property:providerName] OpenAI Realtime
- apps/app/e2e/smoke-auth-dashboard.spec.ts:92:27 [object_property:providerName] OpenAI Responses
- apps/app/e2e/smoke-auth-dashboard.spec.ts:125:5 [call_arg:toContainText] Continue on the dedicated OMDALA auth surface.
- apps/app/e2e/smoke-auth-dashboard.spec.ts:162:5 [call_arg:toContainText] Secure login for OMDALA operator surfaces.
- apps/app/e2e/smoke-auth-dashboard.spec.ts:174:39 [object_property:name] OMDALA Operator
- apps/app/e2e/smoke-auth-dashboard.spec.ts:176:31 [call_arg:getByText] Profile is now the Team 1 entry point
- apps/app/e2e/smoke-auth-dashboard.spec.ts:177:31 [call_arg:getByText] Account identity
- apps/app/e2e/smoke-auth-dashboard.spec.ts:178:31 [call_arg:getByText] Email: operator@omdala.com
- apps/app/e2e/smoke-auth-dashboard.spec.ts:179:31 [call_arg:getByText] Timezone: Asia/Ho_Chi_Minh
- apps/app/e2e/smoke-auth-dashboard.spec.ts:180:31 [call_arg:getByText] Theme: system
- apps/app/e2e/smoke-auth-dashboard.spec.ts:181:31 [call_arg:getByText] Profile update flow
- apps/app/e2e/smoke-auth-dashboard.spec.ts:182:31 [call_arg:getByText] Save profile contract
- apps/app/e2e/smoke-auth-dashboard.spec.ts:193:50 [object_property:name] Settings
- apps/app/e2e/smoke-auth-dashboard.spec.ts:194:31 [call_arg:getByText] Settings is the Team 1 entry point
- apps/app/e2e/smoke-auth-dashboard.spec.ts:195:31 [call_arg:getByText] Billing contract summary
- apps/app/e2e/smoke-auth-dashboard.spec.ts:196:31 [call_arg:getByText] App ID: om-ai
- apps/app/e2e/smoke-auth-dashboard.spec.ts:197:31 [call_arg:getByText] Billing cycle: monthly
- apps/app/e2e/smoke-auth-dashboard.spec.ts:199:20 [call_arg:getByText] Subscription visibility: full
- apps/app/e2e/smoke-auth-dashboard.spec.ts:202:20 [call_arg:getByText] 12/30 call minutes used today.
- apps/app/e2e/smoke-auth-dashboard.spec.ts:205:20 [call_arg:getByText] 5 billing-aware Om AI events are now locked.
- apps/app/e2e/smoke-auth-dashboard.spec.ts:207:31 [call_arg:getByText] Preferences update flow
- apps/app/e2e/smoke-auth-dashboard.spec.ts:209:55 [object_property:hasText] Beta gate
- apps/app/e2e/smoke-auth-dashboard.spec.ts:211:31 [call_arg:getByText] Provider routing snapshot
- apps/app/e2e/smoke-auth-dashboard.spec.ts:214:20 [call_arg:getByText] live-call: openai-realtime (dự phòng: fallback-mock) — điểm số 0.944
- apps/app/e2e/smoke-auth-dashboard.spec.ts:217:20 [call_arg:getByText] persona-response: none (dự phòng: none) — điểm số 0.000
- apps/auth/app/layout.tsx:10:16 [object_property:description] Central authentication surface for OMDALA domains.
