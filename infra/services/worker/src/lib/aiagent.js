import { createHash, webcrypto } from 'node:crypto';

export const AIAGENT_CONTRACT_VERSION = '1.0.0';
export const AIAGENT_TENANT_ID = 'omdala-com';
export const AIAGENT_DEFAULT_MODEL = 'iai-one/iris-3';

const MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_MESSAGES_BYTES = 128 * 1024;
const OMDALA_COST_CEILING_USD = 0.25;
const API_KEY_PATTERN = /^sk-aiagent-[a-f0-9]{48}$/;
const MODEL_PATTERN = /^iai-one\/[a-z0-9][a-z0-9._-]{0,63}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{5,255}$/;
const SHA40_PATTERN = /^[a-f0-9]{40}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const DEPLOYMENTS = Object.freeze({
  staging: Object.freeze({
    origin: 'https://staging-api.aiagent.iai.one',
    workspaceId: 'omdala-com-staging',
  }),
  production: Object.freeze({
    origin: 'https://api.aiagent.iai.one',
    workspaceId: 'omdala-com-production',
  }),
});

export class AiagentContractError extends Error {
  constructor(code, message, options = {}) {
    super(`${code}: ${message}`, options);
    this.name = 'AiagentContractError';
    this.code = code;
  }
}

export function resolveAiagentConfiguration(env = process.env) {
  const environment = String(env.AIAGENT_ENVIRONMENT || '').trim();
  const deployment = DEPLOYMENTS[environment];
  if (!deployment) {
    throw new AiagentContractError(
      'AIAGENT_ENVIRONMENT_INVALID',
      'AIAGENT_ENVIRONMENT must be exactly staging or production',
    );
  }

  const apiKey = String(env.AIAGENT_API_KEY || '').trim();
  if (!API_KEY_PATTERN.test(apiKey)) {
    throw new AiagentContractError(
      'AIAGENT_CREDENTIAL_INVALID',
      'AIAGENT_API_KEY must use the scoped sk-aiagent credential format',
    );
  }

  const expectedProvider = Object.freeze({
    sourceSha: requiredPattern(env.AIAGENT_EXPECTED_PROVIDER_SHA, SHA40_PATTERN, 'AIAGENT_EXPECTED_PROVIDER_SHA'),
    versionId: requiredPattern(env.AIAGENT_EXPECTED_PROVIDER_VERSION_ID, SAFE_ID_PATTERN, 'AIAGENT_EXPECTED_PROVIDER_VERSION_ID'),
    bundleSha256: requiredPattern(env.AIAGENT_EXPECTED_PROVIDER_BUNDLE_SHA256, SHA256_PATTERN, 'AIAGENT_EXPECTED_PROVIDER_BUNDLE_SHA256'),
  });
  const expectedLedger = Object.freeze({
    sourceSha: requiredPattern(env.AIAGENT_EXPECTED_LEDGER_SHA, SHA40_PATTERN, 'AIAGENT_EXPECTED_LEDGER_SHA'),
    versionId: requiredPattern(env.AIAGENT_EXPECTED_LEDGER_VERSION_ID, SAFE_ID_PATTERN, 'AIAGENT_EXPECTED_LEDGER_VERSION_ID'),
    bundleSha256: requiredPattern(env.AIAGENT_EXPECTED_LEDGER_BUNDLE_SHA256, SHA256_PATTERN, 'AIAGENT_EXPECTED_LEDGER_BUNDLE_SHA256'),
    migrationSha256: requiredPattern(env.AIAGENT_EXPECTED_LEDGER_MIGRATION_SHA256, SHA256_PATTERN, 'AIAGENT_EXPECTED_LEDGER_MIGRATION_SHA256'),
  });
  const receiptPublicKeys = parseReceiptPublicKeys(env.AIAGENT_RECEIPT_PUBLIC_KEYS);

  return Object.freeze({
    environment,
    origin: deployment.origin,
    workspaceId: deployment.workspaceId,
    tenantId: AIAGENT_TENANT_ID,
    apiKey,
    expectedProvider,
    expectedLedger,
    receiptPublicKeys,
  });
}

