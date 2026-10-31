import assert from 'node:assert/strict';
import test from 'node:test';
import { pickLocale } from '../src/i18n/pick.ts';

test('picks the side of "English / Tieng Viet" for the active locale', () => {
  assert.equal(pickLocale('Create session / Tao phien', 'en'), 'Create session');
  assert.equal(pickLocale('Create session / Tao phien', 'vi'), 'Tao phien');
});

test('a trailing colon or space on the Vietnamese side is kept on the English side so a value can follow', () => {
  assert.equal(pickLocale('Status / Trang thai: ', 'en'), 'Status: ');
  assert.equal(pickLocale('Status / Trang thai: ', 'vi'), 'Trang thai: ');
  assert.equal(pickLocale('Planner error / Loi planner: ', 'en'), 'Planner error: ');
});

test('sentences keep their own punctuation', () => {
  assert.equal(pickLocale('Try again. / Thu lai.', 'en'), 'Try again.');
  assert.equal(pickLocale('Try again. / Thu lai.', 'vi'), 'Thu lai.');
});

test('text without a separator, or with several (technical text), is returned unchanged', () => {
  for (const locale of ['en', 'vi'] as const) {
    assert.equal(pickLocale('Om AI', locale), 'Om AI');
    assert.equal(pickLocale('plan=free / free=0/1800 / remaining=1800', locale), 'plan=free / free=0/1800 / remaining=1800');
    assert.equal(pickLocale('', locale), '');
    assert.equal(pickLocale('a/b', locale), 'a/b');
  }
});

test('every error message from describeLiveError has exactly one separator and both sides non-empty', async () => {
  const { describeLiveError } = await import('../src/api/liveErrors.ts');
  for (const code of ['network_error', 'quota_exhausted', 'rate_limited', '401', 'plan_upgrade_required', 'PLAN_CHANGE_REQUIRES_BILLING', 'x']) {
    const { message } = describeLiveError(code);
    const en = pickLocale(message, 'en');
    const vi = pickLocale(message, 'vi');
    assert.ok(en.length > 10 && vi.length > 10 && en !== vi, code);
    assert.notEqual(en, message, code);
  }
});
