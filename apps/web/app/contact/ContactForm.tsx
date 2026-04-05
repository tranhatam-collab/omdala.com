'use client'

import { OMDALA_API_ORIGIN, OMDALA_CONTACT_TOPICS, OMDALA_INBOXES } from '../../../../packages/core/src/mail'
import { resolveLanguage } from '@omdala/core'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

type ContactState = {
  name: string
  email: string
  organization: string
  topic: string
  message: string
}

type StatusTone = 'error' | 'idle' | 'info' | 'success'

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? OMDALA_API_ORIGIN).replace(/\/+$/g, '')

const initialState: ContactState = {
  name: '',
  email: '',
  organization: '',
  topic: OMDALA_CONTACT_TOPICS[0].value,
  message: '',
}

export function ContactForm() {
  const [isVi, setIsVi] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])
  const [form, setForm] = useState<ContactState>(initialState)
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
      message: isVi ? 'Đang gửi liên hệ...' : 'Sending your message...',
    })

    try {
      const response = await fetch(`${apiBaseUrl}/v1/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          source: 'web',
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Unable to submit contact form.')
      }

      setForm(initialState)
      setStatus({
        tone: 'success',
        message: isVi
          ? `Đã gửi. Đội ngũ sẽ phản hồi từ ${OMDALA_INBOXES.support}.`
          : `Sent. The team will reply from ${OMDALA_INBOXES.support}.`,
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : isVi
            ? 'Không gửi được liên hệ.'
            : 'Unable to deliver your message.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label className="contact-field">
        <span>{isVi ? 'Tên của bạn' : 'Your name'}</span>
        <input
          className="contact-input"
          type="text"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder={isVi ? 'Tên người gửi' : 'Builder name'}
          required
        />
      </label>

      <label className="contact-field">
        <span>{isVi ? 'Email công việc' : 'Work email'}</span>
        <input
          className="contact-input"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="operator@omdala.com"
          required
        />
      </label>

      <label className="contact-field">
        <span>{isVi ? 'Tổ chức hoặc node' : 'Organization or node'}</span>
        <input
          className="contact-input"
          type="text"
          value={form.organization}
          onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))}
          placeholder={isVi ? 'Tên tổ chức hoặc node của bạn' : 'Your organization or node'}
        />
      </label>

      <label className="contact-field">
        <span>{isVi ? 'Chủ đề' : 'Topic'}</span>
        <select
          className="contact-input"
          value={form.topic}
          onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
        >
          {OMDALA_CONTACT_TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </label>

      <label className="contact-field">
        <span>{isVi ? 'Nội dung' : 'Message'}</span>
        <textarea
          className="contact-input contact-textarea"
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          placeholder={isVi ? 'Mô tả bối cảnh, mục tiêu hoặc hỗ trợ bạn cần.' : 'Describe the context, goal, or support you need.'}
          required
        />
      </label>

      <button className="site-button site-button--primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? (isVi ? 'Đang gửi...' : 'Sending...') : isVi ? 'Gửi liên hệ' : 'Send message'}
      </button>

      <p className="contact-note">
        {isVi ? 'Email xác nhận sẽ được gửi từ ' : 'Confirmation email will be sent from '}
        <a href={`mailto:${OMDALA_INBOXES.hello}`}>{OMDALA_INBOXES.hello}</a>.{' '}
        {isVi ? 'Hỗ trợ vận hành trả lời từ ' : 'Operations support replies from '}
        <a href={`mailto:${OMDALA_INBOXES.support}`}>{OMDALA_INBOXES.support}</a>.
      </p>

      {status.message ? (
        <p className={`contact-status contact-status--${status.tone}`}>{status.message}</p>
      ) : null}
    </form>
  )
}
