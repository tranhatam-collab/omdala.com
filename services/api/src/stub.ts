import type {
  AccessRequest,
  ApiContract,
  ContactRequest,
  MagicLinkRequest,
  NormalizedAccessRequest,
  NormalizedContactRequest,
} from './contracts'

export interface ApiContractStubOptions {
  allowedOrigins: string[]
}

function normalizeEmail(value?: string): string {
  return value?.trim().toLowerCase() ?? ''
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const PLACEHOLDER_ORIGIN = 'https://redirect-check.invalid'

// Accept only same-origin absolute paths. Protocol-relative ("//host"),
// backslash and control-character forms are treated as hosts by browsers.
function isUnsafeRedirectText(value: string, allowSpace = false): boolean {
  return (
    value.startsWith('//') ||
    (allowSpace ? /[\\\u0000-\u001f\u007f]/ : /[\\\u0000-\u0020\u007f]/).test(value)
  )
}

function normalizePath(value: string | undefined, fallback: string): string {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return fallback
  }
  if (isUnsafeRedirectText(value)) {
    return fallback
  }

  try {
    if (isUnsafeRedirectText(decodeURIComponent(value), true)) {
      return fallback
    }
    if (new URL(value, PLACEHOLDER_ORIGIN).origin !== PLACEHOLDER_ORIGIN) {
      return fallback
    }
  } catch {
    return fallback
  }

  return value
}

function normalizeContactRequest(input: ContactRequest): NormalizedContactRequest {
  return {
    name: input.name?.trim() ?? '',
    email: normalizeEmail(input.email),
    organization: input.organization?.trim() ?? '',
    topic: input.topic?.trim() ?? 'general',
    message: input.message?.trim() ?? '',
    source: input.source?.trim() ?? 'web',
  }
}

function normalizeAccessRequest(input: AccessRequest): NormalizedAccessRequest {
  return {
    email: normalizeEmail(input.email),
    role: input.role?.trim() ?? '',
    nodeName: input.nodeName?.trim() ?? '',
    note: input.note?.trim() ?? '',
  }
}

function normalizeMagicLinkRequest(input: MagicLinkRequest): { email: string; redirectTo: string } {
  return {
    email: normalizeEmail(input.email),
    redirectTo: normalizePath(input.redirectTo, '/dashboard'),
  }
}

export function createApiContractStub(options: ApiContractStubOptions): ApiContract {
  const allowedOrigins = new Set(options.allowedOrigins)

  return {
    resolveAllowedOrigin(origin?: string | null): string | null {
      if (!origin) {
        return null
      }

      return allowedOrigins.has(origin) ? origin : null
    },
    normalizeEmail,
    isEmail,
    normalizePath,
    normalizeContactRequest,
    normalizeAccessRequest,
    normalizeMagicLinkRequest,
  }
}