export function buildAiagentRequestId(seed) {
  if (typeof seed !== 'string' || seed.length === 0) {
    throw new AiagentContractError('AIAGENT_IDEMPOTENCY_SEED_REQUIRED', 'An idempotency seed is required');
  }
  const digest = createHash('sha256').update(seed, 'utf8').digest('hex');
  return `omdala-worker-${digest.slice(0, 40)}`;
}

export async function callAiagentChat({
  messages,
  model = AIAGENT_DEFAULT_MODEL,
  maxTokens = 2000,
  requestId,
  taskType = 'chat',
  env = process.env,
  fetchImpl = globalThis.fetch,
}) {
  const configuration = resolveAiagentConfiguration(env);
  validateInvocation({ messages, model, maxTokens, requestId, taskType });
  if (typeof fetchImpl !== 'function') {
    throw new AiagentContractError('AIAGENT_FETCH_UNAVAILABLE', 'fetch is not available');
  }

  let response;
  try {
    response = await fetchImpl(`${configuration.origin}/v1/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configuration.apiKey}`,
        'Idempotency-Key': requestId,
        'X-Request-ID': requestId,
        'X-Trace-ID': requestId,
        'X-Tenant-ID': configuration.tenantId,
        'X-Actor-Role': 'agent',
        'X-Surface': 'agent',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        request_id: requestId,
        task_type: taskType,
        tenant_id: configuration.tenantId,
        risk_level: 'low',
        data_sensitivity: 'internal',
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    throw new AiagentContractError(
      'AIAGENT_TRANSPORT_UNVERIFIED',
      `No verified contract response was received for request ${requestId}; retry only with the same idempotency key`,
      { cause: error },
    );
  }

  let payload;
  try {
    payload = await readJsonBounded(response);
  } catch (error) {
    if (error instanceof AiagentContractError) throw error;
    throw new AiagentContractError(
      'AIAGENT_RESPONSE_UNVERIFIED',
      `The response body was interrupted for request ${requestId}; retry only with the same idempotency key`,
      { cause: error },
    );
  }
  if (!response.ok) {
    const remoteCode = safeString(payload?.error?.code) || `HTTP_${response.status}`;
    const remoteMessage = safeString(payload?.error?.message) || 'AIAGENT rejected the request';
    throw new AiagentContractError(`AIAGENT_${remoteCode}`, remoteMessage);
  }

  const traceId = response.headers?.get?.('x-trace-id') || '';
  const echoedRequestId = response.headers?.get?.('x-request-id') || '';
  const data = validateContractResponse(payload, {
    configuration,
    model,
    requestId,
    traceId,
    echoedRequestId,
  });
  const reconciliation = await reconcileInvocation({
    configuration,
    data,
    requestId,
    fetchImpl,
  });

  return Object.freeze({
    contractVersion: AIAGENT_CONTRACT_VERSION,
    traceId,
    data,
    run: reconciliation.run,
    receipt: reconciliation.receipt,
  });
}

function validateInvocation({ messages, model, maxTokens, requestId, taskType }) {
  if (!MODEL_PATTERN.test(String(model || ''))) {
    throw new AiagentContractError('AIAGENT_MODEL_INVALID', 'Model must use the iai-one/* namespace');
  }
  if (!Number.isSafeInteger(maxTokens) || maxTokens < 1 || maxTokens > 32_768) {
    throw new AiagentContractError('AIAGENT_MAX_TOKENS_INVALID', 'maxTokens must be an integer from 1 to 32768');
  }
  if (!SAFE_ID_PATTERN.test(String(requestId || ''))) {
    throw new AiagentContractError('AIAGENT_REQUEST_ID_INVALID', 'requestId is required and must be a safe identifier');
  }
  if (!['chat', 'code-review'].includes(taskType)) {
    throw new AiagentContractError('AIAGENT_TASK_TYPE_INVALID', 'Unsupported AIAGENT task type');
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 128) {
    throw new AiagentContractError('AIAGENT_MESSAGES_INVALID', 'messages must contain between 1 and 128 entries');
  }
  for (const message of messages) {
    if (!isObject(message)
      || !['system', 'user', 'assistant'].includes(message.role)
      || typeof message.content !== 'string'
      || message.content.trim().length === 0) {
      throw new AiagentContractError('AIAGENT_MESSAGES_INVALID', 'Every message needs a supported role and non-empty content');
    }
  }
  if (Buffer.byteLength(JSON.stringify(messages), 'utf8') > MAX_MESSAGES_BYTES) {
    throw new AiagentContractError('AIAGENT_MESSAGES_TOO_LARGE', 'messages exceed 128 KiB');
  }
}

async function readJsonBounded(response) {
  if (!response || typeof response.ok !== 'boolean' || !Number.isInteger(response.status)) {
    throw new AiagentContractError('AIAGENT_RESPONSE_INVALID', 'fetch returned an invalid Response object');
  }

  const declaredLength = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    await response.body?.cancel?.().catch(() => undefined);
    throw new AiagentContractError('AIAGENT_RESPONSE_TOO_LARGE', 'AIAGENT response exceeds 1 MiB');
  }
  if (!response.body?.getReader) {
    throw new AiagentContractError('AIAGENT_RESPONSE_INVALID', 'AIAGENT response body is not readable');
  }

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > MAX_RESPONSE_BYTES) {
      await reader.cancel('AIAGENT response too large').catch(() => undefined);
      throw new AiagentContractError('AIAGENT_RESPONSE_TOO_LARGE', 'AIAGENT response exceeds 1 MiB');
    }
    chunks.push(next.value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    throw new AiagentContractError('AIAGENT_RESPONSE_JSON_INVALID', 'AIAGENT returned invalid JSON', { cause: error });
  }
}

