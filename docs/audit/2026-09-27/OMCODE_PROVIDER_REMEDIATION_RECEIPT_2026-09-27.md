# OMCODE and Provider Remediation Receipt

- **Recorded:** 2026-09-27
- **Verdict:** `PRODUCTION_HOLD`
- **Scope:** OMCODE AI source boundary, Provider CI deduplication, cross-repository contract, and legacy OMCODE guide governance.
- **Excluded:** merge, deployment, DNS, secrets, credential issuance, paid AI calls, production data, and Founder release approval.

## Source Identity

| Surface | Pull request | Reviewed head | Base | State at receipt time |
| --- | --- | --- | --- | --- |
| OMCODE Desktop | `tranhatam-collab/omdala.com#11` | `30b89f03f476abd4c86393cd27868cfa9a74f1e8` | `main` | Open, mergeable, CI success |
| AIAGENT Provider | `tranhatam-collab/AI.OMDALA.COM#6` | `54555eeec50bca6473dfdbba5e309c12d177d9d7` | `OMCODE/infra-provider-staging-unblock-20260925` | Open, mergeable, CI success |
| Legacy web guide | `tranhatam-collab/omdala.com#12` | `0aa63556cce5b59c68b3ed72a82f096ac820c481` | `feat/pricing-promo-engine` | Open, mergeable, documentation only |

The Provider pull request still targets a chained feature base, not a Founder-designated canonical integration branch. Its green status does not close the integration-base decision.

## Verified Receipts

### OMCODE Desktop

- GitHub Actions run: `36292752089`
- Candidate SHA: `30b89f03f476abd4c86393cd27868cfa9a74f1e8`
- Workflow result: success
- Unit tests: `107/107`
- Browser checks: `36/36` across Chromium and WebKit
- Native checks: `5/5`
- Installer checks: `11/11`
- Dependency vulnerabilities: `0`
- Source digest: `2938eaae0a75b9619b629492a210b01247153c81cedcc59c6190e6102e55bd4f`
- CI bundle-manifest digest: `80dd004489b2d727590700c7f764f90037cc8d295669ae66b59a068378532bd4`
- Payload files: `3909`

The AI source boundary now rejects non-AIAGENT cloud providers, host lookalikes, unsafe stored provider records, credential imports, and destination changes before network egress. Production and staging use separate Keychain accounts. MCP remains a separate tool-server boundary.

### Provider

- GitHub Actions run: `36293073974`
- Pull-request head: `54555eeec50bca6473dfdbba5e309c12d177d9d7`
- Tested GitHub merge checkout: `5e4f848ed0b6de28238c67b84cd3406d4c29623c`
- Pinned OMCODE consumer: `30b89f03f476abd4c86393cd27868cfa9a74f1e8`
- Source audit: `363` tests, `362` passed, `1` integration test skipped, `0` failed
- Cross-repository contract: `1/1` passed
- Dependency vulnerabilities: `0`
- Exact bundle SHA-256: `33097529bc29ae4f428540a921930f9cb5dcd0645c054faf25c963736b80d0e8`
- Bundle receipt: `VERIFIED_HEAD_ONLY`
- Runtime verified: `false`
- Production: `HOLD`

The workflow now records the pull-request head separately from GitHub's synthetic merge checkout. Feature-branch pushes no longer create a duplicate run; each new Provider head produced one pull-request run.

### Legacy OMCODE Web Guide

- The web v0.1 guide is explicitly development-only.
- Production credentials are forbidden in the legacy web surface.
- Desktop credentials use Keychain.
- A future production web surface must use an `HttpOnly` secure session or a short-lived backend-issued token, never browser `localStorage` for long-lived credentials.
- The AIAGENT-only rule is codified for Desktop, Web, tooling, migration, and every OMCODE AI consumer.

## Phase 1 Closure

| Item | State | Evidence |
| --- | --- | --- |
| 1.1 Commit and verify OMCODE AIAGENT-only patch | `CLOSED_HEAD_CI` | PR #11, run `36292752089` |
| 1.2 Remove Provider duplicate push and PR runs | `CLOSED_HEAD_CI` | PR #6, one run for head `54555ee` |
| 1.3 Add Provider to OMCODE contract job | `CLOSED_HEAD_CI` | `omcode-contract` job, `1/1` |
| 1.4 Remove external-provider import and probe paths | `CLOSED_HEAD_CI` | OMCODE source tests and grep policy |
| 1.5 Correct the production-hold ledger | `CLOSED_BY_THIS_RECEIPT` | this file |
| 1.6 Surface and remove quarantined legacy records | `CLOSED_HEAD_CI` | OMCODE browser and unit coverage |
| 1.7 Preserve truthful MCP policy errors | `CLOSED_HEAD_CI` | OMCODE unit coverage |
| 1.8 Codify AIAGENT-only governance and update guide | `PARTIAL` | PR #11 and PR #12; web runtime still needs its own credential-storage receipt |
| 1.9 Reproduce the historical `29/29` and `18/18` artifact-hash claim | `OPEN` | no exact historical manifest supplied |
| 1.10 Explain browser `34` to `36` provenance | `CLOSED_AUDIT` | derived count introduced by `b687e4d` |
| 1.11 Final independent diff review | `CLOSED_AUDIT` | zero blocker or major findings in the recorded review |
| 1.12 Secret-pattern scan | `CLOSED_AUDIT_SCOPE` | no source hit outside synthetic test fixtures |

## New Artifact Boundary Finding

Local and CI builds have the same source digest and the same `3909` manifest entries, but four machine-dependent files differ: the embedded Node runtime, the launcher, the code-signature resource, and the self-referential bundle manifest. This is expected across different build toolchains and does not indicate source drift.

However, the OMCODE workflow currently uploads receipts and `OMCODE.app.manifest.json`, not the complete tested `.app`. Therefore an operator cannot later download and deploy the exact application bytes tested by CI. Before release, the workflow must package, upload, retain, and verify the complete candidate artifact, then feed that exact artifact into signing, notarization, installation, and rollback checks.

## Remaining Release Blockers

1. Founder designates the canonical Provider integration branch and retargets the PR chain.
2. Infra repairs the malformed workspace-root repository boundary without deleting uncertain work.
3. Founder records the final MCP remote-server policy, independent QA owner, branch protection, and GO-record location.
4. Release owner reviews and merges PR #11, PR #6, and the documentation lane in dependency order.
5. Infra provisions staging DNS, required secret and binding names, and deploys an exact reviewed Provider artifact.
6. OMCODE receives a scoped staging service credential through the application or terminal, never through chat.
7. Independent QA runs real staging chat, embedding, budget, concurrency, expiry, revoke, recovery, and billing-readback flows.
8. Infra completes rollback, backup and restore, and alert drills.
9. Founder approves the paid-test budget and records a final `GO`, `CONDITIONAL_GO`, or `HOLD` decision.

No source-level green result in this receipt is production runtime proof.
