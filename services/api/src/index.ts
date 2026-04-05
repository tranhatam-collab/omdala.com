import {
  OMDALA_API_ORIGIN,
  OMDALA_APP_ORIGIN,
  OMDALA_CONTACT_TOPICS,
  OMDALA_INBOXES,
  OMDALA_MAIL_API_ORIGIN,
  OMDALA_WEB_ORIGIN,
} from "../../../packages/core/src/mail";
import type {
  CommitmentRecord,
  NodeRecord,
  RealityProofRecord,
  StateRecord,
  TransitionRecord,
  TrustScoreRecord,
} from "../../../packages/types/src";
import type { Context } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type {
  AccessRequest,
  ApiBindings,
  ContactRequest,
  MagicLinkPayload,
  MailRequest,
  RealityCommitmentRequest,
  RealityProofRequest,
} from "./contracts";
import {
  createCommitment,
  createProof,
  getTrustByNodeId,
  listCommitments,
  listNodes,
  listProofs,
  listStates,
  listTransitions,
  listTrust,
} from "./db/reality-repository";
import { DbQueryError, mapDbErrorToHttp } from "./db/errors";
import { createApiContractStub } from "./stub";

export type {
  AccessRequest,
  ApiBindings,
  ContactRequest,
  MagicLinkPayload,
  MailRequest,
} from "./contracts";
export type { ApiContractStubOptions } from "./stub";
export { createApiContractStub } from "./stub";

const app = new Hono<{
  Bindings: ApiBindings;
  Variables: {
    requestId: string;
  };
}>();
type ApiContext = Context<{
  Bindings: ApiBindings;
  Variables: {
    requestId: string;
  };
}>;
type ApiStatus = 200 | 201 | 400 | 401 | 404 | 422 | 429 | 500 | 502 | 504;
type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

const localOrigins = [
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://localhost:3000",
  "http://localhost:3001",
];

const contactTopicLabels = Object.fromEntries(
  OMDALA_CONTACT_TOPICS.map((topic) => [topic.value, topic.label]),
);
const apiContract = createApiContractStub({
  allowedOrigins: [
    OMDALA_WEB_ORIGIN,
    OMDALA_APP_ORIGIN,
    "https://docs.omdala.com",
    "https://trust.omdala.com",
    "https://admin.omdala.com",
    ...localOrigins,
  ],
});

function jsonError(
  c: ApiContext,
  status: ApiStatus,
  code: string,
  message: string,
) {
  const requestId = c.get("requestId") as string | undefined;
  return c.json(
    {
      ok: false,
      error: { code, message },
      meta: requestId ? { requestId } : undefined,
    },
    status,
  );
}

function jsonOk(c: ApiContext, data: unknown, status: ApiStatus = 200) {
  const requestId = c.get("requestId") as string | undefined;
  return c.json(
    {
      ok: true,
      data,
      meta: requestId ? { requestId } : undefined,
    },
    status,
  );
}

function generateRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateRequestId(c: ApiContext): string {
  const existing = c.get("requestId") as string | undefined;
  if (existing) {
    return existing;
  }

  const headerId = c.req.header("x-request-id")?.trim();
  const requestId = headerId || generateRequestId();
  c.set("requestId", requestId);
  return requestId;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getClientIp(c: ApiContext): string {
  return (
    c.req.header("cf-connecting-ip")?.trim() ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (bucket.count >= limit) {
    return true;
  }

  bucket.count += 1;
  rateLimitStore.set(key, bucket);
  return false;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function createMagicLinkToken(
  env: ApiBindings,
  payload: MagicLinkPayload,
) {
  if (!env.MAGIC_LINK_SECRET) {
    throw new Error("MAGIC_LINK_SECRET is not configured");
  }

  const payloadPart = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const key = await importHmacKey(env.MAGIC_LINK_SECRET);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadPart),
  );
  return `${payloadPart}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function verifyMagicLinkToken(env: ApiBindings, token: string) {
  if (!env.MAGIC_LINK_SECRET) {
    throw new Error("MAGIC_LINK_SECRET is not configured");
  }

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const key = await importHmacKey(env.MAGIC_LINK_SECRET);
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signaturePart),
    new TextEncoder().encode(payloadPart),
  );

  if (!isValid) {
    return null;
  }

  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlToBytes(payloadPart)),
  ) as MagicLinkPayload;

  if (!payload.email || !payload.redirectTo || payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

function getMailApiUrl(env: ApiBindings) {
  return (env.MAIL_API_URL ?? OMDALA_MAIL_API_ORIGIN).replace(/\/+$/g, "");
}

function getAppBaseUrl(env: ApiBindings) {
  return (env.APP_BASE_URL ?? OMDALA_APP_ORIGIN).replace(/\/+$/g, "");
}

function getWebBaseUrl(env: ApiBindings) {
  return (env.WEB_BASE_URL ?? OMDALA_WEB_ORIGIN).replace(/\/+$/g, "");
}

function createRealitySeed() {
  const now = new Date().toISOString();

  const nodes: NodeRecord[] = [
    {
      id: "node_business_a",
      slug: "business-a",
      nodeType: "business",
      name: "Business A",
      summary: "SME operator in Zero Overdue pilot.",
      locationText: "Ho Chi Minh City",
      visibility: "restricted_public",
      status: "active",
      primaryRole: "business",
      trustLevel: "verified",
      verificationStatus: "verified",
      proofCount: 2,
      resourceCount: 1,
    },
    {
      id: "node_customer_b",
      slug: "customer-b",
      nodeType: "person",
      name: "Customer B",
      summary: "Counterparty receiving invoice-backed commitments.",
      locationText: "Da Nang",
      visibility: "network",
      status: "active",
      primaryRole: "expert",
      trustLevel: "basic",
      verificationStatus: "pending",
      proofCount: 1,
      resourceCount: 0,
    },
  ];

  const states: StateRecord[] = [
    {
      id: "state_current_receivable",
      nodeId: "node_business_a",
      label: "Current receivable",
      summary: "Open receivable awaiting payment proof.",
      status: "current",
      updatedAt: now,
    },
    {
      id: "state_desired_paid",
      nodeId: "node_business_a",
      label: "Paid invoice",
      summary: "Invoice settled with attached payment proof.",
      status: "desired",
      updatedAt: now,
    },
  ];

  const commitments: CommitmentRecord[] = [
    {
      id: "commitment_invoice_001",
      fromNodeId: "node_business_a",
      toNodeId: "node_customer_b",
      title: "Invoice #001 payment commitment",
      summary: "Customer B pays invoice within agreed due date.",
      amount: 18000000,
      currency: "VND",
      dueAt: now,
      status: "active",
      proofIds: ["proof_payment_001"],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const transitions: TransitionRecord[] = [
    {
      id: "transition_receivable_to_paid",
      commitmentId: "commitment_invoice_001",
      nodeId: "node_business_a",
      fromStateLabel: "Current receivable",
      toStateLabel: "Paid invoice",
      summary: "Transition from overdue risk to verified payment outcome.",
      status: "planned",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const proofs: RealityProofRecord[] = [
    {
      id: "proof_payment_001",
      commitmentId: "commitment_invoice_001",
      type: "payment",
      summary: "Bank transfer receipt attached for invoice settlement.",
      verificationStatus: "pending",
      createdAt: now,
    },
  ];

  const trust: TrustScoreRecord[] = [
    {
      nodeId: "node_business_a",
      score: 78,
      level: "verified",
      explanation: [
        "Two successful proof-backed settlements.",
        "No active disputes.",
      ],
      updatedAt: now,
    },
    {
      nodeId: "node_customer_b",
      score: 61,
      level: "basic",
      explanation: [
        "Pending payment proof verification.",
        "Limited completed commitment history.",
      ],
      updatedAt: now,
    },
  ];

  return { nodes, states, commitments, transitions, proofs, trust };
}

const realitySeed = createRealitySeed();

function normalizeRealityCommitment(input: RealityCommitmentRequest) {
  return {
    fromNodeId: input.fromNodeId?.trim() ?? "",
    toNodeId: input.toNodeId?.trim() ?? "",
    title: input.title?.trim() ?? "",
    summary: input.summary?.trim() ?? "",
    amount: typeof input.amount === "number" ? input.amount : undefined,
    currency: input.currency?.trim() ?? undefined,
    dueAt: input.dueAt?.trim() ?? undefined,
  };
}

function normalizeRealityProof(input: RealityProofRequest) {
  return {
    commitmentId: input.commitmentId?.trim() ?? "",
    transitionId: input.transitionId?.trim() ?? "",
    type: input.type,
    summary: input.summary?.trim() ?? "",
  };
}

function isIsoDateTimeString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function validateCommitmentPayload(
  payload: ReturnType<typeof normalizeRealityCommitment>,
): string | null {
  if (
    !payload.fromNodeId ||
    !payload.toNodeId ||
    !payload.title ||
    !payload.summary
  ) {
    return "fromNodeId, toNodeId, title, and summary are required";
  }

  if (payload.amount !== undefined && payload.amount <= 0) {
    return "amount must be greater than 0 when provided";
  }

  if (payload.currency !== undefined && payload.currency.length > 12) {
    return "currency must be at most 12 characters";
  }

  if (payload.dueAt !== undefined && !isIsoDateTimeString(payload.dueAt)) {
    return "dueAt must be a valid ISO date/time string";
  }

  return null;
}

function validateProofPayload(
  payload: ReturnType<typeof normalizeRealityProof>,
): string | null {
  if (!payload.commitmentId && !payload.transitionId) {
    return "proof requires commitmentId or transitionId";
  }

  if (!payload.type) {
    return "proof type is required";
  }

  if (!payload.summary) {
    return "proof summary is required";
  }

  return null;
}

async function withV2Guard(
  c: ApiContext,
  handler: () => Promise<Response>,
): Promise<Response> {
  const requestId = getOrCreateRequestId(c);
  const startedAt = Date.now();
  try {
    const response = await handler();
    const durationMs = Date.now() - startedAt;
    const errorCode = await extractErrorCodeFromResponse(response);

    console.log("v2_request", {
      request_id: requestId,
      route: c.req.path,
      method: c.req.method,
      status: response.status,
      error_code: errorCode,
      duration_ms: durationMs,
    });

    return response;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    if (error instanceof DbQueryError) {
      const mapped = mapDbErrorToHttp(error);

      console.error("v2/reality db error", {
        request_id: requestId,
        path: c.req.path,
        method: c.req.method,
        operation: error.operation,
        sql_state: error.sqlState,
        kind: error.kind,
        message: error.message,
        error_code: mapped.errorCode,
        duration_ms: durationMs,
      });

      return jsonError(c, mapped.status, mapped.errorCode, mapped.message);
    }

    const mapped = mapDbErrorToHttp(error);

    console.error("v2/reality handler error", {
      request_id: requestId,
      path: c.req.path,
      method: c.req.method,
      message: error instanceof Error ? error.message : String(error),
      error_code: mapped.errorCode,
      duration_ms: durationMs,
    });

    return jsonError(c, mapped.status, mapped.errorCode, mapped.message);
  }
}

async function extractErrorCodeFromResponse(
  response: Response,
): Promise<string> {
  if (response.status < 400) {
    return "";
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    return "";
  }

  try {
    const json = (await response.clone().json()) as {
      error?: { code?: unknown };
    };
    const code = json.error?.code;
    return typeof code === "string" ? code : "";
  } catch {
    return "";
  }
}

function hasDatabase(env: ApiBindings): boolean {
  return Boolean(env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL);
}

function toCommitmentDbInput(
  payload: ReturnType<typeof normalizeRealityCommitment>,
) {
  const dbInput: {
    fromNodeId: string;
    toNodeId: string;
    title: string;
    summary: string;
    amount?: number;
    currency?: string;
    dueAt?: string;
  } = {
    fromNodeId: payload.fromNodeId,
    toNodeId: payload.toNodeId,
    title: payload.title,
    summary: payload.summary,
  };

  if (payload.amount !== undefined) {
    dbInput.amount = payload.amount;
  }
  if (payload.currency !== undefined) {
    dbInput.currency = payload.currency;
  }
  if (payload.dueAt !== undefined) {
    dbInput.dueAt = payload.dueAt;
  }

  return dbInput;
}

function toProofDbInput(payload: ReturnType<typeof normalizeRealityProof>) {
  const dbInput: {
    commitmentId?: string;
    transitionId?: string;
    type: "document" | "payment" | "behavior" | "verification";
    summary: string;
  } = {
    type: payload.type!,
    summary: payload.summary,
  };

  if (payload.commitmentId) {
    dbInput.commitmentId = payload.commitmentId;
  }
  if (payload.transitionId) {
    dbInput.transitionId = payload.transitionId;
  }

  return dbInput;
}

function applySeedTrustDeltaForProofSubmission(commitmentId: string): void {
  const commitment = realitySeed.commitments.find(
    (item) => item.id === commitmentId,
  );
  if (!commitment) {
    return;
  }

  const now = new Date().toISOString();
  const candidateNodeIds = [commitment.fromNodeId, commitment.toNodeId]
    .map((value) => value.trim())
    .filter(Boolean);

  for (const nodeId of candidateNodeIds) {
    const existing = realitySeed.trust.find((item) => item.nodeId === nodeId);
    if (existing) {
      existing.score = Math.min(100, Number(existing.score) + 0.2);
      existing.updatedAt = now;
      existing.explanation = [
        "Trust adjusted after proof submission.",
        "Pending verification may increase confidence further.",
      ];
      continue;
    }

    realitySeed.trust.unshift({
      nodeId,
      score: 50,
      level: "basic",
      explanation: [
        "Trust adjusted after proof submission.",
        "Pending verification may increase confidence further.",
      ],
      updatedAt: now,
    });
  }
}

async function sendMail(env: ApiBindings, payload: MailRequest) {
  if (!env.MAIL_API_KEY) {
    throw new Error("MAIL_API_KEY is not configured");
  }

  const response = await fetch(`${getMailApiUrl(env)}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Mail API returned ${response.status}: ${detail}`);
  }
}

function formatTopicLabel(topic: string) {
  return contactTopicLabels[topic] ?? topic;
}

function buildEmailFrame(title: string, body: string) {
  return `
    <div style="background:#08101f;padding:24px;font-family:Inter,Segoe UI,sans-serif;color:#f7fbff">
      <div style="max-width:640px;margin:0 auto;background:#101c33;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7ef2ff">OMDALA</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15">${escapeHtml(title)}</h1>
        <div style="color:#dde8f5;line-height:1.7;font-size:15px">${body}</div>
      </div>
    </div>
  `;
}

function buildContactInternalEmail(
  payload: Required<Omit<ContactRequest, "source">> & { source: string },
) {
  const topicLabel = formatTopicLabel(payload.topic);
  return {
    from: `OMDALA Contact <${OMDALA_INBOXES.hello}>`,
    to: OMDALA_INBOXES.hello,
    reply_to: payload.email,
    subject: `[OMDALA Contact] ${payload.name} · ${topicLabel}`,
    html: buildEmailFrame(
      "New contact intake / Liên hệ mới",
      `
        <p><strong>Tên / Name:</strong> ${escapeHtml(payload.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Tổ chức / Organization:</strong> ${escapeHtml(payload.organization || "N/A")}</p>
        <p><strong>Chủ đề / Topic:</strong> ${escapeHtml(topicLabel)}</p>
        <p><strong>Nguồn / Source:</strong> ${escapeHtml(payload.source)}</p>
        <p><strong>Nội dung / Message:</strong></p>
        <p>${escapeHtml(payload.message).replaceAll("\n", "<br />")}</p>
      `,
    ),
    text: [
      "New contact intake / Liên hệ mới",
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Organization: ${payload.organization || "N/A"}`,
      `Topic: ${topicLabel}`,
      `Source: ${payload.source}`,
      "",
      payload.message,
    ].join("\n"),
  };
}

function buildContactAckEmail(
  payload: Required<Omit<ContactRequest, "source">> & { source: string },
) {
  const topicLabel = formatTopicLabel(payload.topic);
  return {
    from: `OMDALA <${OMDALA_INBOXES.hello}>`,
    to: payload.email,
    reply_to: OMDALA_INBOXES.support,
    subject: "OMDALA received your message / OMDALA đã nhận liên hệ của bạn",
    html: buildEmailFrame(
      "We received your message / Chúng tôi đã nhận tin nhắn của bạn",
      `
        <p>Xin chào ${escapeHtml(payload.name)},</p>
        <p>OMDALA đã nhận nội dung liên hệ của bạn về <strong>${escapeHtml(topicLabel)}</strong>. Chúng tôi sẽ phản hồi từ ${escapeHtml(OMDALA_INBOXES.support)} hoặc ${escapeHtml(OMDALA_INBOXES.hello)} sau khi điều phối nội bộ.</p>
        <p>Hello ${escapeHtml(payload.name)},</p>
        <p>We received your message about <strong>${escapeHtml(topicLabel)}</strong>. We will reply from ${escapeHtml(OMDALA_INBOXES.support)} or ${escapeHtml(OMDALA_INBOXES.hello)} after internal routing.</p>
        <p style="margin-top:18px">Reference / Mã tham chiếu: <strong>${escapeHtml(payload.email)}</strong></p>
      `,
    ),
    text: [
      "We received your message / Chúng tôi đã nhận tin nhắn của bạn",
      `Topic: ${topicLabel}`,
      `Reply from: ${OMDALA_INBOXES.support}`,
    ].join("\n"),
  };
}

function buildMagicLinkEmail(email: string, link: string, redirectTo: string) {
  return {
    from: `OMDALA App <${OMDALA_INBOXES.noreply}>`,
    to: email,
    reply_to: OMDALA_INBOXES.support,
    subject: "Your OMDALA magic link / Liên kết đăng nhập OMDALA",
    html: buildEmailFrame(
      "Magic link sign-in / Đăng nhập bằng magic link",
      `
        <p>Bạn vừa yêu cầu đăng nhập vào OMDALA. Nhấn vào nút bên dưới để vào app.</p>
        <p>You requested access to OMDALA. Use the button below to enter the app.</p>
        <p style="margin:24px 0">
          <a href="${escapeHtml(link)}" style="display:inline-flex;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg,#153a72,#3d8bff);color:#f7fbff;text-decoration:none;font-weight:700">
            Open OMDALA / Mở OMDALA
          </a>
        </p>
        <p>Link này có hiệu lực trong 30 phút và sẽ chuyển bạn tới <strong>${escapeHtml(redirectTo)}</strong>.</p>
        <p>This link stays valid for 30 minutes and will redirect you to <strong>${escapeHtml(redirectTo)}</strong>.</p>
        <p>Nếu bạn không yêu cầu email này, hãy bỏ qua. If you did not request this email, you can ignore it.</p>
      `,
    ),
    text: [
      "Magic link sign-in / Đăng nhập bằng magic link",
      `Open: ${link}`,
      `Redirect: ${redirectTo}`,
      "Valid for 30 minutes / Có hiệu lực trong 30 phút",
    ].join("\n"),
  };
}

function buildAccessRequestInternalEmail(payload: Required<AccessRequest>) {
  return {
    from: `OMDALA Access <${OMDALA_INBOXES.app}>`,
    to: OMDALA_INBOXES.app,
    reply_to: payload.email,
    subject: `[OMDALA Access] ${payload.email} · ${payload.role}`,
    html: buildEmailFrame(
      "New access request / Yêu cầu truy cập mới",
      `
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Vai trò / Role:</strong> ${escapeHtml(payload.role)}</p>
        <p><strong>Node / Tổ chức:</strong> ${escapeHtml(payload.nodeName)}</p>
        <p><strong>Ghi chú / Note:</strong></p>
        <p>${escapeHtml(payload.note || "No additional note.").replaceAll("\n", "<br />")}</p>
      `,
    ),
    text: [
      "New access request / Yêu cầu truy cập mới",
      `Email: ${payload.email}`,
      `Role: ${payload.role}`,
      `Node: ${payload.nodeName}`,
      "",
      payload.note || "No additional note.",
    ].join("\n"),
  };
}

function buildAccessRequestAckEmail(payload: Required<AccessRequest>) {
  return {
    from: `OMDALA App <${OMDALA_INBOXES.app}>`,
    to: payload.email,
    reply_to: OMDALA_INBOXES.support,
    subject: "OMDALA access request received / OMDALA đã nhận yêu cầu truy cập",
    html: buildEmailFrame(
      "Access request received / Đã nhận yêu cầu truy cập",
      `
        <p>Chúng tôi đã nhận yêu cầu truy cập OMDALA của bạn với vai trò <strong>${escapeHtml(payload.role)}</strong>.</p>
        <p>We received your OMDALA access request for the <strong>${escapeHtml(payload.role)}</strong> role.</p>
        <p>Node hoặc tổ chức bạn gửi: <strong>${escapeHtml(payload.nodeName)}</strong>.</p>
        <p>The node or organization you submitted: <strong>${escapeHtml(payload.nodeName)}</strong>.</p>
        <p>Đội ngũ sẽ phản hồi từ ${escapeHtml(OMDALA_INBOXES.app)} hoặc ${escapeHtml(OMDALA_INBOXES.support)} sau khi rà soát.</p>
        <p>The team will reply from ${escapeHtml(OMDALA_INBOXES.app)} or ${escapeHtml(OMDALA_INBOXES.support)} after review.</p>
      `,
    ),
    text: [
      "Access request received / Đã nhận yêu cầu truy cập",
      `Role: ${payload.role}`,
      `Node: ${payload.nodeName}`,
      `Reply from: ${OMDALA_INBOXES.app}`,
    ].join("\n"),
  };
}

// CORS — restrict to first-party OMDALA surfaces in production
app.use(
  "/*",
  cors({
    origin: (origin) => apiContract.resolveAllowedOrigin(origin),
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
    credentials: true,
  }),
);

app.use("/v2/reality/*", async (c, next) => {
  const requestId = getOrCreateRequestId(c);
  await next();
  c.header("x-request-id", requestId);
});

// Health
app.get("/health", (c) => {
  return c.json({ ok: true, service: "omdala-api", env: c.env.ENVIRONMENT });
});

app.get("/v2/reality/health", (c) => {
  return jsonOk(c, {
    status: "ok",
    service: "omdala-api",
    namespace: "v2/reality",
    environment: c.env.ENVIRONMENT,
    persistence: hasDatabase(c.env) ? "postgres" : "in-memory-seed",
  });
});

app.get("/v2/reality/nodes", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const nodes = await listNodes(c.env);
      return jsonOk(c, { nodes, total: nodes.length });
    }

    return jsonOk(c, {
      nodes: realitySeed.nodes,
      total: realitySeed.nodes.length,
    });
  });
});

