import { test, expect } from "@playwright/test";

test.describe("OMCODE Critical Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("omcode:lang", "vi");
      localStorage.setItem("omcode:terms:accepted:v1", "true");

      const makeFileHandle = (name: string, initialContent: string) => {
        let content = initialContent;
        return {
          kind: "file" as const,
          name,
          async getFile() {
            return {
              name,
              async text() {
                return content;
              },
            };
          },
          async createWritable() {
            return {
              async write(nextContent: string) {
                content = nextContent;
              },
              async close() {},
            };
          },
        };
      };

      const makeDirectoryHandle = (
        name: string,
        children: Record<string, ReturnType<typeof makeFileHandle> | ReturnType<typeof makeDirectoryHandle>>,
      ) => {
        const entries = new Map(Object.entries(children));
        return {
          kind: "directory" as const,
          name,
          async *entries() {
            for (const entry of entries.entries()) {
              yield entry;
            }
          },
          async getDirectoryHandle(entryName: string, options?: { create?: boolean }) {
            const entry = entries.get(entryName);
            if (entry?.kind === "directory") {
              return entry;
            }
            if (options?.create) {
              const directory = makeDirectoryHandle(entryName, {});
              entries.set(entryName, directory);
              return directory;
            }
            throw new DOMException(`Directory not found: ${entryName}`, "NotFoundError");
          },
          async getFileHandle(entryName: string, options?: { create?: boolean }) {
            const entry = entries.get(entryName);
            if (entry?.kind === "file") {
              return entry;
            }
            if (options?.create) {
              const file = makeFileHandle(entryName, "");
              entries.set(entryName, file);
              return file;
            }
            throw new DOMException(`File not found: ${entryName}`, "NotFoundError");
          },
          async removeEntry(entryName: string) {
            entries.delete(entryName);
          },
        };
      };

      const rootHandle = makeDirectoryHandle("demo-project", {
        "README.md": makeFileHandle("README.md", "# Demo project\n"),
        src: makeDirectoryHandle("src", {
          "index.ts": makeFileHandle(
            "index.ts",
            'export const greeting = "hello from omcode";\n',
          ),
        }),
      });

      Object.defineProperty(window, "showDirectoryPicker", {
        configurable: true,
        value: async () => rootHandle,
      });
    });

    await page.goto("/omcode");
    await page.getByRole("button", { name: "🗂 Mở dự án" }).click();
    await expect(page.getByText("demo-project", { exact: true })).toBeVisible();
  });

  test("01 — Welcome screen renders and can open project picker", async ({ page }) => {
    await expect(page.locator("text=OMDALA Workspace")).toBeVisible();
    await expect(page.locator('text=Mở dự án')).toBeVisible();
  });

  test("02 — AI Chat panel sends message and shows response UI", async ({ page }) => {
    const input = page.locator('textarea[placeholder*="Hỏi AI"]').or(page.locator('textarea[placeholder*="Ask AI"]'));
    await expect(input).toBeVisible();
    await input.fill("Hello AI");
    await input.press("Enter");
    await expect(page.getByText("Hello AI")).toBeVisible();
  });

  test("03 — Language toggle switches EN/VI", async ({ page }) => {
    const langBtn = page.getByRole("button", { name: /VI 🇻🇳|EN 🇺🇸/ });
    await expect(langBtn).toContainText("VI");
    await langBtn.click();
    await expect(langBtn).toContainText("EN");
    await expect(page.locator('button:has-text("Open Project")')).toBeVisible();
  });

  test("04 — Terminal panel opens and accepts command", async ({ page }) => {
    const termBtn = page.locator('button:has-text("Terminal")');
    await termBtn.click();
    const termInput = page.locator('input[placeholder="Nhập lệnh..."]');
    await termInput.fill("help");
    await termInput.press("Enter");
    await expect(page.locator('text=Liệt kê file/thư mục')).toBeVisible();
  });

  test("05 — Account panel opens with login/register UI", async ({ page }) => {
    const accountBtn = page.locator('button[title="Gói dịch vụ"], button[title="Plans"]');
    await accountBtn.click();
    await expect(
      page.locator("text=Account & Subscription").or(page.locator("text=Tài khoản & Đăng ký")),
    ).toBeVisible();
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
  });
});
