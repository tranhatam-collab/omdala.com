// ─── Workspace Test Fixture ─────────────────────────────────────────────
// Injects a mock window.showDirectoryPicker() so Playwright can "open"
// a project folder in CI without the native File System Access API dialog.
// The mock returns a fake FileSystemDirectoryHandle with a simple project
// structure that the OMCODE IDE can render.
//
// Usage in tests:
//   import { injectWorkspaceFixture } from "./fixtures/workspace-fixture";
//   test.beforeEach(async ({ page }) => {
//     await page.goto("/workspace/");
//     await injectWorkspaceFixture(page);
//   });

import type { Page } from "@playwright/test";

export async function injectWorkspaceFixture(page: Page) {
  await page.addInitScript(() => {
    // ─── Fake FileSystemDirectoryHandle ───────────────────────────────
    type Entry = {
      name: string;
      kind: "file" | "directory";
      content?: string;
      children?: Map<string, Entry>;
    };

    function makeFile(name: string, content: string): Entry {
      return { name, kind: "file", content };
    }

    function makeDir(name: string, children: Entry[]): Entry {
      const map = new Map<string, Entry>();
      for (const c of children) map.set(c.name, c);
      return { name, kind: "directory", children: map };
    }

    const projectRoot = makeDir("test-project", [
      makeFile("package.json", JSON.stringify({
        name: "test-project",
        version: "1.0.0",
        scripts: { build: "tsc" },
      }, null, 2)),
      makeFile("README.md", "# Test Project\n\nA fixture project for E2E testing."),
      makeDir("src", [
        makeFile("index.ts", "console.log('hello');\n"),
        makeFile("utils.ts", "export function add(a: number, b: number) { return a + b; }\n"),
      ]),
      makeDir("tests", [
        makeFile("example.test.ts", "import { test } from 'node:test';\n"),
      ]),
    ]);

    function makeFileHandle(entry: Entry): any {
      return {
        kind: "file",
        name: entry.name,
        getFile: async () => ({
          name: entry.name,
          text: async () => entry.content ?? "",
          size: (entry.content ?? "").length,
          lastModified: Date.now(),
          slice: () => new Blob([entry.content ?? ""]),
          arrayBuffer: async () => new TextEncoder().encode(entry.content ?? "").buffer,
          stream: () => new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(entry.content ?? ""));
              controller.close();
            },
          }),
        }),
        createWritable: async () => {
          let written = "";
          return {
            write: async (data: any) => { written += String(data); },
            close: async () => { entry.content = written; },
            abort: async () => {},
            locked: false,
            size: 0,
          };
        },
      };
    }

    function makeDirHandle(entry: Entry): any {
      return {
        kind: "directory",
        name: entry.name,
        entries: async function* () {
          if (entry.children) {
            for (const [name, child] of entry.children) {
              yield [name, child.kind === "file" ? makeFileHandle(child) : makeDirHandle(child)];
            }
          }
        },
        getFileHandle: async (name: string) => {
          const child = entry.children?.get(name);
          if (!child || child.kind !== "file") throw new DOMException("NotFoundError", "NotFoundError");
          return makeFileHandle(child);
        },
        getDirectoryHandle: async (name: string) => {
          const child = entry.children?.get(name);
          if (!child || child.kind !== "directory") throw new DOMException("NotFoundError", "NotFoundError");
          return makeDirHandle(child);
        },
        removeEntry: async (name: string) => {
          entry.children?.delete(name);
        },
        resolve: async () => null,
        queryPermission: async () => "granted",
        requestPermission: async () => "granted",
      };
    }

    (window as any).showDirectoryPicker = async () => {
      return makeDirHandle(projectRoot);
    };

    // Also set up a flag so the app knows it's in test mode
    (window as any).__OMCODE_E2E_FIXTURE__ = true;
  });
}
