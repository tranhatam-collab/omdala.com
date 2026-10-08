# Worker AIAGENT boundary

The background worker uses OMDALA's finalized AI provider contract:

- contract version: `1.0.0`
- tenant: `omdala-com`
- staging authority: `https://staging-api.aiagent.iai.one`
- production authority: `https://api.aiagent.iai.one`
- execution endpoint: `POST /v1/ai/chat`
- model namespace: `iai-one/*`

The authority URL is selected from the exact `AIAGENT_ENVIRONMENT` value
(`staging` or `production`). The worker does not accept a URL from its runtime
environment. `AIAGENT_API_KEY` is required and must be a scoped credential in
the `sk-aiagent-` plus 48 lowercase hexadecimal character format. Runtime also
requires exact provider and ledger SHA/version/bundle pins plus the receipt
public-key ring; none of these identities are accepted from a response alone.

Required runtime values:

- `AIAGENT_ENVIRONMENT`
- `AIAGENT_API_KEY` (secret)
- `AIAGENT_EXPECTED_PROVIDER_SHA`
- `AIAGENT_EXPECTED_PROVIDER_VERSION_ID`
- `AIAGENT_EXPECTED_PROVIDER_BUNDLE_SHA256`
- `AIAGENT_EXPECTED_LEDGER_SHA`
- `AIAGENT_EXPECTED_LEDGER_VERSION_ID`
- `AIAGENT_EXPECTED_LEDGER_BUNDLE_SHA256`
- `AIAGENT_EXPECTED_LEDGER_MIGRATION_SHA256`
- `AIAGENT_RECEIPT_PUBLIC_KEYS`

The request includes tenant, actor-role, and surface as policy selections. The
provider strips these inbound headers, checks the selections against the
credential, and rebuilds downstream authority from that credential. The worker
never sends actor ID, workspace ID, tier, quota, budget, or key-ID authority.

Every accepted response must match the contract version, tenant, workspace,
request ID, model, trace header, usage, request quota, and the authoritative
cost ledger. The worker then reads the persisted run, calls `/v1/ai/verify`,
and independently verifies the Ed25519 receipt against its pinned key ring.
Unreconciled, malformed, oversized, or ambiguous responses fail closed.
Retries preserve a deterministic idempotency key, and task/usage/evidence are
written in one guarded PostgreSQL statement so a replay cannot add cost twice.

`GET /health` only validates local configuration and process liveness. It does
not call AIAGENT and cannot spend model budget. It returns HTTP 503 and reports
`degraded` until the environment, credential, exact release pins, and receipt
trust keys are configured.
