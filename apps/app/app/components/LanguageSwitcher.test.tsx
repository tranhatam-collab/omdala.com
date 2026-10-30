import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/dashboard/";

vi.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
vi.mock("@omdala/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@omdala/core")>();
  // Simulate R-19: only EN and VI are ready.
  return { ...actual, isReadyLanguage: (language: string) => language === "en" || language === "vi" };
});

import { LanguageSwitcher } from "./LanguageSwitcher";

afterEach(() => {
  cleanup();
  mockPathname = "/dashboard/";
});

describe("LanguageSwitcher", () => {
  it("renders ready languages as links and the rest as disabled, non-link items", () => {
    render(<LanguageSwitcher />);
    for (const label of ["EN", "VI"]) {
      const link = screen.getByText(label);
      expect(link.tagName).toBe("A");
      expect(link.getAttribute("href")).toBeTruthy();
      expect(link.getAttribute("aria-disabled")).toBeNull();
    }
    for (const label of ["ZH", "ES", "JA", "KO"]) {
      const item = screen.getByText(label);
      expect(item.tagName).toBe("SPAN");
      expect(item.getAttribute("href")).toBeNull();
      expect(item.getAttribute("aria-disabled")).toBe("true");
      expect(item.className).toContain("language-switcher__item--disabled");
      expect(item.getAttribute("title")).toBeTruthy();
    }
  });

  it("renders nothing on /workspace, where the IDE has its own language toggle", () => {
    mockPathname = "/workspace/";
    const { container } = render(<LanguageSwitcher />);
    expect(container.innerHTML).toBe("");
  });
});
