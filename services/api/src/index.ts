import {
  OMDALA_API_ORIGIN,
  OMDALA_APP_ORIGIN,
  OMDALA_CONTACT_TOPICS,
  OMDALA_INBOXES,
  OMDALA_MAIL_API_ORIGIN,
  OMDALA_WEB_ORIGIN,
} from '../../../packages/core/src/mail'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  ENVIRONMENT: string
  APP_BASE_URL?: string
  WEB_BASE_URL?: string
  MAIL_API_URL?: string
  MAIL_API_KEY?: string
  MAGIC_LINK_SECRET?: string
}

type ContactRequest = {
  name?: string
  email?: string
  organization?: string
  topic?: string
  message?: string
  source?: string
}

type AccessRequest = {
  email?: string
  role?: string
  nodeName?: string
  note?: string
}

type MagicLinkPayload = {
  email: string
  redirectTo: string
  exp: number
}

type MailRequest = {
  from: string
  to: string | string[]
  subject: string
  html: string
  text: string
  reply_to?: string
}

const app = new Hono<{ Bindings: Bindings }>()
type ApiContext = Context<{ Bindings: Bindings }>
type ApiStatus = 200 | 201 | 400 | 401 | 422 | 500 | 502

const localOrigins = [
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:3000',
  'http://localhost:3001',
]

const contactTopicLabels = Object.fromEntries(
  OMDALA_CONTACT_TOPICS.map((topic) => [topic.value, topic.label]),
)

function resolveAllowedOrigin(origin?: string | null) {
  if (!origin) {
    return null
  }

  const allowed = [
    OMDALA_WEB_ORIGIN,
    OMDALA_APP_ORIGIN,
    'https://docs.omdala.com',
    'https://trust.omdala.com',
    'https://admin.omdala.com',
    ...localOrigins,
  ]

  return allowed.includes(origin) ? origin : null
}

function jsonError(c: ApiContext, status: ApiStatus, code: string, message: string) {
  return c.json({ ok: false, error: { code, message } }, status)
}

function jsonOk(c: ApiContext, data: unknown, status: ApiStatus = 200) {
  return c.json({ ok: true, data }, status)
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() ?? ''
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizePath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith('/')) {
    return fallback
  }

  return value
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function createMagicLinkToken(env: Bindings, payload: MagicLinkPayload) {
  if (!env.MAGIC_LINK_SECRET) {
    throw new Error('MAGIC_LINK_SECRET is not configured')
  }

  const payloadPart = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await importHmacKey(env.MAGIC_LINK_SECRET)
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadPart))
  return `${payloadPart}.${bytesToBase64Url(new Uint8Array(signature))}`
}

async function verifyMagicLinkToken(env: Bindings, token: string) {
  if (!env.MAGIC_LINK_SECRET) {
    throw new Error('MAGIC_LINK_SECRET is not configured')
  }

  const [payloadPart, signaturePart] = token.split('.')
  if (!payloadPart || !signaturePart) {
    return null
  }

  const key = await importHmacKey(env.MAGIC_LINK_SECRET)
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signaturePart),
    new TextEncoder().encode(payloadPart),
  )

  if (!isValid) {
    return null
  }

  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlToBytes(payloadPart)),
  ) as MagicLinkPayload

  if (!payload.email || !payload.redirectTo || payload.exp < Date.now()) {
    return null
  }

  return payload
}

function getMailApiUrl(env: Bindings) {
  return (env.MAIL_API_URL ?? OMDALA_MAIL_API_ORIGIN).replace(/\/+$/g, '')
}

function getAppBaseUrl(env: Bindings) {
  return (env.APP_BASE_URL ?? OMDALA_APP_ORIGIN).replace(/\/+$/g, '')
}

function getWebBaseUrl(env: Bindings) {
  return (env.WEB_BASE_URL ?? OMDALA_WEB_ORIGIN).replace(/\/+$/g, '')
}

async function sendMail(env: Bindings, payload: MailRequest) {
  if (!env.MAIL_API_KEY) {
    throw new Error('MAIL_API_KEY is not configured')
  }

  const response = await fetch(`${getMailApiUrl(env)}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.MAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Mail API returned ${response.status}: ${detail}`)
  }
}

function formatTopicLabel(topic: string) {
  return contactTopicLabels[topic] ?? topic
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
  `
}

function buildContactInternalEmail(payload: Required<Omit<ContactRequest, 'source'>> & { source: string }) {
  const topicLabel = formatTopicLabel(payload.topic)
  return {
    from: `OMDALA Contact <${OMDALA_INBOXES.hello}>`,
    to: OMDALA_INBOXES.hello,
    reply_to: payload.email,
    subject: `[OMDALA Contact] ${payload.name} · ${topicLabel}`,
    html: buildEmailFrame(
      'New contact intake / Liên hệ mới',
      `
        <p><strong>Tên / Name:</strong> ${escapeHtml(payload.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Tổ chức / Organization:</strong> ${escapeHtml(payload.organization || 'N/A')}</p>
        <p><strong>Chủ đề / Topic:</strong> ${escapeHtml(topicLabel)}</p>
        <p><strong>Nguồn / Source:</strong> ${escapeHtml(payload.source)}</p>
        <p><strong>Nội dung / Message:</strong></p>
        <p>${escapeHtml(payload.message).replaceAll('\n', '<br />')}</p>
      `,
    ),
    text: [
      'New contact intake / Liên hệ mới',
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Organization: ${payload.organization || 'N/A'}`,
      `Topic: ${topicLabel}`,
      `Source: ${payload.source}`,
      '',
      payload.message,
    ].join('\n'),
  }
}

