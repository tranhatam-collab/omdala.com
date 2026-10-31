import { expect, test, type Page } from '@playwright/test';
import { mockApi } from './support/mockApi';

// WCAG 2.x contrast for text on the brand colours. Backgrounds are resolved through the ancestors
// (alpha composited, gradient stops each tested), and the worst case must pass: 4.5:1 for normal
// text, 3:1 for large text (>= 24px, or >= 18.66px and bold).

type Failure = { text: string; ratio: number; needed: number; color: string; background: string; selector: string };

async function measure(page: Page): Promise<{ checked: number; failures: Failure[] }> {
  return page.evaluate(() => {
    type RGBA = [number, number, number, number];
    const parse = (value: string): RGBA | null => {
      const m = /rgba?\(([^)]+)\)/u.exec(value);
      if (!m) return null;
      const parts = m[1]!.split(/[,\s/]+/u).filter(Boolean).map(Number);
      return [parts[0]!, parts[1]!, parts[2]!, parts[3] ?? 1];
    };
    const over = (top: RGBA, bottom: RGBA): RGBA => {
      const a = top[3] + bottom[3] * (1 - top[3]);
      if (a === 0) return [0, 0, 0, 0];
      const mix = (i: number) => (top[i]! * top[3] + bottom[i]! * bottom[3] * (1 - top[3])) / a;
      return [mix(0), mix(1), mix(2), a];
    };
    const lum = ([r, g, b]: RGBA) => {
      const f = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a: RGBA, b: RGBA) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi! + 0.05) / (lo! + 0.05);
    };
    const WHITE: RGBA = [255, 255, 255, 1];

    // Every colour that can sit behind this element.
    const backdrops = (el: Element | null): RGBA[] => {
      if (!el) return [WHITE];
      const parent = backdrops(el.parentElement);
      const style = getComputedStyle(el);
      let layers: RGBA[] = parent;
      const gradient = style.backgroundImage !== 'none' ? [...style.backgroundImage.matchAll(/rgba?\([^)]+\)/gu)].map((m) => parse(m[0])!) : [];
      const base = parse(style.backgroundColor);
      if (base && base[3] > 0) layers = layers.map((below) => over(base, below));
      if (gradient.length) layers = gradient.flatMap((stop) => layers.map((below) => over(stop, below)));
      return layers;
    };

    const failures: Failure[] = [];
    let checked = 0;
    const candidates = document.querySelectorAll('h1,h2,h3,p,li,span,a,button,label,code,footer,option');
    candidates.forEach((el) => {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3 && (n.textContent ?? '').trim()).map((n) => n.textContent!.trim()).join(' ');
      if (!own) return;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || (el as HTMLElement).offsetParent === null && style.position !== 'fixed') return;
      const fg = parse(style.color);
      if (!fg) return;
      const size = parseFloat(style.fontSize);
      const bold = Number(style.fontWeight) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const needed = large ? 3 : 4.5;
      const worst = backdrops(el).reduce(
        (acc, bg) => {
          const text = over(fg, bg);
          const r = ratio(text, bg);
          return r < acc.ratio ? { ratio: r, bg } : acc;
        },
        { ratio: Infinity, bg: WHITE },
      );
      checked += 1;
      if (worst.ratio < needed) {
        failures.push({
          text: own.slice(0, 40),
          ratio: Math.round(worst.ratio * 100) / 100,
          needed,
          color: style.color,
          background: `rgb(${worst.bg.slice(0, 3).map(Math.round).join(',')})`,
          selector: `${el.tagName.toLowerCase()}.${(el as HTMLElement).className}`,
        });
      }
    });
    return { checked, failures };
  });
}

for (const locale of ['en-US', 'vi-VN']) {
  test(`text meets WCAG contrast on the brand colours (${locale})`, async ({ browser }) => {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await mockApi(page);
    await page.goto('/');
    await expect(page.getByText(/plan=free/)).toBeVisible();
    const { checked, failures } = await measure(page);
    expect(checked).toBeGreaterThan(40);
    expect(failures).toEqual([]);
    await context.close();
  });
}

test('the checker itself catches low contrast (sanity)', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByText(/plan=free/)).toBeVisible();
  await page.addStyleTag({ content: '.cta-primary, .chip, h2 { color: #e8e8e8 !important; }' });
  const { failures } = await measure(page);
  expect(failures.length).toBeGreaterThan(0);
  expect(failures.some((f) => f.ratio < 2)).toBeTruthy();
});
