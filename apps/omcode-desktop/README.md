# OMCODE Desktop 0.2.3 candidate

Local macOS workspace, independent of Devin/OpenCode. This release is scoped to `apps/omcode-desktop`, not the historical Next.js applications.

## Run and Verify

Node 24: `npm ci`, `npm run verify:all`. Desktop UI development: `npm run dev`.

Installed app: `~/Applications/OMCODE.app`. State: `~/Library/Application Support/OMCODE`.
Keychain service: `com.omdala.omcode.providers.v1`; account is the provider ID, not an environment variable name. Keys never appear in settings JSON. The stable signed helper is preserved across updates.

## AIAGENT Contract

In Connections, select **Ket noi AIAGENT**, enter a scoped client key in the local password field and run the connection check. Endpoint: `https://api.aiagent.iai.one`, contract `1.0.0`. Tenant/workspace come from the credential unless explicitly configured. Do not import infrastructure/admin secrets as client credentials.

The authenticated catalog controls available chat and embedding models. Catalogs are bound to endpoint, kind, tenant, workspace, credential fingerprint and revision. Model count is not generation proof. Embedding models have a separate text/approval flow rather than appearing as chat models.

Every conversation turn uses a single-use, five-minute approval bound to the exact outbound JSON, destination, model, provider state and session history. The preview includes all history actually sent and all manually attached source. Canceling sends nothing. Changes invalidate the approval. Each approval permits one generation, without automatic retry. No automatic repository reads, MCP calls or follow-up requests with tool results are permitted.

AI can only propose edits/commands. File proposals and terminal commands need separate local execution approval. Up to five manually attached files are checked for sensitive names, ignore policies and secret-like content. Secret detection is defense-in-depth, not a guarantee that every possible secret can be recognized. Review the preview. `.omcodeignore` rules are deny-only; negations cannot override a deny.

Run/receipt read-back must match request, model, tenant, workspace and ledger before displaying reconciled cost. Unknown, mismatched or nonbillable costs remain unverified. No paid model is implied available by the synthetic fixture.

## Local Safety and Data

The backend is loopback-only, capability-token protected, with Host/Origin checks. File APIs reject traversal, symlink escapes and Git metadata; reads are bounded to eight seconds. The UI also bounds every request and response-body read (15–130 seconds by operation), releases busy controls on failure and never retries mutations automatically. A timed-out write or AI call has an unknown outcome: check history/run state before retrying. These recovery controls do not establish the root cause of intermittent Documents/iCloud timeouts. Terminal commands run with your macOS permissions, not in an OS sandbox. Review commands carefully.

File history has pending/committed/failed/interrupted states. Failed writes are not displayed as successful saves. Restarts mark unfinished writes interrupted. Legacy rows remain explicitly unverified; restore still checks current content. Writes are serialized inside one backend and use atomic replacement with optimistic conflict checks. Arbitrary external writers cannot be transactionally locked by this app.

History/drafts/edit backups are plaintext under 0700 directories and 0600 database files. They are retained until explicit local deletion. Settings can export and, after an exact-count confirmation, delete session/edit/draft records without deleting project files or Keychain items. Exported backups are not erased; SSD physical erasure is not guaranteed.

Imported skills are quarantined until whole-tree digest review. Assets are hashed, not executed. A changed asset invalidates approval. Each selected skill is scanned again before inclusion in a prompt. Imported old skills must be resynced and reviewed. Seven roles are available; no claim is made that every skill is behaviorally certified.

MCP annotations are advisory only. Models cannot call MCP. Manual MCP calls require a one-time preview of server URL, tool and exact arguments. OAuth provisioning for authenticated remote MCP servers is not included; those remain `needs_connection`.

## Evidence and Installation

`npm run verify:all` checks dependencies (timestamp and lockfile hash), backend regressions, production build, package, signed bundle manifests, Chromium/WebKit, native WKWebView, and isolated install/update. Invoke the `npm run` commands, which use the evidence runner. The runner invalidates the previous latest receipt before launching, records RUNNING/PASS/FAIL, run ID, source HEAD, exit status and timestamps, and keeps immutable per-run snapshots in `evidence/runs/`.

The release gate requires all eight stages from the same run and matching source/bundle digests. Installation rejects incomplete/failed/older-than-24-hour receipts. The bundle is ad-hoc signed for local use, not notarized for public distribution.

Native QA starts only after the exact authorized app navigation finishes (not a late callback from the loading page). Its asynchronous task is retained in the page and Swift polls bounded synchronous status snapshots; failed, pending, repeated or missing test state cannot create a successful receipt. The driver is injected only in `--native-e2e` mode and provides no new message-handler capability to the normal UI. A later failing browser/native/install E2E invalidates the latest accepted release receipt; its original per-run record remains historical, and a fresh full gate is required before installation.

Updates retain app/shell/source backups and compare complete data manifests before/after. If installed source has changed, it is preserved in place and the new source is copied to a distinct version/digest directory. No reset, source overwrite or user-data deletion is needed. The installer refuses while the installed app or its backend is running.

`npm run test:live` is an explicit separate opt-in that consumes provider quota, uses an isolated synthetic project, manual attachment and consent, and the packaged candidate. It requires `OMCODE_LIVE_PROVIDER_ID`, `OMCODE_LIVE_MODEL`, `OMCODE_LIVE_BASE_URL` and `OMCODE_LIVE_CONSENT=one-synthetic-generation`. These are not secrets. Review `scripts/live-safety.mjs` for the exact prompt/file fixture before opting in. The selected credential must already be saved in Keychain and its catalog checked in Connections. There is no automatic provider/model fallback and no prerequisite paid probe. The release receipt is checked before credential access or network requests. One generation is attempted, with no automatic retry; a provider-side quota is still required for a hard monetary cap.

Before a proposed file is applied or run, its path, entire contents, new-file state and complete tool-call list must exactly match the inert fixture. An AIAGENT run must also have authenticated run/receipt/ledger reconciliation. Chat and embedding both retain read-back evidence; failed read-back never becomes a verified billable cost. Live evidence is saved separately without rewriting deterministic release receipts. This release's deterministic tests do not invoke paid providers. AIAGENT live E2E remains blocked until a legitimate scoped client credential is supplied; existing Cloudflare secrets are not substitutes.

## Provenance

The module is recovered from source commit `cdeda26f7b6cc38ee1df621e7ab8d5a158491619` and integrated on `OMCODE/omcode-release-20260925`, based on canonical `origin/main` (`63433d32c0ad4adfbdd566800c0b11174b75499e`). The separate recovery checkout is not modified. Historical receipts are retained as historical claims, not current acceptance.