function buildContactAckEmail(payload: Required<Omit<ContactRequest, 'source'>> & { source: string }) {
  const topicLabel = formatTopicLabel(payload.topic)
  return {
    from: `OMDALA <${OMDALA_INBOXES.hello}>`,
    to: payload.email,
    reply_to: OMDALA_INBOXES.support,
    subject: 'OMDALA received your message / OMDALA đã nhận liên hệ của bạn',
    html: buildEmailFrame(
      'We received your message / Chúng tôi đã nhận tin nhắn của bạn',
      `
        <p>Xin chào ${escapeHtml(payload.name)},</p>
        <p>OMDALA đã nhận nội dung liên hệ của bạn về <strong>${escapeHtml(topicLabel)}</strong>. Chúng tôi sẽ phản hồi từ ${escapeHtml(OMDALA_INBOXES.support)} hoặc ${escapeHtml(OMDALA_INBOXES.hello)} sau khi điều phối nội bộ.</p>
        <p>Hello ${escapeHtml(payload.name)},</p>
        <p>We received your message about <strong>${escapeHtml(topicLabel)}</strong>. We will reply from ${escapeHtml(OMDALA_INBOXES.support)} or ${escapeHtml(OMDALA_INBOXES.hello)} after internal routing.</p>
        <p style="margin-top:18px">Reference / Mã tham chiếu: <strong>${escapeHtml(payload.email)}</strong></p>
      `,
    ),
    text: [
      'We received your message / Chúng tôi đã nhận tin nhắn của bạn',
      `Topic: ${topicLabel}`,
      `Reply from: ${OMDALA_INBOXES.support}`,
    ].join('\n'),
  }
}

function buildMagicLinkEmail(email: string, link: string, redirectTo: string) {
  return {
    from: `OMDALA App <${OMDALA_INBOXES.noreply}>`,
    to: email,
    reply_to: OMDALA_INBOXES.support,
    subject: 'Your OMDALA magic link / Liên kết đăng nhập OMDALA',
    html: buildEmailFrame(
      'Magic link sign-in / Đăng nhập bằng magic link',
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
      'Magic link sign-in / Đăng nhập bằng magic link',
      `Open: ${link}`,
      `Redirect: ${redirectTo}`,
      'Valid for 30 minutes / Có hiệu lực trong 30 phút',
    ].join('\n'),
  }
}

function buildAccessRequestInternalEmail(payload: Required<AccessRequest>) {
  return {
    from: `OMDALA Access <${OMDALA_INBOXES.app}>`,
    to: OMDALA_INBOXES.app,
    reply_to: payload.email,
    subject: `[OMDALA Access] ${payload.email} · ${payload.role}`,
    html: buildEmailFrame(
      'New access request / Yêu cầu truy cập mới',
      `
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Vai trò / Role:</strong> ${escapeHtml(payload.role)}</p>
        <p><strong>Node / Tổ chức:</strong> ${escapeHtml(payload.nodeName)}</p>
        <p><strong>Ghi chú / Note:</strong></p>
        <p>${escapeHtml(payload.note || 'No additional note.').replaceAll('\n', '<br />')}</p>
      `,
    ),
    text: [
      'New access request / Yêu cầu truy cập mới',
      `Email: ${payload.email}`,
      `Role: ${payload.role}`,
      `Node: ${payload.nodeName}`,
      '',
      payload.note || 'No additional note.',
    ].join('\n'),
  }
}

function buildAccessRequestAckEmail(payload: Required<AccessRequest>) {
  return {
    from: `OMDALA App <${OMDALA_INBOXES.app}>`,
    to: payload.email,
    reply_to: OMDALA_INBOXES.support,
    subject: 'OMDALA access request received / OMDALA đã nhận yêu cầu truy cập',
    html: buildEmailFrame(
      'Access request received / Đã nhận yêu cầu truy cập',
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
      'Access request received / Đã nhận yêu cầu truy cập',
      `Role: ${payload.role}`,
      `Node: ${payload.nodeName}`,
      `Reply from: ${OMDALA_INBOXES.app}`,
    ].join('\n'),
  }
}

// CORS — restrict to first-party OMDALA surfaces in production
app.use('/*', cors({
  origin: (origin) => resolveAllowedOrigin(origin),
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  credentials: true,
}))