function validateContractResponse(payload, expected) {
  if (!isObject(payload)
    || payload.ok !== true
    || payload.contract_version !== AIAGENT_CONTRACT_VERSION
    || !isObject(payload.data)) {
    throw contractMismatch('Envelope or contract version is invalid');
  }

  const data = payload.data;
  if (expected.echoedRequestId !== expected.requestId || expected.traceId !== expected.requestId) {
    throw contractMismatch('Trace or request correlation headers are missing or mismatched');
  }
  if (data.provider !== 'iai-one'
    || data.model !== expected.model
    || data.request_id !== expected.requestId
    || data.tenant_id !== expected.configuration.tenantId
    || data.workspace_id !== expected.configuration.workspaceId
    || data.policy_decision !== 'allow') {
    throw contractMismatch('Provider, model, tenant, workspace, request, or policy identity mismatched');
  }
  if (typeof data.response !== 'string' || data.response.trim().length === 0) {
    throw contractMismatch('Response content is missing');
  }
  if (!SAFE_ID_PATTERN.test(String(data.receipt_id || ''))
    || !SAFE_ID_PATTERN.test(String(data.run_id || ''))
    || !SAFE_ID_PATTERN.test(String(data.ledger_entry_id || ''))) {
    throw contractMismatch('Receipt, run, or ledger identity is missing');
  }
  if (!['stop', 'length', 'tool_call'].includes(data.finish_reason)) {
    throw contractMismatch('Finish reason is invalid');
  }

  const usage = data.usage;
  if (!isObject(usage)
    || !isSafeNonNegativeInteger(usage.input_tokens)
    || !isSafeNonNegativeInteger(usage.output_tokens)
    || !isSafeNonNegativeInteger(usage.total_tokens)
    || usage.total_tokens !== usage.input_tokens + usage.output_tokens
    || usage.token_usage_status !== 'provider_reported') {
    throw contractMismatch('Token usage is not authoritative');
  }
  if (!isFiniteNonNegative(data.cost_usd)
    || data.cost_usd > OMDALA_COST_CEILING_USD
    || data.cost_status !== 'authoritative_reconciled'
    || data.cost_ledger_status !== 'reconciled'
    || data.billing_eligible !== true) {
    throw contractMismatch('Authoritative cost reconciliation is missing or exceeds the OMDALA ceiling');
  }

  const quota = data.request_quota;
  const budget = data.budget;
  if (!isObject(quota)
    || !isSafePositiveInteger(quota.limit)
    || !isSafeNonNegativeInteger(quota.used)
    || !isSafeNonNegativeInteger(quota.remaining)
    || quota.used + quota.remaining !== quota.limit
    || quota.scope !== 'api-key-lifetime') {
    throw contractMismatch('Credential request quota is invalid');
  }
  if (!isObject(budget)
    || !isFiniteNonNegative(budget.limit_usd)
    || budget.limit_usd <= 0
    || budget.limit_usd > OMDALA_COST_CEILING_USD
    || !isFiniteNonNegative(budget.reserved_usd)
    || !isFiniteNonNegative(budget.used_usd)
    || !isFiniteNonNegative(budget.remaining_usd)
    || budget.reserved_usd > budget.limit_usd
    || budget.used_usd > budget.limit_usd
    || budget.used_usd < budget.reserved_usd
    || budget.remaining_usd > budget.limit_usd
    || Math.abs((budget.used_usd + budget.remaining_usd) - budget.limit_usd) > 1e-9
    || budget.reservation_basis !== 'configured_rate_conservative_ceiling') {
    throw contractMismatch('Credential cost ceiling is invalid');
  }
  if (data.ledger_release_sha !== expected.configuration.expectedLedger.sourceSha
    || data.ledger_deployment_id !== expected.configuration.expectedLedger.versionId
    || data.ledger_version_id !== expected.configuration.expectedLedger.versionId
    || data.ledger_bundle_sha256 !== expected.configuration.expectedLedger.bundleSha256
    || data.ledger_contract_version !== AIAGENT_CONTRACT_VERSION
    || String(data.ledger_schema_version || '') !== '1'
    || data.ledger_migration_sha256 !== expected.configuration.expectedLedger.migrationSha256) {
    throw contractMismatch('Authoritative ledger provenance is incomplete');
  }

  return Object.freeze({ ...data });
}

