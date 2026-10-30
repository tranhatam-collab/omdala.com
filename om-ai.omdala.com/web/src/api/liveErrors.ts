export type LiveErrorKind =
  | 'backend_unavailable'
  | 'quota_exhausted'
  | 'provider_busy'
  | 'sign_in_required'
  | 'plan_required'
  | 'billing_required'
  | 'unknown';

export type LiveErrorMessage = { kind: LiveErrorKind; message: string };

const MESSAGES: Record<LiveErrorKind, string> = {
  backend_unavailable:
    'Om AI is not reachable right now. Your session was not started and nothing was charged. Please try again in a few minutes. / Om AI tam thoi chua ket noi duoc. Phien chua bat dau va khong bi tinh phi. Vui long thu lai sau it phut.',
  quota_exhausted:
    'You have used today\'s free practice time. It resets tomorrow, or you can choose a plan that includes more time. / Ban da dung het thoi gian mien phi hom nay. Thoi gian se duoc lam moi vao ngay mai, hoac ban co the chon goi co them thoi gian.',
  provider_busy:
    'The AI teacher is busy right now. Please wait a moment and try again. / Giao vien AI dang ban. Vui long doi mot lat roi thu lai.',
  sign_in_required:
    'Please sign in to use live sessions. / Vui long dang nhap de dung phien truc tiep.',
  plan_required:
    'This feature is not included in your current plan. / Tinh nang nay chua co trong goi hien tai cua ban.',
  billing_required:
    'Plan changes are handled through billing and are not available here yet. / Viec doi goi duoc xu ly qua thanh toan va chua co o day.',
  unknown:
    'Something went wrong. Please try again. If it keeps happening, contact support. / Da co loi xay ra. Vui long thu lai. Neu van loi, hay lien he ho tro.',
};

const BACKEND_DOWN = new Set([
  'network_error',
  'canonical_session_bridge_unavailable',
  'omdala_identity_authority_unavailable',
  'ai_authority_unavailable',
  'service_unavailable',
  'timeout',
  'gateway_timeout',
  'bad_gateway',
]);
const QUOTA = new Set(['quota_exhausted', 'free_quota_exhausted', 'quota_exceeded', 'usage_limit_reached']);
const RATE_LIMITED = new Set(['rate_limited', 'provider_rate_limited', 'too_many_requests']);

/** Maps any API/client error code or HTTP status to a user-facing message; never returns the raw code. */
export function describeLiveError(code: string | number | null | undefined): LiveErrorMessage {
  const raw = String(code ?? '').trim();
  const key = raw.toLowerCase();
  let kind: LiveErrorKind = 'unknown';

  if (BACKEND_DOWN.has(key) || /^5\d\d$/.test(key) || key === 'http_502' || key === 'http_503' || key === 'http_504') {
    kind = 'backend_unavailable';
  } else if (QUOTA.has(key)) {
    kind = 'quota_exhausted';
  } else if (RATE_LIMITED.has(key) || key === '429' || key === 'http_429') {
    kind = 'provider_busy';
  } else if (key === 'unauthorized' || key === '401') {
    kind = 'sign_in_required';
  } else if (key === 'plan_upgrade_required') {
    kind = 'plan_required';
  } else if (key === 'plan_change_requires_billing') {
    kind = 'billing_required';
  }

  return { kind, message: MESSAGES[kind] };
}
