# Om AI: implementation map, safety and plan rules, web quality, bridge consumer tests (draft)

Branch `claude/omdala-tai-omai` into `OMCODE/infra-e2e-auto-20261026`. Draft. Paths touched: `om-ai.omdala.com/**`, `services/ai/**`, `docs/06-strategy/reports/TAI/**`, and one line of `.github/workflows/ci.yml` (leased, see WO-TAI-CI).

## What changes, by order

| Order | SHA | Change |
|---|---|---|
| WO-TAI-01 | 516e130 | Requirement-to-code-to-test map of Om AI with status per row and cross-team dependencies |
| WO-TAI-02 | 13d6f19 | Backend: shared moderation module; session goal is screened; avatar use follows the stored plan; a child profile cannot start a persona that is not child-safe; memory profile input hardened |
| WO-TAI-CI | e5eb70e | CI also runs on `claude/omdala-**` pushes (one line) |
| WO-TAI-03 | 66b169d | `POST /v2/live/plans/upgrade` is closed for account holders (403 `PLAN_CHANGE_REQUIRES_BILLING`) until a billing authority decides entitlements |
| WO-TAI-04 | 66b169d | Mobile/web toolchain report (what runs in a Linux container, what needs macOS or devices) |
| WO-TAI-05 | cba5ccb | Web: clear bilingual messages for service down, quota used and provider busy |
| BL-TAI-01/02/03 | e1d3be3, 696dad1 | Metering tests; `services/ai` contract tests; memory schema fixtures and validators (not wired to any route) |
| WO-TAI-06 | fc41625, 5c8871b | Hermetic Playwright tests for the web live card (mocked API, no network); the test API transport lives outside `web/src` |
| WO-TAI-07 | 5c7a79a | Keyword screen normalizes input (case, diacritics, spacing, symbols); scope note says it is not a safety classifier |
| WO-TAI-08 | c79c3cb | Gateway: command and plugin-registry validation, plus negative tests |
| WO-TAI-09 | e8c5a67 | Release and test documents no longer count the keyword screen as moderation coverage |
| WO-TAI-10/11 | cde0132, bcb3034 | Contract-vs-code matrix and tests; contract documents now describe the implemented API |
| WO-TAI-12/16 | b8f05e6, c8a2be8 | Consumer side of the proposed OMDALA session bridge, with both token options behind one port; tests only, not wired into the app |
| WO-TAI-13 | c780cde | Client and extension specs aligned with the implemented API |
| WO-TAI-14/15 | 63d0141, 6025bd6 | Web accessibility: landmarks, labels, language switch with `<html lang>` following the locale, contrast checks |
| WO-TAI-17 | 984f640 | Vietnamese copy with diacritics; API failures map to the bilingual messages |

## Tests (local, at 984f640)

| Suite | Count |
|---|---|
| backend (`npm test`) | 107 pass, 0 fail |
| gateway | 19 pass |
| web unit (`npm test`) | 17 pass |
| web browser (`npm run test:e2e`, Chromium) | 26 pass |
| `services/ai` (`node --test tests/*.test.ts`) | 5 pass |
| mobile contract (`app`) | 15 node + 4 jest pass |

Hosted CI ("OMDALA CI") is green at run level on the head 984f640 (run 106). Three earlier runs on this branch were red for one reason, a test transport I had put under `web/src` that the mobile contract test forbids; fixed in 5c8871b.

## Behaviour to know about

- Direct access to the Om AI backend stays closed (503) until a session bridge exists. Nothing here opens it; the bridge code is not imported by the app or server, and tests check that.
- Realtime connect, token and bootstrap stay fail-closed; the session recap is a placeholder.
- Plan changes from the account holder are refused; the avatar and child-profile rules above are enforced at session creation.

## Open findings

1. Moderation is a keyword screen only; a reviewed classifier behind the AI authority is needed before any safety claim.
2. Family, organization, transcript, memory export/delete and billing features are missing and depend on the data authority (CTL-03) and Team 2.
3. Bridge assumptions needing Team 2 confirmation: scope names, token lifetime cap, issuer value, whether tokens are replayable until expiry.
4. The page is one document with both languages available by switch; the Vietnamese strings need a native-speaker review.
5. Several other spec files still describe older flows (listed in the WO-TAI-13 report).

## Waits for the owner or T1

- Real iOS bundle id and Android package name, and whether `ios/AIOmApp/**` becomes a project (WO-TAI-04).
- Owner choice between introspection and published keys for the bridge token (WO-TAI-16).
- T1: run `npm test` and `npm run test:e2e` for the web app and the `services/ai` tests in CI; they are not in the workflow today.
- Native-speaker review of the Vietnamese copy.
