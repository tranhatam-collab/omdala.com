import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { describeApiError, describeLiveError } from '../src/api/liveErrors.ts';
import { pickLocale } from '../src/i18n/pick.ts';

// FOR NATIVE-SPEAKER REVIEW: all Vietnamese copy was re-typed with diacritics (WO-TAI-17); meaning is unchanged.

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sources(path) : /\.tsx?$/u.test(name) ? [path] : [];
  });
}

// Pairs that are not Vietnamese copy: technical key=value text and sample e-mail addresses, and the planner's sample prompt (Vietnamese first by design).
const NOT_COPY = [/^\$\{/u, /=\$\{/u, /\bproviders=/u, /^you@domain\.com/u, /^Om, cho phòng con ngủ \/ Om,/u];

test('every "English / Vietnamese" string in the web source has Vietnamese with diacritics', () => {
  const offenders: string[] = [];
  for (const file of sources(new URL('../src', import.meta.url).pathname)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/(['"`])((?:(?!\1)[^\n\\]|\\.)* \/ (?:(?!\1)[^\n\\]|\\.)*)\1/gu)) {
      const pair = match[2]!;
      if (pair.split(' / ').length !== 2 || !/[A-Za-z]{3}/u.test(pair)) continue;
      if (NOT_COPY.some((pattern) => pattern.test(pair))) continue;
      const vietnamese = pair.split(' / ')[1]!;
      if (!/[à-ỹĐđ]/u.test(vietnamese)) offenders.push(`${file.split('/src/')[1]}: ${pair.slice(0, 80)}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('Vietnamese error messages from describeLiveError keep diacritics', () => {
  for (const code of ['network_error', 'quota_exhausted', 'rate_limited', '401', 'plan_upgrade_required', 'PLAN_CHANGE_REQUIRES_BILLING', 'x']) {
    const vietnamese = pickLocale(describeLiveError(code).message, 'vi');
    assert.match(vietnamese, /[à-ỹ]/u, code);
  }
});

test('API failures outside the live flow map to the bilingual messages, never to the raw code', () => {
  const fallback = 'Unable to load devices. Please try again. / Không thể tải danh sách thiết bị. Vui lòng thử lại.';
  for (const code of ['network_error', 'http_503', '502', 'canonical_session_bridge_unavailable']) {
    const message = describeApiError(code, fallback);
    assert.notEqual(message, fallback, code);
    assert.match(pickLocale(message, 'en'), /not reachable right now/u);
    assert.match(pickLocale(message, 'vi'), /chưa kết nối được/u);
    assert.doesNotMatch(message, new RegExp(code, 'u'));
  }
  assert.match(describeApiError('http_429', fallback), /busy right now/u);
  assert.match(describeApiError('quota_exhausted', fallback), /free practice time/u);
  assert.match(describeApiError('401', fallback), /sign in/iu);
  for (const code of ['not_mocked', 'weird_code', '', null, undefined, 'http_404']) {
    assert.equal(describeApiError(code, fallback), fallback, String(code));
  }
});
