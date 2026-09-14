# OMCODE Desktop 0.2.1

Local macOS coding workspace for Omdala. This module is independent of the older Next.js workspace and does not invoke Devin, OpenCode, Codex, Claude, or OpenClaw at runtime.

## Run and Build

- Installed app: `~/Applications/OMCODE.app`.
- Installed source: `~/Developer/OMCODE/source/apps/omcode-desktop`.
- Persistent data: `~/Library/Application Support/OMCODE`.
- API credentials: macOS Keychain service `com.omdala.omcode.providers.v1`, accessed by the stable signed OMCODEKeychain helper. The prior OMCODE service is retained.
- Rebuild and deterministic release verification with Node 24: `npm ci`, then `npm run verify:all`.
- Local web development: `npm run dev`. The backend prints a local capability URL; do not publish or share its token.

The desktop bundle includes Node, the static frontend, and backend dependencies. It does not require another AI desktop application to be running. Internet and valid provider access are still required for remote models.

The locally signed `native/keychain-helper/OMCODEKeychain` and its `source-sha256` stamp are versioned together. Packaging refuses a helper source change instead of silently rebuilding a different credential accessor; such a change requires an explicit Keychain reauthorization/migration step.

## Included

- Native macOS window and folder picker; light/dark responsive workspace.
- Scoped file explorer, lazy CodeMirror editor, read-only Git status and diff.
- Real command runner with explicit user execution, a 60-second limit, and bounded output. It is not a persistent interactive PTY or a detached dev-server manager.
- Direct OpenAI-compatible provider API connections stored in Keychain.
- Seven agent roles, selected skill context, read tools, proposed edits, proposed commands, cancellation, and persisted conversations.
- Explicit approval before AI changes project files; optimistic concurrency checks and retained before/after backups.
- Debounced draft persistence, draft recovery from the history view, and a native quit-time draft flush. A sudden system failure before a draft reaches storage is not guaranteed recoverable.
- Copied skill catalog with provenance and content deduplication. Scripts are not automatically executed or individually certified.
- Streamable HTTP MCP catalog, connection checks, manual tool calls, and read-only-annotated tools exposed to agents. Authenticated MCP OAuth setup is not implemented in this build.

## Safety Boundaries

The API listens only on loopback, uses a per-launch capability token, and checks Host and Origin. File APIs reject symlink escapes, Git metadata, and paths outside explicitly opened project roots. The file worker has an 8-second bound to prevent a stalled Documents/FileProvider read from blocking the UI.

This is not an OS-level sandbox: terminal commands entered or approved by the user execute with the user's permissions and can change files outside the project. Review commands before running them. Provider context can contain selected project source. OAuth sessions from other AI apps are not transferred.

No file deletion API is included. Existing source, sessions, application state, caches, and historical cleanup backups are not removed by this recovery.

## Release Verification

`npm run verify:all` rebuilds one candidate and runs these gates in order:

- Backend and release tests, including local auth, bounded files, drafts, terminal, approved AI edits, provider fail-closed behavior, skill deduplication, seven roles, and MCP `tools/list` plus `tools/call` over a loopback Streamable HTTP fixture.
- Production Vite build and macOS package from a clean staging directory.
- Embedded resource manifest, external full-app manifest, exact source digest, ad-hoc codesign verification, bundled arm64 Node execution, native executable, and Keychain helper checks.
- Twenty Chromium/WebKit desktop and mobile workflow checks.
- Native WKWebView E2E using the packaged binary and bundled backend: read file, propose edit, user approval, disk write, and terminal execution.
- Fresh install and update inside an isolated temporary home, including byte-identical SQLite verification, retained user-data sentinel, idempotent shell setup, sidecar validation, and dated rollback backups.

The passing candidate receipt is `evidence/release-verification.json`. The sidecar `release/OMCODE.app.manifest.json` hashes the complete signed app, including the native executable and `_CodeSignature`. `scripts/update-local.mjs` refuses installation unless the receipt, source digest, sidecar digest, app version, and all deterministic stages match exactly. It stages replacements, retains dated source/app/shell backups, and does not modify the user database.

`npm run test:live` is deliberately separate because it consumes provider quota. It loads the frontend, backend, Node runtime, and Keychain helper from the packaged candidate, reads provider configuration through read-only SQLite, uses an isolated project/state directory, and binds its receipt to the same source and sidecar digests.

## Limits

Fixture E2E and real-provider E2E are distinct evidence layers. Provider `402`/`429`, network availability, and OAuth remain external gates rather than failures that local code can bypass. Authenticated MCP OAuth setup is not implemented; a server that requires authorization remains `needs_connection`. The catalog importer is tested for safe copy and deduplication, but that does not certify every imported skill's behavior.

The upstream recovery base is `415927e5f1580d539013b55765dfba834de655e7`. This module was recovered and hardened on branch `OMCODE/omcode-desktop-e2e-hardening-20260914`; the branch and manifests establish the new candidate, not the provenance of inaccessible historical local changes.

This is a locally ad-hoc-signed macOS build, not a notarized public release. It is not a claim that every installed vendor IDE, every skill, every provider, and every project workflow is error-free.
