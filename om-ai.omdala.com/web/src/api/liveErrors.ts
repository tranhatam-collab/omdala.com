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
    'Om AI is not reachable right now. Your session was not started and nothing was charged. Please try again in a few minutes. / Om AI tạm thời chưa kết nối được. Phiên chưa bắt đầu và không bị tính phí. Vui lòng thử lại sau ít phút.',
  quota_exhausted:
    'You have used today\'s free practice time. It resets tomorrow, or you can choose a plan that includes more time. / Bạn đã dùng hết thời gian luyện tập miễn phí hôm nay. Thời gian sẽ được làm mới vào ngày mai, hoặc bạn có thể chọn gói có thêm thời gian.',
  provider_busy:
    'The AI teacher is busy right now. Please wait a moment and try again. / Giáo viên AI đang bận. Vui lòng đợi một lát rồi thử lại.',
  sign_in_required:
    'Please sign in to use live sessions. / Vui lòng đăng nhập để dùng phiên trực tiếp.',
  plan_required:
    'This feature is not included in your current plan. / Tính năng này chưa có trong gói hiện tại của bạn.',
  billing_required:
    'Plan changes are handled through billing and are not available here yet. / Việc đổi gói được xử lý qua thanh toán và hiện chưa có ở đây.',
  unknown:
    'Something went wrong. Please try again. If it keeps happening, contact support. / Đã có lỗi xảy ra. Vui lòng thử lại. Nếu vẫn lỗi, hãy liên hệ hỗ trợ.',
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

const NEUTRAL_UNAVAILABLE =
  'Om AI is not reachable right now. Please try again in a few minutes. / Om AI tạm thời chưa kết nối được. Vui lòng thử lại sau ít phút.';

/**
 * Message for a failed call outside the live-session flow (devices, scenes, planner, ...).
 * A recognised cause (service down, busy, quota, sign-in, plan) gets its bilingual message;
 * anything else keeps the caller's own specific message. The raw code is never shown.
 */
export function describeApiError(code: string | number | null | undefined, fallback: string): string {
  const described = describeLiveError(code);
  if (described.kind === 'unknown') return fallback;
  if (described.kind === 'backend_unavailable') return NEUTRAL_UNAVAILABLE;
  return described.message;
}
