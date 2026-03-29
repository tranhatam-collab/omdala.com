'use client'

import { OMDALA_API_ORIGIN, OMDALA_INBOXES } from '@omdala/core'
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
      message: 'Đang xác thực magic link... / Verifying your magic link...',
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
          message: 'Magic link hợp lệ. Đang chuyển vào app... / Magic link accepted. Redirecting into the app...',
        })
        router.replace(payload.data?.redirectTo ?? '/dashboard')
      } catch (error) {
        setStatus({
          tone: 'error',
          message: error instanceof Error
            ? error.message
            : 'Magic link không hợp lệ hoặc đã hết hạn. / Magic link is invalid or expired.',
        })
      }
    })()
  }, [redirectTo, router, searchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({
      tone: 'info',
      message: 'Đang gửi magic link... / Sending your magic link...',
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
        message: `Magic link đã được gửi từ ${OMDALA_INBOXES.noreply}. / Your magic link has been sent from ${OMDALA_INBOXES.noreply}.`,
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : 'Không gửi được magic link. / Unable to send the magic link.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Work email
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
          Redirect after sign-in
          <input
            type="text"
            name="redirectTo"
            value={redirectTo}
            onChange={(event) => setRedirectTo(event.target.value)}
          />
        </label>
        <button type="submit" className="app-button app-button--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang gửi... / Sending...' : 'Send magic link / Gửi magic link'}
        </button>
      </form>

      <p className="auth-note">
        Login mail đi từ <a href={`mailto:${OMDALA_INBOXES.noreply}`}>{OMDALA_INBOXES.noreply}</a>. Nếu cần hỗ trợ, trả lời qua{' '}
        <a href={`mailto:${OMDALA_INBOXES.support}`}>{OMDALA_INBOXES.support}</a>.
      </p>

      {status.message ? (
        <p className={`auth-status auth-status--${status.tone}`}>{status.message}</p>
      ) : null}
    </>
  )
}
