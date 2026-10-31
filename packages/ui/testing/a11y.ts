// Dependency-free accessibility checks for Playwright specs (DOM queries and the browser's own
// computed styles). Type-only import: this file is loaded by each app's e2e suite.
import type { Page } from "@playwright/test";

export type A11yFinding = { rule: string; detail: string };

export type A11yOptions = {
  /** Expected value of <html lang>. */
  lang: string;
  /** How many keyboard Tab stops to check for a visible focus indicator. */
  focusStops?: number;
};

/** Runs the page-level checks and returns every finding (an empty list means all passed). */
export async function collectA11yFindings(page: Page, options: A11yOptions): Promise<A11yFinding[]> {
  const findings = await page.evaluate((expectedLang) => {
    const out: { rule: string; detail: string }[] = [];
    const add = (rule: string, detail: string) => out.push({ rule, detail });
    const describe = (el: Element) => {
      const id = el.id ? `#${el.id}` : "";
      const cls = typeof el.className === "string" && el.className ? `.${el.className.split(/\s+/)[0]}` : "";
      return `<${el.tagName.toLowerCase()}${id}${cls}>`;
    };
    const isVisible = (el: Element) => {
      const style = getComputedStyle(el);
      const rect = (el as HTMLElement).getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && (rect.width > 0 || rect.height > 0);
    };
    const textOf = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
    const accessibleName = (el: Element): string => {
      const labelledBy = el.getAttribute("aria-labelledby");
      if (labelledBy) {
        const text = labelledBy.split(/\s+/).map((id) => textOf(document.getElementById(id))).join(" ").trim();
        if (text) return text;
      }
      const aria = el.getAttribute("aria-label")?.trim();
      if (aria) return aria;
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        const labels = Array.from(el.labels ?? []);
        const labelText = labels.map((label) => textOf(label)).join(" ").trim();
        if (labelText) return labelText;
      }
      if (el instanceof HTMLInputElement && ["button", "submit", "reset"].includes(el.type) && el.value) return el.value;
      const inner = textOf(el);
      if (inner) return inner;
      const img = el.querySelector("img[alt]");
      if (img?.getAttribute("alt")?.trim()) return img.getAttribute("alt")!.trim();
      return el.getAttribute("title")?.trim() ?? "";
    };

    // lang
    const lang = document.documentElement.getAttribute("lang");
    if (lang !== expectedLang) add("lang", `html lang is ${JSON.stringify(lang)}, expected ${JSON.stringify(expectedLang)}`);

    // one h1, heading order
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).filter(isVisible);
    const h1s = headings.filter((h) => h.tagName === "H1");
    if (h1s.length !== 1) add("one-h1", `${h1s.length} visible h1 elements`);
    let previous = 0;
    for (const heading of headings) {
      const level = Number(heading.tagName[1]);
      if (previous === 0 && level !== 1) add("heading-order", `first heading is ${heading.tagName}, not H1`);
      if (previous && level > previous + 1) add("heading-order", `${heading.tagName} follows H${previous} (${JSON.stringify(textOf(heading).slice(0, 40))})`);
      if (!textOf(heading)) add("heading-name", `${describe(heading)} is empty`);
      previous = level;
    }

    // landmarks
    const mains = Array.from(document.querySelectorAll("main,[role=main]")).filter(isVisible);
    if (mains.length !== 1) add("landmark-main", `${mains.length} visible main landmarks`);
    const navs = Array.from(document.querySelectorAll("nav,[role=navigation]")).filter(isVisible);
    if (navs.length > 1) {
      for (const nav of navs) {
        if (!nav.getAttribute("aria-label") && !nav.getAttribute("aria-labelledby")) {
          add("landmark-nav-name", `${describe(nav)} is one of ${navs.length} navigation landmarks without a name`);
        }
      }
    }

    // images
    for (const img of Array.from(document.querySelectorAll("img"))) {
      if (!img.hasAttribute("alt") && img.getAttribute("role") !== "presentation" && img.getAttribute("aria-hidden") !== "true") {
        add("img-alt", `${describe(img)} (${img.getAttribute("src")?.slice(0, 60)}) has no alt attribute`);
      }
    }

    // form controls
    const controls = Array.from(document.querySelectorAll("input,select,textarea")).filter((el) => {
      if (!isVisible(el)) return false;
      return !(el instanceof HTMLInputElement && ["hidden", "submit", "button", "reset", "image"].includes(el.type));
    });
    for (const control of controls) {
      if (!accessibleName(control)) add("form-label", `${describe(control)} has no label or aria-label`);
    }

    // links and buttons need a name
    for (const el of Array.from(document.querySelectorAll("a[href],button,[role=button]")).filter(isVisible)) {
      if (!accessibleName(el)) add("control-name", `${describe(el)} has no accessible name`);
    }
    return out;
  }, options.lang);

  // visible keyboard focus: tab through the first stops and read the computed focus styles
  const stops = options.focusStops ?? 8;
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let index = 0; index < stops; index += 1) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || el.tagName.toLowerCase().startsWith("nextjs-")) return null; // Next dev overlay
      const style = getComputedStyle(el);
      const outline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
      const shadow = style.boxShadow !== "none";
      const name = `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}> ${(el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 30)}`;
      return { name, visible: outline || shadow };
    });
    if (stop && !stop.visible) findings.push({ rule: "focus-visible", detail: `${stop.name} shows no focus indicator` });
  }
  return findings;
}

export function formatFindings(findings: A11yFinding[]): string {
  return findings.map((finding) => `[${finding.rule}] ${finding.detail}`).join("\n");
}