async function reconcileInvocation({ configuration, data, requestId, fetchImpl }) {
  const runResponse = await fetchJson({
    url: `${configuration.origin}/v1/runs/${encodeURIComponent(data.run_id)}`,
    options: {
      method: 'GET',
      headers: authenticatedHeaders(configuration),
      signal: AbortSignal.timeout(30_000),
    },
    fetchImpl,
    operation: 'run lookup',
    requestId,
  });
  const run = runResponse.payload?.run;
  if (runResponse.payload?.ok !== true || !isObject(run)
    || run.run_id !== data.run_id
    || run.receipt_id !== data.receipt_id
    || run.request_id !== data.request_id
    || run.status !== 'success'
    || run.model !== data.model
    || run.tenant_id !== configuration.tenantId
    || run.workspace_id !== configuration.workspaceId
    || run.input_tokens !== data.usage.input_tokens
    || run.output_tokens !== data.usage.output_tokens
    || run.cost_usd !== data.cost_usd
    || run.billing_eligible !== true
    || run.cost_ledger_status !== 'reconciled'
    || run.ledger_entry_id !== data.ledger_entry_id) {
    throw contractMismatch('Persisted run does not reconcile with the invocation');
  }

  const verifyRequestId = `${requestId}-verify`;
  const verification = await fetchJson({
    url: `${configuration.origin}/v1/ai/verify`,
    options: {
      method: 'POST',
      headers: authenticatedHeaders(configuration, verifyRequestId, true),
      body: JSON.stringify({
        receipt_id: data.receipt_id,
        task_type: 'verify',
        risk_level: 'low',
        data_sensitivity: 'internal',
        tenant_id: configuration.tenantId,
      }),
      signal: AbortSignal.timeout(30_000),
    },
    fetchImpl,
    operation: 'receipt verification',
    requestId: verifyRequestId,
  });
  if (verification.response.headers.get('x-request-id') !== verifyRequestId
    || verification.response.headers.get('x-trace-id') !== verifyRequestId
    || verification.payload?.ok !== true
    || verification.payload.contract_version !== AIAGENT_CONTRACT_VERSION
    || verification.payload.data?.verified !== true
    || verification.payload.data?.verification_method !== 'ed25519-canonical-payload-sha256'
    || verification.payload.data?.execution_status !== 'success') {
    throw contractMismatch('Receipt verification response is invalid');
  }

  const receipt = verification.payload.data.receipt;
  await validateSignedReceipt(receipt, configuration, data);
  return Object.freeze({ run: Object.freeze({ ...run }), receipt: Object.freeze({ ...receipt }) });
}

