import assert from 'node:assert/strict';
import test from 'node:test';
import { assessText } from './live/moderation.js';

const flagged = (text: string) => assessText(text).requires_escalation;

function expectAll(label: string, samples: string[], expected: boolean) {
  for (const sample of samples) {
    assert.equal(flagged(sample), expected, `${label}: ${JSON.stringify(sample)}`);
  }
}

test('baseline phrases are still flagged', () => {
  expectAll('baseline', ['I want to kill myself', 'thinking about suicide', 'I feel suicidal', 'I might hurt myself', 'self-harm', 'self harm', 'selfharm'], true);
});

test('case folding and full-width letters do not bypass the screen', () => {
  expectAll('case', ['SuIcIdE', 'KILL MYSELF', 'Hurt MySelf', 'ｓｕｉｃｉｄｅ', 'ｋｉｌｌ　ｍｙｓｅｌｆ'], true);
});

test('invisible characters and Cyrillic look-alikes do not bypass the screen', () => {
  expectAll('invisible', ['sui​cide', 'kill‍ myself', 'su­icide', 'kill my﻿self'], true);
  expectAll('homoglyph', ['suiсide', 'kіll myself', 'hurt mуself'.replace('у', 'y')], true);
});

test('spacing and punctuation inside words do not bypass the screen', () => {
  expectAll(
    'spacing',
    ['s u i c i d e', 'k i l l   m y s e l f', 'su.i.cide', 's-u-i-c-i-d-e', 'su_icide', 'kill   myself', 'killmyself', 'hurtmyself', 'kill\nmyself', 'kill, myself', 'self_harm', 'h.u.r.t myself'],
    true,
  );
});

test('digit and symbol letter swaps do not bypass the screen', () => {
  expectAll('leet', ['su1c1de', 'k1ll myself', 'ki11 myself', 'kil1 myself', '$uicide', 'su!cide', 'hurt mys3lf', 'self h4rm', 'sui(ide'.replace('(', 'c')], true);
});

test('repeated letters do not bypass the screen', () => {
  expectAll('repeats', ['suiiiicide', 'killlll myself', 'hurrrt myself'], true);
});

test('Vietnamese diacritics, decomposed Unicode, and missing diacritics are all caught', () => {
  expectAll(
    'vietnamese',
    ['Tôi muốn chết', 'TÔI MUỐN CHẾT', 'nghĩ đến tự tử', 'tự sát', 'tụ̂ sát'.normalize('NFD'), 'toi muon chet', 'toi muon tu tu', 'nghi den tu sat', 'm u ố n c h ế t', 'muốnchết'],
    true,
  );
});

test('ordinary text, including Vietnamese "từ từ" (slowly), is not flagged', () => {
  expectAll(
    'benign',
    [
      '',
      'Please teach me the past tense',
      'I will skill myself up',
      'a skilled helper',
      'I need to kill my self-doubt before the exam',
      'Hãy nói từ từ thôi',
      'đi từ từ nhé',
      'tu tu ve nha',
      'noi tu tu thoi',
      'I have 3 apples and 1 pear',
      'Hello! How are you? Fine!',
      'suit and tie',
      'Thanks, see you at 5.',
    ],
    false,
  );
});

test('the response states it is a keyword screen and keeps its shape', () => {
  const hit = assessText('suicide');
  assert.deepEqual(hit, {
    safe: false,
    requires_escalation: true,
    safety_profile: 'wellness_safe_default',
    reason: 'high_risk_self_harm_signal',
    method: 'keyword_screen',
  });
  const miss = assessText('hello');
  assert.equal(miss.safe, true);
  assert.equal(miss.method, 'keyword_screen');
});

test('known limits: a keyword screen flags discussion and misses paraphrase', () => {
  assert.equal(flagged('We discussed suicide prevention in class'), true);
  assert.equal(flagged('I do not want to be alive any more'), false);
});

test('long inputs finish quickly', () => {
  const started = Date.now();
  assessText('a '.repeat(5000));
  assessText('s'.repeat(10_000));
  assert.ok(Date.now() - started < 1500);
});
