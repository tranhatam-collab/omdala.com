import type { Page, Route } from '@playwright/test';

type Handler = (route: Route) => Promise<void> | void;
export type Overrides = Record<string, Handler>;

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

export const ok = (route: Route, data: unknown) => json(route, 200, { data, error: null });
export const failWith = (route: Route, status: number, code?: string) =>
  json(route, status, { data: null, error: code ? { code, reason: code } : null });

const persona = {
  persona_id: 'teacher_english_01',
  display_name: 'Emily',
  role_type: 'english_teacher',
  category: 'english_teacher',
  primary_languages: ['en', 'vi'],
  supports_avatar: true,
  supports_voice_only: true,
  premium_required: false,
  safe_for_children: true,
};
const plans = [
  { plan_id: 'free', display_name: 'Free', daily_free_seconds: 1800, supports_avatar: false, supports_custom_personas: false },
  { plan_id: 'personal_pro', display_name: 'Personal Pro', daily_free_seconds: 0, supports_avatar: true, supports_custom_personas: true },
];
const usage = (remaining: number) => ({
  user_id: 'web_live_user_01',
  date_key: '2026-10-30',
  free_seconds_limit: 1800,
  free_seconds_used: 1800 - remaining,
  premium_seconds_used: 0,
  free_seconds_remaining: remaining,
  plan_id: 'free',
});
const profile = { user_id: 'web_live_user_01', timezone: 'Asia/Ho_Chi_Minh', target_language: 'en', correction_style: 'gentle', updated_at: '2026-10-30T00:00:00Z' };

/** Happy-path mock of the Om AI API. Keys of `overrides` are "METHOD /path-prefix". Returns the hosts seen. */
export async function mockApi(page: Page, overrides: Overrides = {}) {
  const hosts = new Set<string>();
  page.on('request', (request) => hosts.add(new URL(request.url()).host));

  await page.route(/\/(v1|v2)\//, async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const key = `${request.method()} ${pathname}`;
    const match = Object.keys(overrides)
      .sort((a, b) => b.length - a.length)
      .find((candidate) => key.startsWith(candidate));
    if (match) return overrides[match]!(route);

    if (key === 'GET /v2/live/personas') return ok(route, { items: [persona] });
    if (key.startsWith('GET /v2/live/personas/')) {
      return ok(route, { ...persona, supported_modes: ['voice_call', 'lesson_call'], safety_profile: 'education_safe_default', supported_providers: [] });
    }
    if (key === 'GET /v2/live/plans') return ok(route, { plans });
    if (key === 'GET /v2/live/usage/today') return ok(route, { usage: usage(1800) });
    if (key === 'GET /v2/live/memory/profile') return ok(route, { profile });
    if (key === 'PATCH /v2/live/memory/profile') return ok(route, { profile: { ...profile, display_name: 'Linh' } });
    if (key === 'POST /v2/live/sessions/create') {
      return ok(route, { session_id: 'live_session_e2e_01', status: 'blocked', usage: { free_seconds_remaining_today: 1800 } });
    }
    if (key === 'POST /v1/auth/magic-link/request') return ok(route, { sent: true });
    return failWith(route, 404, 'not_mocked');
  });
  return hosts;
}
