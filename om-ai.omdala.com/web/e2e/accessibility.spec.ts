import { expect, test, type Page } from '@playwright/test';
import { mockApi } from './support/mockApi';

// Structural accessibility checks without extra dependencies. Run for English and Vietnamese
// browser locales; the app is one bilingual page (EN / VI text side by side), so both locales must
// get the same, complete structure.

for (const locale of ['en-US', 'vi-VN']) {
  test.describe(`accessibility (${locale})`, () => {
    test.use({ locale });

    async function open(page: Page) {
      await mockApi(page);
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/plan=free/)).toBeVisible();
    }

    test('document has a valid lang, a title, and unique ids', async ({ page }) => {
      await open(page);
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toMatch(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/);
      expect((await page.title()).trim().length).toBeGreaterThan(0);
      const duplicates = await page.evaluate(() => {
        const seen = new Set<string>();
        const dupes: string[] = [];
        document.querySelectorAll('[id]').forEach((el) => {
          if (seen.has(el.id)) dupes.push(el.id);
          seen.add(el.id);
        });
        return dupes;
      });
      expect(duplicates).toEqual([]);
    });

    test('exactly one h1 and no skipped heading levels', async ({ page }) => {
      await open(page);
      const levels = await page.evaluate(() =>
        [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1])),
      );
      expect(levels.filter((level) => level === 1)).toHaveLength(1);
      expect(levels[0]).toBe(1);
      for (let i = 1; i < levels.length; i += 1) {
        expect(levels[i]! - levels[i - 1]!, `heading ${i} (h${levels[i]}) after h${levels[i - 1]}`).toBeLessThanOrEqual(1);
      }
    });

    test('landmarks: one main, one banner, one contentinfo, all content inside a landmark', async ({ page }) => {
      await open(page);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      const outside = await page.evaluate(() => {
        const landmarks = 'main,header,footer,nav,aside,[role=main],[role=banner],[role=contentinfo],[role=navigation]';
        return [...document.body.querySelectorAll('h1,h2,h3,button,input,select,textarea,a[href]')]
          .filter((el) => !el.closest(landmarks))
          .map((el) => `${el.tagName.toLowerCase()}:${(el.textContent ?? '').slice(0, 30)}`);
      });
      expect(outside).toEqual([]);
    });

    test('every form control and button has an accessible name (a placeholder alone does not count)', async ({ page }) => {
      await open(page);
      const unnamed = await page.evaluate(() => {
        const nameOf = (el: Element): string => {
          const aria = el.getAttribute('aria-label')?.trim();
          if (aria) return aria;
          const labelledby = el.getAttribute('aria-labelledby');
          if (labelledby) {
            const text = labelledby.split(/\s+/u).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
            if (text) return text;
          }
          const id = el.getAttribute('id');
          if (id) {
            const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
            if (label?.textContent?.trim()) return label.textContent.trim();
          }
          const wrapping = el.closest('label');
          if (wrapping?.textContent?.trim()) return wrapping.textContent.trim();
          if (el.tagName === 'BUTTON') return (el.textContent ?? '').trim();
          return el.getAttribute('title')?.trim() ?? '';
        };
        return [...document.querySelectorAll('input,select,textarea,button')]
          .filter((el) => (el as HTMLInputElement).type !== 'hidden')
          .filter((el) => nameOf(el) === '')
          .map((el) => `${el.tagName.toLowerCase()}[placeholder=${el.getAttribute('placeholder') ?? ''}]`);
      });
      expect(unnamed).toEqual([]);
    });

    test('images have alt text and links have names', async ({ page }) => {
      await open(page);
      const problems = await page.evaluate(() => [
        ...[...document.querySelectorAll('img')].filter((img) => !img.hasAttribute('alt')).map(() => 'img without alt'),
        ...[...document.querySelectorAll('a[href]')]
          .filter((a) => !(a.textContent ?? '').trim() && !a.getAttribute('aria-label'))
          .map(() => 'link without name'),
      ]);
      expect(problems).toEqual([]);
    });

    test('keyboard focus is visible on every focusable control', async ({ page }) => {
      await open(page);
      const count = await page.evaluate(
        () => document.querySelectorAll('button:not([disabled]),input:not([type=hidden]),select,textarea,a[href],[tabindex]:not([tabindex="-1"])').length,
      );
      expect(count).toBeGreaterThan(5);
      const invisible: string[] = [];
      for (let i = 0; i < count; i += 1) {
        await page.keyboard.press('Tab');
        const state = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const style = getComputedStyle(el);
          const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
          const shadow = style.boxShadow !== 'none' && style.boxShadow !== '';
          const border = style.borderColor;
          return { label: `${el.tagName.toLowerCase()}:${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 24)}`, visible: outline || shadow, border };
        });
        if (state && !state.visible) invisible.push(state.label);
      }
      expect(invisible).toEqual([]);
    });
  });
}

