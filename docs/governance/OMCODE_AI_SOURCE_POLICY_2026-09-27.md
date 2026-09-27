# OMCODE AI Source Policy

- **Status:** Mandatory
- **Decision owner:** Founder
- **Recorded:** 2026-09-27
- **Scope:** OMCODE desktop, OMCODE web, release tooling, migration tooling, and every OMCODE consumer that sends AI requests.

## Decision

AIAGENT is the only remote AI source allowed for OMCODE.

Allowed remote origins:

- Production: `https://api.aiagent.iai.one`
- Staging: `https://staging-api.aiagent.iai.one`

A local model may be used only through an exact loopback host (`localhost`, `127.0.0.1`, or `[::1]`). MCP tool servers are not AI providers; they remain subject to URL hygiene, approval, and egress controls.

## Required Controls

1. Validate the endpoint before reading a credential or constructing a request.
2. Revalidate persisted provider records; never trust a stored host, provider kind, tenant, workspace, or environment binding.
3. Bind production and staging Desktop credentials to separate Keychain accounts: `aiagent` and `aiagent-staging`.
4. Never store client keys or long-lived credentials in browser `localStorage`. A production web surface must use an `HttpOnly` secure session or a short-lived backend-issued token.
5. Require the AIAGENT gateway envelope, verified catalog, run and receipt read-back, and authoritative cost reconciliation for remote chat and embedding.
6. Reject direct credentials, imports, probes, or requests for OpenAI, Anthropic, Google, DeepSeek, Cerebras, or any other remote AI provider.
7. Reject redirects and destination changes after user approval.
8. Never place credentials in chat, source, logs, reports, or committed evidence.

## Release Gate

An OMCODE candidate is not release-ready unless all of the following are true:

- source tests prove that disallowed hosts and host-lookalike bypasses fail before credential access and before network egress;
- persisted records with an invalid host, provider kind, environment account, tenant, or workspace are quarantined;
- browser, native, installer, dependency, bundle, and cross-repository contract checks pass for the exact candidate SHA;
- the web surface proves that no long-lived credential is stored in browser storage;
- the deployed AIAGENT staging artifact, live-provider test, independent QA, and Founder release decision are separately evidenced.

This policy does not authorize a merge, deployment, credential issuance, paid AI call, or production release.
