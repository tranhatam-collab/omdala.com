'use client'

import { OMDALA_API_ORIGIN, OMDALA_INBOXES, resolveLanguage } from '@omdala/core'
import { useRouter, useSearchParams } from 'next/navigation'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

type StatusTone = 'error' | 'idle' | 'info' | 'success'

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? OMDALA_API_ORIGIN).replace(/\/+$/g, '')

function normalizeRedirectPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/')) {
    return fallback
  }

  return value
}

export function MagicLinkLoginForm({
  defaultEmail,
  defaultRedirect,
}: {
  defaultEmail: string
  defaultRedirect: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isVi = resolveLanguage(searchParams.get('lang')) === 'vi'
  const verifiedTokenRef = useRef<string | null>(null)
  const [email, setEmail] = useState(defaultEmail)
  const [redirectTo, setRedirectTo] = useState(defaultRedirect)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ message: string; tone: StatusTone }>({
    message: '',
    tone: 'idle',
  })

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token || verifiedTokenRef.current === token) {
      return
    }

    verifiedTokenRef.current = token
    const nextPath = normalizeRedirectPath(searchParams.get('next'), redirectTo)
    setStatus({
      tone: 'info',
      message: isVi ? 'Đang xác thực magic link...' : 'Verifying your magic link...',
    })

    void (async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/v1/auth/magic-link?token=${encodeURIComponent(token)}&next=${encodeURIComponent(nextPath)}`,
        )
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.error?.message ?? 'Unable to verify your magic link.')
        }

        setStatus({
          tone: 'success',
          message: isVi
            ? 'Magic link hợp lệ. Đang chuyển vào app...'
            : 'Magic link accepted. Redirecting into the app...',
        })
        router.replace(payload.data?.redirectTo ?? '/dashboard')
      } catch (error) {
        setStatus({
          tone: 'error',
          message: error instanceof Error
            ? error.message
            : isVi
              ? 'Magic link không hợp lệ hoặc đã hết hạn.'
              : 'Magic link is invalid or expired.',
        })
      }
    })()
  }, [isVi, redirectTo, router, searchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({
      tone: 'info',
      message: isVi ? 'Đang gửi magic link...' : 'Sending your magic link...',
    })

    try {
      const response = await fetch(`${apiBaseUrl}/v1/auth/magic-link/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          redirectTo: normalizeRedirectPath(redirectTo, '/dashboard'),
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Unable to send your magic link.')
      }

      setStatus({
        tone: 'success',
        message: isVi
          ? `Magic link đã được gửi từ ${OMDALA_INBOXES.noreply}.`
          : `Your magic link has been sent from ${OMDALA_INBOXES.noreply}.`,
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error
          ? error.message
            : isVi
              ? 'Không gửi được magic link.'
              : 'Unable to send the magic link.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          {isVi ? 'Email công việc' : 'Work email'}
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="operator@omdala.com"
            required
          />
        </label>
        <label>
          {isVi ? 'Điều hướng sau đăng nhập' : 'Redirect after sign-in'}
          <input
            type="text"
            name="redirectTo"
            value={redirectTo}
            onChange={(event) => setRedirectTo(event.target.value)}
          />
        </label>
        <button type="submit" className="app-button app-button--primary" disabled={isSubmitting}>
          {isSubmitting ? (isVi ? 'Đang gửi...' : 'Sending...') : isVi ? 'Gửi magic link' : 'Send magic link'}
        </button>
      </form>

      <p className="auth-note">
        {isVi ? 'Email đăng nhập được gửi từ ' : 'Login email comes from '}
        <a href={`mailto:${OMDALA_INBOXES.noreply}`}>{OMDALA_INBOXES.noreply}</a>.{' '}
        {isVi ? 'Nếu cần hỗ trợ, phản hồi qua ' : 'For support, reply via '}
        <a href={`mailto:${OMDALA_INBOXES.support}`}>{OMDALA_INBOXES.support}</a>.
      </p>

      {status.message ? (
        <p className={`auth-status auth-status--${status.tone}`}>{status.message}</p>
      ) : null}
    </>
  )
}
