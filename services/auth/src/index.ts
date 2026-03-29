import type { UserRole } from '@omdala/types'

export interface AuthUserSummary {
  id: string
  email: string
  displayName: string
  roles: UserRole[]
}

export interface AuthSession {
  user: AuthUserSummary
  issuedAt: string
  expiresAt: string
}

export interface AuthFormState {
  email: string
  passwordless: boolean
  redirectTo: string
}

export function createPasswordlessDraft(email = '', redirectTo = '/dashboard'): AuthFormState {
  return {
    email,
    passwordless: true,
    redirectTo,
  }
}

export function getMockSession(): AuthSession {
  return {
    user: {
      id: 'demo-user',
      email: 'operator@omdala.com',
      displayName: 'OMDALA Operator',
      roles: ['expert'],
    },
    issuedAt: '2026-03-29T00:00:00.000Z',
    expiresAt: '2026-03-29T12:00:00.000Z',
  }
}
