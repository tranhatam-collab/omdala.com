// Egress policy: scans every outbound AI payload for credential material
// before it leaves the process. Fail-closed by contract — a single finding
// aborts the request and no bytes are sent to the provider.
//
// Findings are reported with redacted previews only; secret values must never
// appear in errors, logs, run history or receipts.

// Zero-width chars, bidi overrides (Trojan Source), word joiner, BOM,
// Hangul fillers, tag chars and variation-selector supplement.
const HIDDEN_UNICODE =
  /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u115F\u1160\u3164\uFFA0\u{E0000}-\u{E007F}\u{E0100}-\u{E01EF}]/u;
const PLACEHOLDER =
  /^(your[-_ ]|yourexample|example[-_ ]|sample[-_ ]|test[-_ ]|dummy[-_ ]|placeholder[-_ ]|fake[-_ ]|changeme|change[-_ ]?me|xxx|<|\*+|redacted|none|null|todo|insert[-_ ]|paste[-_ ]|abcd|123456)/i;

const RULES = [
  {
    id: "pem-private-key",
    test: (text) => /-----BEGIN [A-Z0-9 ]*PRIVATE KEY( BLOCK)?-----/.test(text),
  },
  {
    id: "authorization-header",
    test: (text) =>
      /authorization["']?\s*[:=]\s*["']?\s*(bearer|basic|token|digest|aws4-hmac-sha256)\s+[A-Za-z0-9._~+/:=-]{8,}/i.test(
        text,
      ),
  },
  {
    id: "bearer-token",
    test: (text) => /bearer\s+[A-Za-z0-9._~+/=-]{20,}/i.test(text),
  },
  {
    id: "api-token-prefix",
    test: (text) =>
      /\b(iai-svc-[A-Za-z0-9_-]{8,}|sk-aiagent-[A-Za-z0-9_-]{8,}|sk-ant-[A-Za-z0-9_-]{8,}|sk-proj-[A-Za-z0-9_-]{8,}|sk-(?:live|test)[_-][A-Za-z0-9_-]{8,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|ghu_[A-Za-z0-9]{20,}|ghs_[A-Za-z0-9]{20,}|ghr_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|glpat-[A-Za-z0-9_-]{15,}|gltat-[A-Za-z0-9_-]{15,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|dop_v1_[0-9a-f]{40,}|hf_[A-Za-z0-9]{30,}|npm_[A-Za-z0-9]{30,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,})\b/.test(
        text,
      ),
  },
  {
    id: "json-secret",
    test: (text) =>
      [...text.matchAll(new RegExp(JSON_SECRET_RE.source, "gi"))].some((m) =>
        hasRealSecretValue(m[2]),
      ),
  },
  {
    id: "yaml-secret",
    test: (text) =>
      [...text.matchAll(new RegExp(YAML_SECRET_RE.source, "gim"))].some((m) =>
        hasRealSecretValue(m[2]),
      ),
  },
  {
    id: "hidden-unicode",
    test: (text) => HIDDEN_UNICODE.test(text),
  },
  {
    id: "high-entropy-token",
    test: (text) => entropyFindings(text).length > 0,
  },
];

const JSON_SECRET_RE =
  /"(api[_-]?key|api[_-]?secret|secret[_-]?key|access[_-]?key|secret|token|auth[_-]?token|refresh[_-]?token|access[_-]?token|id[_-]?token|password|passwd|private[_-]?key|client[_-]?secret|session[_-]?key|signing[_-]?key)"\s*:\s*"([^"]{12,})"/i;
const YAML_SECRET_RE =
  /(?:^|[\n\r,{[]\s*)(api[_-]?key|api[_-]?secret|secret[_-]?key|access[_-]?key|secret|token|auth[_-]?token|refresh[_-]?token|access[_-]?token|password|passwd|private[_-]?key|client[_-]?secret|session[_-]?key|signing[_-]?key)\s*[:=]\s*["']?([A-Za-z0-9._~+/=-]{16,})["']?/im;

function jsonSecretValue(text) {
  return text.match(JSON_SECRET_RE)?.[2] || "";
}
function yamlSecretValue(text) {
  return text.match(YAML_SECRET_RE)?.[2] || "";
}

function hasRealSecretValue(value) {
  return Boolean(value) && !PLACEHOLDER.test(value) && shannon(value) >= 3.0;
}

function shannon(value) {
  if (!value.length) return 0;
  const counts = new Map();
  for (const ch of value) counts.set(ch, (counts.get(ch) || 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / value.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// "/" and "." are excluded so filesystem paths, URLs and dotted identifiers
// split into short segments instead of matching as single tokens; prefixed
// and structural secret forms (JWT, PEM, AWS) are covered by dedicated rules.
const TOKEN_CANDIDATE = /[A-Za-z0-9_\-+=]{36,}/g;

function entropyFindings(text) {
  const findings = [];
  for (const match of text.matchAll(TOKEN_CANDIDATE)) {
    const token = match[0];
    // Hex digests (sha256, git SHAs) and UUIDs are data, not credentials.
    if (/^[0-9a-fA-F]+$/.test(token)) continue;
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        token,
      )
    )
      continue;
    if (PLACEHOLDER.test(token)) continue;
    const classes =
      Number(/[a-z]/.test(token)) +
      Number(/[A-Z]/.test(token)) +
      Number(/[0-9]/.test(token)) +
      Number(/[_\-+/=.]/.test(token));
    if (classes >= 3 && shannon(token) >= 4.7) findings.push(token.length);
    if (findings.length >= 3) break;
  }
  return findings;
}

function redact(value) {
  return `[redacted] (${String(value).length} chars)`;
}

export function scanEgressText(text, path = "payload") {
  if (typeof text !== "string" || !text) return [];
  const findings = [];
  for (const rule of RULES) {
    if (rule.test(text))
      findings.push({ rule: rule.id, path, preview: redact(text) });
  }
  return findings;
}

export function scanEgressPayload(value, path = "payload", findings = []) {
  if (typeof value === "string") {
    findings.push(...scanEgressText(value, path));
  } else if (Array.isArray(value)) {
    value.forEach((item, index) =>
      scanEgressPayload(item, `${path}[${index}]`, findings),
    );
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value))
      scanEgressPayload(item, `${path}.${key}`, findings);
  }
  return findings;
}

export class EgressPolicyError extends Error {
  constructor(findings) {
    const rules = [...new Set(findings.map((f) => f.rule))].join(", ");
    super(
      `EGRESS_BLOCKED: yêu cầu chứa ${findings.length} dấu hiệu bí mật (${rules}). Không gửi dữ liệu tới provider. Gỡ secret khỏi prompt/ngữ cảnh rồi thử lại.`,
    );
    this.name = "EgressPolicyError";
    this.code = "EGRESS_BLOCKED";
    this.findings = findings;
  }
}

export function assertEgressAllowed(payload) {
  const findings = scanEgressPayload(payload);
  if (payload && typeof payload === "object")
    findings.push(...scanEgressText(JSON.stringify(payload)));
  if (findings.length) throw new EgressPolicyError(findings);
}