function authenticatedHeaders(configuration, requestId, idempotent = false) {
  return {
    'Authorization': `Bearer ${configuration.apiKey}`,
    'Content-Type': 'application/json',
    // These are requested policy context only. AIAGENT removes them at ingress
    // and rebuilds authority from the authenticated credential.
    'X-Tenant-ID': configuration.tenantId,
    'X-Actor-Role': 'agent',
    'X-Surface': 'agent',
    ...(requestId ? { 'X-Request-ID': requestId, 'X-Trace-ID': requestId } : {}),
    ...(idempotent && requestId ? { 'Idempotency-Key': requestId } : {}),
  };
}

async function fetchJson({ url, options, fetchImpl, operation, requestId }) {
  let response;
  try {
    response = await fetchImpl(url, options);
  } catch (error) {
    throw new AiagentContractError(
      'AIAGENT_RECONCILIATION_UNVERIFIED',
      `${operation} did not return a verified response for ${requestId}`,
      { cause: error },
    );
  }
  let payload;
  try {
    payload = await readJsonBounded(response);
  } catch (error) {
    if (error instanceof AiagentContractError) throw error;
    throw new AiagentContractError('AIAGENT_RECONCILIATION_UNVERIFIED', `${operation} response was interrupted`, { cause: error });
  }
  if (!response.ok) {
    const code = safeString(payload?.error?.code) || `HTTP_${response.status}`;
    throw new AiagentContractError(`AIAGENT_${code}`, `${operation} was rejected`);
  }
  return { response, payload };
}

