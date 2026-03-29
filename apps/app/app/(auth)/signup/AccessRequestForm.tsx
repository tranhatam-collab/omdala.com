'use client'

import { OMDALA_ACCESS_ROLES, OMDALA_API_ORIGIN, OMDALA_INBOXES, resolveLanguage } from '@omdala/core'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

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
  const [isVi, setIsVi] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])
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
      message: isVi ? 'Đang gửi yêu cầu truy cập...' : 'Sending your access request...',
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
        message: isVi
          ? `Đã gửi yêu cầu. Đội ngũ sẽ phản hồi từ ${OMDALA_INBOXES.app}.`
          : `Request received. The team will reply from ${OMDALA_INBOXES.app}.`,
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error
          ? error.message
            : isVi
              ? 'Không gửi được yêu cầu truy cập.'
              : 'Unable to submit the access request.',
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
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="builder@omdala.com"
            required
          />
        </label>
        <label>
          {isVi ? 'Vai trò chính' : 'Primary role'}
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
          {isVi ? 'Tên node đầu tiên' : 'First node name'}
          <input
            type="text"
            name="nodeName"
            value={form.nodeName}
            onChange={(event) => setForm((current) => ({ ...current, nodeName: event.target.value }))}
            placeholder={isVi ? 'Tên node hoặc tổ chức của bạn' : 'Your node or organization name'}
            required
          />
        </label>
        <label>
          {isVi ? 'Ghi chú bối cảnh' : 'Context note'}
          <textarea
            name="note"
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            placeholder={isVi ? 'Bạn đang xây dựng, điều phối hoặc khám phá điều gì?' : 'What you are building, coordinating, or exploring.'}
          />
        </label>
        <button type="submit" className="app-button app-button--primary" disabled={isSubmitting}>
          {isSubmitting ? (isVi ? 'Đang gửi...' : 'Sending...') : isVi ? 'Tạo yêu cầu truy cập' : 'Create draft account'}
        </button>
      </form>

      <p className="auth-note">
        {isVi ? 'Yêu cầu truy cập được gửi tới ' : 'Access intake is sent to '}
        <a href={`mailto:${OMDALA_INBOXES.app}`}>{OMDALA_INBOXES.app}</a>.{' '}
        {isVi ? 'Hỗ trợ theo dõi qua ' : 'Support follows through '}
        <a href={`mailto:${OMDALA_INBOXES.support}`}>{OMDALA_INBOXES.support}</a>.
      </p>

      {status.message ? (
        <p className={`auth-status auth-status--${status.tone}`}>{status.message}</p>
      ) : null}
    </>
  )
}
