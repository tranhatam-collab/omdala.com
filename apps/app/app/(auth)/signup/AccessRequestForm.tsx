'use client'

import { OMDALA_ACCESS_ROLES, OMDALA_API_ORIGIN, OMDALA_INBOXES } from '@omdala/core'
import type { FormEvent } from 'react'
import { useState } from 'react'

type AccessState = {
  email: string
  role: string
  nodeName: string
  note: string
}

type StatusTone = 'error' | 'idle' | 'info' | 'success'

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? OMDALA_API_ORIGIN).replace(/\/+$/g, '')

const initialState: AccessState = {
  email: '',
  role: OMDALA_ACCESS_ROLES[0].value,
  nodeName: '',
  note: '',
}

export function AccessRequestForm() {
  const [form, setForm] = useState<AccessState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ message: string; tone: StatusTone }>({
    message: '',
    tone: 'idle',
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({
      tone: 'info',
      message: 'Đang gửi yêu cầu truy cập... / Sending your access request...',
    })

    try {
      const response = await fetch(`${apiBaseUrl}/v1/auth/access-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Unable to submit the access request.')
      }

      setForm(initialState)
      setStatus({
        tone: 'success',
        message: `Đã gửi yêu cầu. Đội ngũ sẽ phản hồi từ ${OMDALA_INBOXES.app}. / Request received. The team will reply from ${OMDALA_INBOXES.app}.`,
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : 'Không gửi được yêu cầu truy cập. / Unable to submit the access request.',
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
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="builder@omdala.com"
            required
          />
        </label>
        <label>
          Primary role
          <select
            name="role"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
          >
            {OMDALA_ACCESS_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          First node name
          <input
            type="text"
            name="nodeName"
            value={form.nodeName}
            onChange={(event) => setForm((current) => ({ ...current, nodeName: event.target.value }))}
            placeholder="Your node or organization name"
            required
          />
        </label>
        <label>
          Context note / Ghi chú
          <textarea
            name="note"
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            placeholder="What you are building, coordinating, or exploring."
          />
        </label>
        <button type="submit" className="app-button app-button--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang gửi... / Sending...' : 'Create draft account / Tạo yêu cầu truy cập'}
        </button>
      </form>

      <p className="auth-note">
        Access intake được gửi tới <a href={`mailto:${OMDALA_INBOXES.app}`}>{OMDALA_INBOXES.app}</a>. Hỗ trợ theo dõi qua{' '}
        <a href={`mailto:${OMDALA_INBOXES.support}`}>{OMDALA_INBOXES.support}</a>.
      </p>

      {status.message ? (
        <p className={`auth-status auth-status--${status.tone}`}>{status.message}</p>
      ) : null}
    </>
  )
}