async function validateSignedReceipt(receipt, configuration, data) {
  if (!isObject(receipt)
    || receipt.authority !== 'aiagent.iai.one'
    || receipt.receipt_schema !== 'aiagent.provider-receipt.v1'
    || receipt.contract_version !== AIAGENT_CONTRACT_VERSION
    || receipt.signature_algorithm !== 'Ed25519'
    || receipt.environment !== configuration.environment
    || receipt.source_sha !== configuration.expectedProvider.sourceSha
    || receipt.bundle_sha256 !== configuration.expectedProvider.bundleSha256
    || receipt.version_id !== configuration.expectedProvider.versionId
    || receipt.deployment_id !== configuration.expectedProvider.versionId
    || receipt.receipt_id !== data.receipt_id
    || receipt.run_id !== data.run_id
    || receipt.request_id !== data.request_id
    || receipt.tenant_id !== configuration.tenantId
    || receipt.workspace_id !== configuration.workspaceId
    || receipt.model !== data.model
    || typeof receipt.provider !== 'string' || !receipt.provider || receipt.provider === 'iai-one'
    || receipt.input_tokens !== data.usage.input_tokens
    || receipt.output_tokens !== data.usage.output_tokens
    || receipt.cost_usd !== data.cost_usd
    || receipt.billing_eligible !== true
    || receipt.cost_ledger_status !== 'reconciled'
    || receipt.ledger_entry_id !== data.ledger_entry_id
    || receipt.ledger_release_sha !== configuration.expectedLedger.sourceSha
    || receipt.ledger_deployment_id !== configuration.expectedLedger.versionId
    || receipt.ledger_version_id !== configuration.expectedLedger.versionId
    || receipt.ledger_bundle_sha256 !== configuration.expectedLedger.bundleSha256
    || receipt.ledger_contract_version !== AIAGENT_CONTRACT_VERSION
    || String(receipt.ledger_schema_version || '') !== '1'
    || receipt.ledger_migration_sha256 !== configuration.expectedLedger.migrationSha256
    || !SHA256_PATTERN.test(String(receipt.receipt_hash || ''))
    || !SAFE_ID_PATTERN.test(String(receipt.signing_key_id || ''))
    || typeof receipt.signature !== 'string') {
    throw contractMismatch('Signed receipt identity or reconciliation fields are invalid');
  }
  const publicKey = configuration.receiptPublicKeys[receipt.signing_key_id];
  if (!publicKey) throw contractMismatch('Receipt signing key is not pinned');

  const { signature, receipt_hash: receiptHash, ...payload } = receipt;
  let bytes;
  try {
    bytes = Buffer.from(canonicalReceipt(payload), 'utf8');
  } catch {
    throw contractMismatch('Receipt canonical payload is invalid');
  }
  if (bytes.byteLength > MAX_RESPONSE_BYTES
    || createHash('sha256').update(bytes).digest('hex') !== receiptHash) {
    throw contractMismatch('Receipt digest is invalid');
  }
  try {
    const key = await webcrypto.subtle.importKey(
      'spki',
      decodeBase64Url(publicKey),
      'Ed25519',
      false,
      ['verify'],
    );
    const valid = await webcrypto.subtle.verify(
      'Ed25519',
      key,
      decodeBase64Url(signature),
      bytes,
    );
    if (!valid) throw contractMismatch('Receipt signature is invalid');
  } catch (error) {
    if (error instanceof AiagentContractError) throw error;
    throw contractMismatch('Receipt public key or signature is invalid');
  }
}

function canonicalReceipt(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalReceipt).join(',')}]`;
  if (isObject(value) && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalReceipt(value[key])}`).join(',')}}`;
  }
  throw new Error('RECEIPT_PAYLOAD_INVALID');
}

function decodeBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('RECEIPT_BASE64URL_INVALID');
  }
  return Buffer.from(value, 'base64url');
}

function requiredPattern(value, pattern, name) {
  const normalized = String(value || '').trim();
  if (!pattern.test(normalized)) {
    throw new AiagentContractError('AIAGENT_RELEASE_PIN_INVALID', `${name} is required and malformed`);
  }
  return normalized;
}

function parseReceiptPublicKeys(value) {
  let keys;
  try {
    keys = JSON.parse(String(value || ''));
  } catch {
    throw new AiagentContractError('AIAGENT_RECEIPT_KEYS_INVALID', 'AIAGENT_RECEIPT_PUBLIC_KEYS must be valid JSON');
  }
  if (!isObject(keys) || Object.keys(keys).length === 0) {
    throw new AiagentContractError('AIAGENT_RECEIPT_KEYS_INVALID', 'At least one pinned receipt key is required');
  }
  for (const [keyId, encoded] of Object.entries(keys)) {
    if (!SAFE_ID_PATTERN.test(keyId) || typeof encoded !== 'string' || !/^[A-Za-z0-9_-]+$/.test(encoded)) {
      throw new AiagentContractError('AIAGENT_RECEIPT_KEYS_INVALID', 'Receipt key ring contains a malformed key');
    }
  }
  return Object.freeze({ ...keys });
}

function contractMismatch(message) {
  return new AiagentContractError('AIAGENT_CONTRACT_MISMATCH', message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSafeNonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function isSafePositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isFiniteNonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function safeString(value) {
  return typeof value === 'string' ? value.slice(0, 500) : '';
}
