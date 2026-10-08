'use client'

import { OMDALA_API_ORIGIN, OMDALA_CONTACT_TOPICS, OMDALA_INBOXES } from '../../../../packages/core/src/mail'
import { pickLanguageValue, type OmdalaLanguage } from '@omdala/core'
import type { FormEvent } from 'react'
import { useState } from 'react'

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

const topicLabels: Record<
  (typeof OMDALA_CONTACT_TOPICS)[number]['value'],
  Record<OmdalaLanguage, string>
> = {
  general: {
    en: 'General',
    vi: 'Tổng quát',
    zh: '综合',
    es: 'General',
    ja: '一般',
    ko: '일반',
  },
  partnership: {
    en: 'Partnership',
    vi: 'Hợp tác',
    zh: '合作',
    es: 'Alianzas',
    ja: 'パートナーシップ',
    ko: '파트너십',
  },
  product: {
    en: 'Product',
    vi: 'Sản phẩm',
    zh: '产品',
    es: 'Producto',
    ja: 'プロダクト',
    ko: '제품',
  },
  support: {
    en: 'Support',
    vi: 'Hỗ trợ',
    zh: '支持',
    es: 'Soporte',
    ja: 'サポート',
    ko: '지원',
  },
  trust: {
    en: 'Trust',
    vi: 'Niềm tin',
    zh: '信任',
    es: 'Confianza',
    ja: '信頼',
    ko: '신뢰',
  },
}