// Health
app.get('/health', (c) => {
  return c.json({ ok: true, service: 'omdala-api', env: c.env.ENVIRONMENT })
})

app.post('/v1/contact', async (c) => {
  const body = await c.req.json<ContactRequest>().catch(() => null)
  if (!body) {
    return jsonError(c, 400, 'invalid_json', 'Request body must be valid JSON.')
  }

  const payload = {
    name: body.name?.trim() ?? '',
    email: normalizeEmail(body.email),
    organization: body.organization?.trim() ?? '',
    topic: body.topic?.trim() ?? 'general',
    message: body.message?.trim() ?? '',
    source: body.source?.trim() ?? 'web',
  }

  if (!payload.name || !payload.message || !isEmail(payload.email)) {
    return jsonError(c, 422, 'invalid_contact_request', 'Name, valid email, and message are required.')
  }

  try {
    await Promise.all([
      sendMail(c.env, buildContactInternalEmail(payload)),
      sendMail(c.env, buildContactAckEmail(payload)),
    ])

    return jsonOk(c, {
      received: true,
      replyFrom: OMDALA_INBOXES.support,
      submittedTo: OMDALA_INBOXES.hello,
    })
  } catch (error) {
    return jsonError(
      c,
      502,
      'mail_delivery_failed',
      error instanceof Error ? error.message : 'Unable to deliver contact email.',
    )
  }
})

app.post('/v1/auth/access-request', async (c) => {
  const body = await c.req.json<AccessRequest>().catch(() => null)
  if (!body) {
    return jsonError(c, 400, 'invalid_json', 'Request body must be valid JSON.')
  }

  const payload = {
    email: normalizeEmail(body.email),
    role: body.role?.trim() ?? '',
    nodeName: body.nodeName?.trim() ?? '',
    note: body.note?.trim() ?? '',
  }

  if (!isEmail(payload.email) || !payload.role || !payload.nodeName) {
    return jsonError(c, 422, 'invalid_access_request', 'Email, role, and node name are required.')
  }

  try {
    await Promise.all([
      sendMail(c.env, buildAccessRequestInternalEmail(payload)),
      sendMail(c.env, buildAccessRequestAckEmail(payload)),
    ])

    return jsonOk(c, {
      received: true,
      reviewInbox: OMDALA_INBOXES.app,
      supportInbox: OMDALA_INBOXES.support,
    }, 201)
  } catch (error) {
    return jsonError(
      c,
      502,
      'mail_delivery_failed',
      error instanceof Error ? error.message : 'Unable to deliver access request email.',
    )
  }
})

app.post('/v1/auth/magic-link/request', async (c) => {
  const body = await c.req.json<{ email?: string; redirectTo?: string }>().catch(() => null)
  if (!body) {
    return jsonError(c, 400, 'invalid_json', 'Request body must be valid JSON.')
  }

  const email = normalizeEmail(body.email)
  const redirectTo = normalizePath(body.redirectTo, '/dashboard')

  if (!isEmail(email)) {
    return jsonError(c, 422, 'invalid_email', 'A valid email is required.')
  }

  try {
    const expiresAt = Date.now() + 30 * 60 * 1000
    const token = await createMagicLinkToken(c.env, {
      email,
      redirectTo,
      exp: expiresAt,
    })
    const link = `${getAppBaseUrl(c.env)}/login?token=${encodeURIComponent(token)}&next=${encodeURIComponent(redirectTo)}`

    await sendMail(c.env, buildMagicLinkEmail(email, link, redirectTo))

    return jsonOk(c, {
      sent: true,
      expiresAt: new Date(expiresAt).toISOString(),
      replyFrom: OMDALA_INBOXES.support,
    }, 201)
  } catch (error) {
    return jsonError(
      c,
      502,
      'magic_link_failed',
      error instanceof Error ? error.message : 'Unable to send magic link.',
    )
  }
})

app.get('/v1/auth/magic-link', async (c) => {
  const token = c.req.query('token') ?? ''
  const requestedPath = c.req.query('next')

  if (!token) {
    return jsonError(c, 400, 'missing_token', 'Missing magic-link token.')
  }

  try {
    const payload = await verifyMagicLinkToken(c.env, token)
    if (!payload) {
      return jsonError(c, 401, 'invalid_or_expired_token', 'Magic link is invalid or has expired.')
    }

    return jsonOk(c, {
      authenticated: true,
      email: payload.email,
      redirectTo: normalizePath(requestedPath, payload.redirectTo),
      appBaseUrl: getAppBaseUrl(c.env),
      webBaseUrl: getWebBaseUrl(c.env),
      apiBaseUrl: OMDALA_API_ORIGIN,
    })
  } catch (error) {
    return jsonError(
      c,
      500,
      'magic_link_verification_failed',
      error instanceof Error ? error.message : 'Unable to verify magic link.',
    )
  }
})

// Robots — API must never be indexed
app.get('/robots.txt', (c) => {
  return c.text('User-agent: *\nDisallow: /')
})

export default app
