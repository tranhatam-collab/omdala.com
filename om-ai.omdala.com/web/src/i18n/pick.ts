export type Locale = 'en' | 'vi';

const SEPARATOR = ' / ';

/**
 * Copy is written as "English / Tiếng Việt". Pick one side. A trailing colon or space on the
 * Vietnamese side ("Label / Nhãn: ") is kept on the English side so a value can follow. Strings
 * with no separator, or with more than one (technical text such as "a=1 / b=2 / c=3"), are returned as is.
 */
export function pickLocale(text: string, locale: Locale): string {
  const index = text.indexOf(SEPARATOR);
  if (index < 0 || text.indexOf(SEPARATOR, index + SEPARATOR.length) >= 0) return text;
  const english = text.slice(0, index);
  const vietnamese = text.slice(index + SEPARATOR.length);
  if (locale === 'vi') return vietnamese;
  const tail = /[:\s]+$/u.exec(vietnamese)?.[0] ?? '';
  return tail && !english.endsWith(tail) ? english.replace(/\s+$/u, '') + tail : english;
}