export function ContactForm({ language }: { language: OmdalaLanguage }) {
  const [form, setForm] = useState<ContactState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ message: string; tone: StatusTone }>({
    message: '',
    tone: 'idle',
  })
  const copy = {
    sending: { en: 'Sending your message...', vi: 'Đang gửi liên hệ...', zh: '正在发送你的消息...', es: 'Enviando tu mensaje...', ja: 'メッセージを送信中...', ko: '메시지를 보내는 중...' },
    sent: { en: `Sent. The team will reply from ${OMDALA_INBOXES.support}.`, vi: `Đã gửi. Đội ngũ sẽ phản hồi từ ${OMDALA_INBOXES.support}.`, zh: `已发送。团队将从 ${OMDALA_INBOXES.support} 回复。`, es: `Enviado. El equipo responderá desde ${OMDALA_INBOXES.support}.`, ja: `送信完了。チームは ${OMDALA_INBOXES.support} から返信します。`, ko: `전송되었습니다. 팀이 ${OMDALA_INBOXES.support} 에서 회신합니다.` },
    sendError: { en: 'Unable to deliver your message.', vi: 'Không gửi được liên hệ.', zh: '无法发送你的消息。', es: 'No se pudo enviar tu mensaje.', ja: 'メッセージを送信できません。', ko: '메시지를 보낼 수 없습니다.' },
    name: { en: 'Your name', vi: 'Tên của bạn', zh: '你的姓名', es: 'Tu nombre', ja: 'あなたの名前', ko: '이름' },
    namePlaceholder: { en: 'Builder name', vi: 'Tên người gửi', zh: '发送者姓名', es: 'Nombre del remitente', ja: '送信者名', ko: '보내는 사람 이름' },
    email: { en: 'Work email', vi: 'Email công việc', zh: '工作邮箱', es: 'Correo laboral', ja: '勤務先メール', ko: '업무 이메일' },
    organization: { en: 'Organization or node', vi: 'Tổ chức hoặc nút', zh: '组织或节点', es: 'Organización o nodo', ja: '組織またはノード', ko: '조직 또는 노드' },
    organizationPlaceholder: { en: 'Your organization or node', vi: 'Tên tổ chức hoặc nút của bạn', zh: '你的组织或节点', es: 'Tu organización o nodo', ja: 'あなたの組織またはノード', ko: '당신의 조직 또는 노드' },
    topic: { en: 'Topic', vi: 'Chủ đề', zh: '主题', es: 'Tema', ja: 'トピック', ko: '주제' },
    message: { en: 'Message', vi: 'Nội dung', zh: '内容', es: 'Mensaje', ja: 'メッセージ', ko: '메시지' },
    messagePlaceholder: { en: 'Describe the context, goal, or support you need.', vi: 'Mô tả bối cảnh, mục tiêu hoặc hỗ trợ bạn cần.', zh: '请描述背景、目标或你需要的支持。', es: 'Describe el contexto, el objetivo o el soporte que necesitas.', ja: '状況、目的、必要なサポートを説明してください。', ko: '상황, 목표 또는 필요한 지원을 설명하세요.' },
    sendingShort: { en: 'Sending...', vi: 'Đang gửi...', zh: '发送中...', es: 'Enviando...', ja: '送信中...', ko: '전송 중...' },
    submit: { en: 'Send message', vi: 'Gửi liên hệ', zh: '发送消息', es: 'Enviar mensaje', ja: 'メッセージ送信', ko: '메시지 보내기' },
    confirmation: { en: 'Confirmation email will be sent from ', vi: 'Email xác nhận sẽ được gửi từ ', zh: '确认邮件将从以下地址发送：', es: 'El correo de confirmación se enviará desde ', ja: '確認メールの送信元は ', ko: '확인 이메일은 다음 주소에서 발송됩니다 ' },
    support: { en: 'Operations support replies from ', vi: 'Hỗ trợ vận hành trả lời từ ', zh: '运营支持将从以下地址回复：', es: 'Soporte operativo responde desde ', ja: '運用サポートの返信元は ', ko: '운영 지원 회신 주소는 ' },
  } as const

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({
      tone: 'info',
      message: pickLanguageValue(language, copy.sending),
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
        throw new Error(payload.error?.message ?? pickLanguageValue(language, copy.sendError))
      }

      setForm(initialState)
      setStatus({
        tone: 'success',
        message: pickLanguageValue(language, copy.sent),
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : pickLanguageValue(language, copy.sendError),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label className="contact-field">
        <span>{pickLanguageValue(language, copy.name)}</span>
        <input
          className="contact-input"
          type="text"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder={pickLanguageValue(language, copy.namePlaceholder)}
          required
        />
      </label>

      <label className="contact-field">
        <span>{pickLanguageValue(language, copy.email)}</span>
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
        <span>{pickLanguageValue(language, copy.organization)}</span>
        <input
          className="contact-input"
          type="text"
          value={form.organization}
          onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))}
          placeholder={pickLanguageValue(language, copy.organizationPlaceholder)}
        />
      </label>

      <label className="contact-field">
        <span>{pickLanguageValue(language, copy.topic)}</span>
        <select
          className="contact-input"
          value={form.topic}
          onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
        >
          {OMDALA_CONTACT_TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {pickLanguageValue(language, topicLabels[topic.value])}
            </option>
          ))}
        </select>
      </label>

      <label className="contact-field">
        <span>{pickLanguageValue(language, copy.message)}</span>
        <textarea
          className="contact-input contact-textarea"
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          placeholder={pickLanguageValue(language, copy.messagePlaceholder)}
          required
        />
      </label>

      <button className="site-button site-button--primary" type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? pickLanguageValue(language, copy.sendingShort)
          : pickLanguageValue(language, copy.submit)}
      </button>

      <p className="contact-note">
        {pickLanguageValue(language, copy.confirmation)}
        <a href={`mailto:${OMDALA_INBOXES.hello}`}>{OMDALA_INBOXES.hello}</a>.{' '}
        {pickLanguageValue(language, copy.support)}
        <a href={`mailto:${OMDALA_INBOXES.support}`}>{OMDALA_INBOXES.support}</a>.
      </p>

      {status.message ? (
        <p className={`contact-status contact-status--${status.tone}`}>{status.message}</p>
      ) : null}
    </form>
  )
}
