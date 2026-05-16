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

function normalizePath(value: string | undefined, fallback: string): string {
  if (!value || !value.startsWith('/')) {
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