app.get("/v2/reality/states", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const states = await listStates(c.env);
      return jsonOk(c, { states, total: states.length });
    }

    return jsonOk(c, {
      states: realitySeed.states,
      total: realitySeed.states.length,
    });
  });
});

app.get("/v2/reality/commitments", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const commitments = await listCommitments(c.env);
      return jsonOk(c, { commitments, total: commitments.length });
    }

    return jsonOk(c, {
      commitments: realitySeed.commitments,
      total: realitySeed.commitments.length,
    });
  });
});

app.post("/v2/reality/commitments", async (c) => {
  return withV2Guard(c, async () => {
    const body = await c.req.json<RealityCommitmentRequest>().catch(() => null);
    if (!body) {
      return jsonError(
        c,
        400,
        "INVALID_JSON",
        "Request body must be valid JSON",
      );
    }

    const payload = normalizeRealityCommitment(body);
    const validationError = validateCommitmentPayload(payload);
    if (validationError) {
      return jsonError(c, 422, "INVALID_COMMITMENT", validationError);
    }

    if (hasDatabase(c.env)) {
      const record = await createCommitment(
        c.env,
        toCommitmentDbInput(payload),
      );
      return jsonOk(c, record, 201);
    }

    const now = new Date().toISOString();
    const record: CommitmentRecord = {
      id: `commitment_${Date.now()}`,
      fromNodeId: payload.fromNodeId,
      toNodeId: payload.toNodeId,
      title: payload.title,
      summary: payload.summary,
      status: "draft",
      proofIds: [],
      createdAt: now,
      updatedAt: now,
    };

    if (payload.amount !== undefined) {
      record.amount = payload.amount;
    }

    if (payload.currency !== undefined) {
      record.currency = payload.currency;
    }

    if (payload.dueAt !== undefined) {
      record.dueAt = payload.dueAt;
    }

    realitySeed.commitments.unshift(record);
    return jsonOk(c, record, 201);
  });
});

