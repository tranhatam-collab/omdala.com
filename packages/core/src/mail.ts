export const OMDALA_WEB_ORIGIN = 'https://omdala.com'
export const OMDALA_APP_ORIGIN = 'https://app.omdala.com'
export const OMDALA_API_ORIGIN = 'https://api.omdala.com'
export const OMDALA_MAIL_API_ORIGIN = 'https://mail.iai.one/_mail'

export const OMDALA_INBOXES = {
  hello: 'hello@omdala.com',
  support: 'support@omdala.com',
  app: 'app@omdala.com',
  docs: 'docs@omdala.com',
  trust: 'trust@omdala.com',
  admin: 'admin@omdala.com',
  noreply: 'noreply@omdala.com',
} as const

export const OMDALA_CONTACT_TOPICS = [
  { value: 'general', label: 'General / Tổng quát' },
  { value: 'partnership', label: 'Partnership / Hợp tác' },
  { value: 'product', label: 'Product / Sản phẩm' },
  { value: 'support', label: 'Support / Hỗ trợ' },
  { value: 'trust', label: 'Trust / Niềm tin' },
] as const

export const OMDALA_ACCESS_ROLES = [
  { value: 'expert', label: 'Expert / Chuyên gia' },
  { value: 'host', label: 'Host / Điểm đón' },
  { value: 'community', label: 'Community / Cộng đồng' },
  { value: 'business', label: 'Business / Doanh nghiệp' },
  { value: 'operator', label: 'Operator / Điều phối' },
] as const

export type OmdalaContactTopic = (typeof OMDALA_CONTACT_TOPICS)[number]['value']
export type OmdalaAccessRole = (typeof OMDALA_ACCESS_ROLES)[number]['value']