// ---------------------------------------------------------------------------------------------
// Language: <html lang> follows the active locale from the first render and on every switch;
// text in the other language carries its own lang attribute.
// ---------------------------------------------------------------------------------------------

async function openPage(page: Page, url = '/') {
  await mockApi(page);
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

const htmlLang = (page: Page) => page.locator('html').getAttribute('lang');

test.describe('locale', () => {
  test.use({ locale: 'en-US' });

  test('first render uses the browser language, and ?lang= overrides it', async ({ page }) => {
    await openPage(page);
    expect(await htmlLang(page)).toBe('en');

    await openPage(page, '/?lang=vi');
    expect(await htmlLang(page)).toBe('vi');
    await expect(page.getByRole('heading', { level: 2, name: /Đăng nhập/ })).toBeVisible();
  });

  test('switching language updates <html lang> and the page text, and the choice is remembered', async ({ page }) => {
    await openPage(page);
    const group = page.getByRole('group', { name: 'Language' });
    await expect(group.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');

    await group.getByRole('button', { name: 'Tiếng Việt' }).click();
    expect(await htmlLang(page)).toBe('vi');
    await expect(page.getByRole('heading', { level: 2, name: /Đăng nhập/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Sign in/ })).toHaveCount(0);
    await expect(page.getByRole('group', { name: /Ngôn ngữ/ }).getByRole('button', { name: 'Tiếng Việt' })).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await htmlLang(page)).toBe('vi');

    await page.getByRole('group', { name: /Ngôn ngữ/ }).getByRole('button', { name: 'English' }).click();
    expect(await htmlLang(page)).toBe('en');
    await expect(page.getByRole('heading', { level: 2, name: /Sign in/ })).toBeVisible();
  });

  test('the language buttons are labelled in their own language', async ({ page }) => {
    await openPage(page);
    await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('button', { name: 'Tiếng Việt' })).toHaveAttribute('lang', 'vi');
  });

  test('in Vietnamese no English-only control or heading is left without its own lang', async ({ page }) => {
    await openPage(page);
    const read = () =>
      page.evaluate(() => {
        const own = (el: Element) => el.closest('[lang]') !== document.documentElement && el.closest('[lang]') !== null;
        return [...document.querySelectorAll('h1,h2,h3,button,a,label')]
          .filter((el) => !own(el))
          .map((el) => (el.textContent ?? '').replace(/\s+/gu, ' ').trim())
          .filter(Boolean);
      });
    const english = await read();
    await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'Tiếng Việt' }).click();
    const vietnamese = await read();
    const brand = new Set(['Om AI']);
    const shared = vietnamese.filter((text) => english.includes(text) && !brand.has(text));
    expect(shared, 'texts identical in both languages').toEqual([]);
  });

  test('text in the other language carries lang="en" while Vietnamese is active', async ({ page }) => {
    await openPage(page, '/?lang=vi');
    await expect(page.getByText(/plan=free/)).toBeVisible();
    const tagged = await page.evaluate(() => {
      const el = [...document.querySelectorAll('p')].find((p) => /plan=free/u.test(p.textContent ?? ''));
      return el?.closest('[lang]')?.getAttribute('lang');
    });
    expect(tagged).toBe('en');
  });
});