app.get("/v2/reality/transitions", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const transitions = await listTransitions(c.env);
      return jsonOk(c, { transitions, total: transitions.length });
    }

    return jsonOk(c, {
      transitions: realitySeed.transitions,
      total: realitySeed.transitions.length,
    });
  });
});

app.get("/v2/reality/proofs", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const proofs = await listProofs(c.env);
      return jsonOk(c, { proofs, total: proofs.length });
    }

    return jsonOk(c, {
      proofs: realitySeed.proofs,
      total: realitySeed.proofs.length,
    });
  });
});

app.post("/v2/reality/proofs", async (c) => {
  return withV2Guard(c, async () => {
    const body = await c.req.json<RealityProofRequest>().catch(() => null);
    if (!body) {
      return jsonError(
        c,
        400,
        "INVALID_JSON",
        "Request body must be valid JSON",
      );
    }

    const payload = normalizeRealityProof(body);
    const validationError = validateProofPayload(payload);
    if (validationError) {
      return jsonError(c, 422, "INVALID_PROOF", validationError);
    }

    if (hasDatabase(c.env)) {
      const record = await createProof(c.env, toProofDbInput(payload));
      return jsonOk(c, record, 201);
    }

    const record: RealityProofRecord = {
      id: `proof_${Date.now()}`,
      type: payload.type!,
      summary: payload.summary,
      verificationStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    if (payload.commitmentId) {
      record.commitmentId = payload.commitmentId;
    }

    if (payload.transitionId) {
      record.transitionId = payload.transitionId;
    }

    realitySeed.proofs.unshift(record);
    if (payload.commitmentId) {
      applySeedTrustDeltaForProofSubmission(payload.commitmentId);
    }
    return jsonOk(c, record, 201);
  });
});

app.get("/v2/reality/trust", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const trust = await listTrust(c.env);
      return jsonOk(c, { trust, total: trust.length });
    }

    return jsonOk(c, {
      trust: realitySeed.trust,
      total: realitySeed.trust.length,
    });
  });
});

