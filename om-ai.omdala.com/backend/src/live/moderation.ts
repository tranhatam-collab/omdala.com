export const MODERATION_MAX_TEXT_LENGTH = 10_000;

// Keyword screen only. It is NOT a safety classifier: it cannot understand intent, context,
// paraphrase, or languages beyond the phrases below. See docs/OMAI_MODERATION_SCOPE.md.
const ENGLISH_PHRASES = ['self harm', 'selfharm', 'kill myself', 'suicide', 'suicidal', 'hurt myself'];
// Matched with Vietnamese diacritics kept, so "tự tử" (suicide) never matches "từ từ" (slowly).
const VIETNAMESE_PHRASES = ['tự tử', 'tự sát', 'muốn chết'];
// Matched after diacritics are stripped; these have no common innocent reading.
const VIETNAMESE_STRIPPED_PHRASES = ['tu sat', 'muon chet'];
// "tu tu" is also plain "từ từ"; only counted without diacritics and after a risk verb.
const VIETNAMESE_AMBIGUOUS = /(^| )(muon|nghi den|dinh) tu tu( |$)/;

export type ModerationAssessment = {
  safe: boolean;
  requires_escalation: boolean;
  safety_profile: 'wellness_safe_default' | 'education_safe_default';
  reason: 'high_risk_self_harm_signal' | 'no_high_risk_signal';
  method: 'keyword_screen';
};

const INVISIBLE = /[­​-‏‪-‮⁠﻿]/gu;
const HOMOGLYPHS: Record<string, string> = {
  а: 'a', е: 'e', о: 'o', с: 'c', р: 'p', і: 'i', х: 'x', ѕ: 's', ј: 'j',
};
const LEET: Record<string, string> = { '0': 'o', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i' };

function fold(text: string): string {
  return text
    .normalize('NFKC')
    .replace(INVISIBLE, '')
    .toLowerCase()
    .replace(/[аеосріхѕј]/gu, (ch) => HOMOGLYPHS[ch] ?? ch);
}

function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gu, 'd');
}

function leet(text: string, one: 'i' | 'l'): string {
  return text.replace(/[03457@$!1]/gu, (ch) => (ch === '1' ? one : (LEET[ch] ?? ch)));
}

/** Letters or digits separated only by punctuation ("su.i.cide", "self-harm") are joined. */
function joinIntraWord(text: string): string {
  return text.replace(/(?<=[\p{L}\p{N}])[.\-_*'`~|/\\](?=[\p{L}\p{N}])/gu, '');
}

function tokens(text: string): string[] {
  return text.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean);
}

/** Runs of four or more single letters ("k i l l m y s e l f") become one token. */
function joinLetterRuns(list: string[]): string {
  const runs: string[] = [];
  let run = '';
  const flush = () => {
    if (run.length >= 4) runs.push(run);
    run = '';
  };
  for (const token of list) {
    if (token.length === 1 && /\p{L}/u.test(token)) run += token;
    else flush();
  }
  flush();
  return runs.join(' ');
}

const squeeze = (text: string) => text.replace(/(\p{L})\1+/gu, '$1');
const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasPhrase = (haystack: string, phrase: string) =>
  new RegExp(`(^| )${escapeRe(squeeze(phrase))}`, 'u').test(haystack);

function matchesAny(text: string, phrases: string[]): boolean {
  const spaced = tokens(joinIntraWord(text));
  const joined = squeeze(spaced.join(' '));
  if (phrases.some((phrase) => hasPhrase(joined, phrase) || hasPhrase(joined, phrase.replace(/ /g, '')))) return true;
  const runs = squeeze(joinLetterRuns(tokens(text)));
  return runs.length > 0 && phrases.some((phrase) => hasPhrase(runs, phrase.replace(/ /g, '')));
}

function flagged(raw: string): boolean {
  const folded = fold(raw);
  const stripped = stripDiacritics(folded);
  const hadDiacritics = /\p{M}|đ/u.test(folded.normalize('NFD'));

  // Diacritics kept: Vietnamese phrases.
  if (matchesAny(folded.normalize('NFC'), VIETNAMESE_PHRASES)) return true;

  const variants = [stripped, leet(stripped, 'i'), leet(stripped, 'l')];
  for (const variant of variants) {
    if (matchesAny(variant, [...ENGLISH_PHRASES, ...VIETNAMESE_STRIPPED_PHRASES])) return true;
  }

  if (!hadDiacritics) {
    for (const variant of variants) {
      if (VIETNAMESE_AMBIGUOUS.test(tokens(joinIntraWord(variant)).join(' '))) return true;
    }
  }
  return false;
}

/** Local, deterministic keyword screen. It never calls a provider. */
export function assessText(text: string): ModerationAssessment {
  const isFlagged = flagged(text);
  return {
    safe: !isFlagged,
    requires_escalation: isFlagged,
    safety_profile: isFlagged ? 'wellness_safe_default' : 'education_safe_default',
    reason: isFlagged ? 'high_risk_self_harm_signal' : 'no_high_risk_signal',
    method: 'keyword_screen',
  };
}