app.get("/v2/reality/trust/:nodeId", async (c) => {
  return withV2Guard(c, async () => {
    const nodeId = c.req.param("nodeId");
    if (!nodeId) {
      return jsonError(c, 422, "INVALID_NODE_ID", "nodeId is required");
    }

    if (hasDatabase(c.env)) {
      const record = await getTrustByNodeId(c.env, nodeId);

      if (!record) {
        return jsonError(c, 404, "TRUST_NOT_FOUND", "Trust record not found");
      }

      return jsonOk(c, record);
    }

    const record = realitySeed.trust.find((item) => item.nodeId === nodeId);

    if (!record) {
      return jsonError(c, 404, "TRUST_NOT_FOUND", "Trust record not found");
    }

    return jsonOk(c, record);
  });
});

app.post("/v1/contact", async (c) => {
  const body = await c.req.json<ContactRequest>().catch(() => null);
  if (!body) {
    return jsonError(
      c,
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const payload = apiContract.normalizeContactRequest(body);
  const clientIp = getClientIp(c);
  if (
    isRateLimited(`contact:ip:${clientIp}`, 10, 15 * 60 * 1000) ||
    isRateLimited(`contact:email:${payload.email}`, 5, 15 * 60 * 1000)
  ) {
    return jsonError(
      c,
      429,
      "rate_limited",
      "Too many contact requests. Please retry later.",
    );
  }

  if (
    !payload.name ||
    !payload.message ||
    !apiContract.isEmail(payload.email)
  ) {
    return jsonError(
      c,
      422,
      "invalid_contact_request",
      "Name, valid email, and message are required.",
    );
  }

  try {
    await Promise.all([
      sendMail(c.env, buildContactInternalEmail(payload)),
      sendMail(c.env, buildContactAckEmail(payload)),
    ]);

    return jsonOk(c, {
      received: true,
      replyFrom: OMDALA_INBOXES.support,
      submittedTo: OMDALA_INBOXES.hello,
    });
  } catch (error) {
    return jsonError(
      c,
      502,
      "mail_delivery_failed",
      error instanceof Error
        ? error.message
        : "Unable to deliver contact email.",
    );
  }
});

app.post("/v1/auth/access-request", async (c) => {
  const body = await c.req.json<AccessRequest>().catch(() => null);
  if (!body) {
    return jsonError(
      c,
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const payload = apiContract.normalizeAccessRequest(body);
  const clientIp = getClientIp(c);
  if (
    isRateLimited(`access:ip:${clientIp}`, 10, 15 * 60 * 1000) ||
    isRateLimited(`access:email:${payload.email}`, 5, 15 * 60 * 1000)
  ) {
    return jsonError(
      c,
      429,
      "rate_limited",
      "Too many access requests. Please retry later.",
    );
  }

  if (
    !apiContract.isEmail(payload.email) ||
    !payload.role ||
    !payload.nodeName
  ) {
    return jsonError(
      c,
      422,
      "invalid_access_request",
      "Email, role, and node name are required.",
    );
  }

  try {
    await Promise.all([
      sendMail(c.env, buildAccessRequestInternalEmail(payload)),
      sendMail(c.env, buildAccessRequestAckEmail(payload)),
    ]);

    return jsonOk(
      c,
      {
        received: true,
        reviewInbox: OMDALA_INBOXES.app,
        supportInbox: OMDALA_INBOXES.support,
      },
      201,
    );
  } catch (error) {
    return jsonError(
      c,
      502,
      "mail_delivery_failed",
      error instanceof Error
        ? error.message
        : "Unable to deliver access request email.",
    );
  }
});

app.post("/v1/auth/magic-link/request", async (c) => {
  const body = await c.req
    .json<{ email?: string; redirectTo?: string }>()
    .catch(() => null);
  if (!body) {
    return jsonError(
      c,
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const { email, redirectTo } = apiContract.normalizeMagicLinkRequest(body);
  const clientIp = getClientIp(c);
  if (
    isRateLimited(`magic-link:ip:${clientIp}`, 20, 15 * 60 * 1000) ||
    isRateLimited(`magic-link:email:${email}`, 5, 15 * 60 * 1000)
  ) {
    return jsonError(
      c,
      429,
      "rate_limited",
      "Too many magic-link requests. Please retry later.",
    );
  }

  if (!apiContract.isEmail(email)) {
    return jsonError(c, 422, "invalid_email", "A valid email is required.");
  }

  try {
    const expiresAt = Date.now() + 30 * 60 * 1000;
    const token = await createMagicLinkToken(c.env, {
      email,
      redirectTo,
      exp: expiresAt,
    });
    const link = `${getAppBaseUrl(c.env)}/login?token=${encodeURIComponent(token)}&next=${encodeURIComponent(redirectTo)}`;

    await sendMail(c.env, buildMagicLinkEmail(email, link, redirectTo));

    return jsonOk(
      c,
      {
        sent: true,
        expiresAt: new Date(expiresAt).toISOString(),
        replyFrom: OMDALA_INBOXES.support,
      },
      201,
    );
  } catch (error) {
    return jsonError(
      c,
      502,
      "magic_link_failed",
      error instanceof Error ? error.message : "Unable to send magic link.",
    );
  }
});

app.get("/v1/auth/magic-link", async (c) => {
  const token = c.req.query("token") ?? "";
  const requestedPath = c.req.query("next");

  if (!token) {
    return jsonError(c, 400, "missing_token", "Missing magic-link token.");
  }

  try {
    const payload = await verifyMagicLinkToken(c.env, token);
    if (!payload) {
      return jsonError(
        c,
        401,
        "invalid_or_expired_token",
        "Magic link is invalid or has expired.",
      );
    }

    return jsonOk(c, {
      authenticated: true,
      email: payload.email,
      redirectTo: apiContract.normalizePath(requestedPath, payload.redirectTo),
      appBaseUrl: getAppBaseUrl(c.env),
      webBaseUrl: getWebBaseUrl(c.env),
      apiBaseUrl: OMDALA_API_ORIGIN,
    });
  } catch (error) {
    return jsonError(
      c,
      500,
      "magic_link_verification_failed",
      error instanceof Error ? error.message : "Unable to verify magic link.",
    );
  }
});

// Robots — API must never be indexed
app.get("/robots.txt", (c) => {
  return c.text("User-agent: *\nDisallow: /");
});

export default app;
