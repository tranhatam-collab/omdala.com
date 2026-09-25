import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createHash } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { startServer } from "../server/index.mjs";
import { mcpRequest } from "../server/mcp.mjs";
import { createStore } from "../server/store.mjs";
import { importMcp, importSkills, ROLES } from "../server/catalog.mjs";
import {
  validateEndpoint,
  normalizeModelId,
  providerKey,
  completion,
} from "../server/providers.mjs";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const metadata = JSON.parse(
  await fs.readFile(new URL("../package.json", import.meta.url), "utf8"),
);

test("local runtime: authentication, files, conflict guard, backup, terminal, persistence and approved AI edits", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "omcode-test-")),
  );
  const project = path.join(root, "project");
  await fs.mkdir(project);
  await fs.writeFile(
    path.join(project, "hello.js"),
    "export const value = 1;\n",
  );
  await fs.mkdir(path.join(project, "node_modules"));
  await fs.writeFile(path.join(root, "outside.txt"), "private");
  await fs.symlink(
    path.join(root, "outside.txt"),
    path.join(project, "escape.txt"),
  );
  let runtime = await startServer({ dataDirectory: path.join(root, "state") });
  const request = async (route, body) => {
    const r = await fetch(`${runtime.origin}/api/${route}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${runtime.token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, data: await r.json() };
  };
  t.after(() => runtime.close());
  await t.test(
    "rejects unauthenticated and cross-origin requests",
    async () => {
      assert.equal(
        (await fetch(`${runtime.origin}/api/bootstrap`)).status,
        401,
      );
      assert.equal(
        (
          await fetch(`${runtime.origin}/api/bootstrap`, {
            headers: {
              Authorization: `Bearer ${runtime.token}`,
              Origin: "https://evil.invalid",
            },
          })
        ).status,
        403,
      );
      const healthResponse = await fetch(`${runtime.origin}/health`);
      assert.equal(healthResponse.status, 200);
      assert.equal((await healthResponse.json()).version, metadata.version);
      assert.equal((await request("bootstrap")).data.version, metadata.version);
    },
  );
  await t.test("bounds file access and skips dependencies", async () => {
    assert.equal(
      (await request("project/open", { path: project })).status,
      200,
    );
    const list = await request(`files?root=${encodeURIComponent(project)}`);
    assert.deepEqual(
      list.data.entries.map((e) => e.name),
      ["hello.js"],
    );
    assert.equal(
      (
        await request(
          `file?root=${encodeURIComponent(project)}&path=../outside.txt`,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          `file?root=${encodeURIComponent(project)}&path=escape.txt`,
        )
      ).status,
      400,
    );
  });
  await t.test(
    "saves with an optimistic lock and retains rollback content",
    async () => {
      const file = await request(
        `file?root=${encodeURIComponent(project)}&path=hello.js`,
      );
      const write = await request("file", {
        root: project,
        path: "hello.js",
        content: "export const value = 2;\n",
        expectedHash: file.data.hash,
      });
      assert.equal(write.status, 200);
      assert.equal(
        (
          await request("file", {
            root: project,
            path: "hello.js",
            content: "stale",
            expectedHash: file.data.hash,
          })
        ).status,
        400,
      );
      assert.equal(
        (await request("edit/restore", { id: write.data.editId })).status,
        200,
      );
      assert.equal(
        await fs.readFile(path.join(project, "hello.js"), "utf8"),
        "export const value = 1;\n",
      );
    },
  );
  await t.test(
    "preserves existing and new drafts across restarts without changing project files",
    async () => {
      const content = "export const value = 1;\n";
      assert.equal(
        (
          await request("draft", {
            root: project,
            path: "hello.js",
            content: "unsaved existing",
            baseHash: sha(content),
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request("draft", {
            root: project,
            path: "draft-new.js",
            content: "unsaved new",
            baseHash: sha(""),
            isNew: true,
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request("draft", {
            root: project,
            path: "../escape.js",
            content: "bad",
            baseHash: sha(""),
          })
        ).status,
        400,
      );
      await runtime.close();
      runtime = await startServer({ dataDirectory: path.join(root, "state") });
      const saved = (
        await request(`file?root=${encodeURIComponent(project)}&path=hello.js`)
      ).data;
      assert.equal(saved.content, content);
      assert.equal(saved.draft.content, "unsaved existing");
      const created = (
        await request(
          `file?root=${encodeURIComponent(project)}&path=draft-new.js`,
        )
      ).data;
      assert.equal(created.draft.content, "unsaved new");
      await assert.rejects(fs.access(path.join(project, "draft-new.js")));
      assert.equal(
        (await request(`drafts?root=${encodeURIComponent(project)}`)).data
          .length,
        2,
      );
      await request("file", {
        root: project,
        path: "hello.js",
        content,
        expectedHash: sha(content),
      });
      assert.equal(
        (await request(`drafts?root=${encodeURIComponent(project)}`)).data
          .length,
        1,
      );
    },
  );
  await t.test(
    "executes actual terminal commands in the selected project",
    async () => {
      const result = await request("terminal", {
        root: project,
        command: "/bin/pwd",
      });
      assert.equal(result.status, 200);
      assert.equal(result.data.stdout.trim(), project);
    },
  );
  await t.test(
    "agent calls tools but edits only after user approval",
    async () => {
      let count = 0;
      const model = http.createServer(async (req, res) => {
        let body = "";
        for await (const c of req) body += c;
        const d = JSON.parse(body || "{}");
        res.setHeader("Content-Type", "application/json");
        if (req.url === "/models")
          return res.end(JSON.stringify({ data: [{ id: "fixture-model" }] }));
        count++;
        assert.ok(d.messages[0].content.includes("OMCODE"));
        res.end(
          JSON.stringify({
            choices: [
              {
                message:
                  count === 1
                    ? {
                        role: "assistant",
                        content: null,
                        tool_calls: [
                          {
                            id: "edit-1",
                            type: "function",
                            function: {
                              name: "propose_edit",
                              arguments: JSON.stringify({
                                path: "created.js",
                                content: "export const ready = true;\n",
                                reason: "regression test",
                              }),
                            },
                          },
                        ],
                      }
                    : { role: "assistant", content: "Bản sửa đang chờ duyệt." },
              },
            ],
          }),
        );
      });
      await new Promise((resolve) => model.listen(0, "127.0.0.1", resolve));
      t.after(() => new Promise((resolve) => model.close(resolve)));
      runtime.store.set("providers", [
        {
          id: "fixture",
          name: "Fixture",
          baseUrl: `http://127.0.0.1:${model.address().port}`,
          model: "fixture-model",
          models: ["fixture-model"],
        },
      ]);
      const session = (await request("sessions", { root: project })).data;
      const prepared = (
        await request("agent/prepare", {
          sessionId: session.id,
          providerId: "fixture",
          model: "fixture-model",
          role: "coder",
          prompt: "Create the test file.",
        })
      ).data;
      const started = (
        await request("agent/run", {
          approvalId: prepared.id,
          digest: prepared.digest,
        })
      ).data;
      let run;
      for (let i = 0; i < 100; i++) {
        run = (await request(`agent/run?id=${started.id}`)).data;
        if (run.status !== "running") break;
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      assert.equal(run.status, "completed");
      assert.equal(count, 1);
      await assert.rejects(fs.access(path.join(project, "created.js")));
      assert.equal(
        (
          await request("proposal/apply", {
            sessionId: session.id,
            id: run.proposals[0].id,
          })
        ).status,
        200,
      );
      assert.equal(
        await fs.readFile(path.join(project, "created.js"), "utf8"),
        "export const ready = true;\n",
      );
      assert.equal(
        (
          await request("proposal/apply", {
            sessionId: session.id,
            id: run.proposals[0].id,
          })
        ).status,
        400,
      );
      await runtime.close();
      runtime = await startServer({ dataDirectory: path.join(root, "state") });
      assert.equal(
        (await request(`session?id=${session.id}`)).data.messages.length,
        2,
      );
    },
  );
});
test("provider endpoints reject credentials and insecure remote HTTP", () => {
  assert.throws(() => validateEndpoint("http://remote.example/v1"));
  assert.throws(() => validateEndpoint("https://user:secret@example.com/v1"));
  assert.throws(() => validateEndpoint("https://example.com/v1?token=secret"));
  assert.equal(
    validateEndpoint("http://127.0.0.1:4000/v1/"),
    "http://127.0.0.1:4000/v1",
  );
});
test("Google model resource names are normalized for OpenAI-compatible generation", () => {
  assert.equal(
    normalizeModelId(
      "https://generativelanguage.googleapis.com/v1beta/openai",
      "models/gemini-3.5-flash",
    ),
    "gemini-3.5-flash",
  );
  assert.equal(
    normalizeModelId("https://other.example/v1", "models/custom"),
    "models/custom",
  );
});
test("Keychain failures stop before any provider request", async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "omcode-keychain-test-"),
  );
  const helper = path.join(directory, "unavailable-helper");
  await fs.writeFile(helper, "#!/bin/sh\nexit 1\n", { mode: 0o700 });
  const previous = process.env.OMCODE_KEYCHAIN_PATH;
  process.env.OMCODE_KEYCHAIN_PATH = helper;
  try {
    await assert.rejects(providerKey("google"), /Keychain/);
    await fs.writeFile(helper, "#!/bin/sh\nexit 3\n", { mode: 0o700 });
    await assert.rejects(
      completion(
        { id: "google", model: "unused", baseUrl: "https://example.invalid" },
        [],
        [],
        new AbortController().signal,
      ),
      /Chưa có API key/,
    );
  } finally {
    if (previous === undefined) delete process.env.OMCODE_KEYCHAIN_PATH;
    else process.env.OMCODE_KEYCHAIN_PATH = previous;
  }
});

test("MCP transport lists and calls a read-only tool through OMCODE", async (t) => {
  const fixture = http.createServer(async (request, response) => {
    const mcp = new McpServer({ name: "omcode-fixture", version: "1.0.0" });
    mcp.registerTool(
      "fixture_echo",
      {
        description: "Return deterministic fixture output.",
        annotations: { readOnlyHint: true },
      },
      async () => ({ content: [{ type: "text", text: "MCP_E2E_OK" }] }),
    );
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    try {
      await mcp.connect(transport);
      await transport.handleRequest(request, response);
      response.on("close", () => {
        transport.close().catch(() => {});
        mcp.close().catch(() => {});
      });
    } catch (error) {
      if (!response.headersSent) response.writeHead(500).end(error.message);
    }
  });
  await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));

  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "omcode-mcp-test-"),
  );
  const runtime = await startServer({ dataDirectory: directory });
  t.after(async () => {
    await runtime.close();
    await new Promise((resolve) => fixture.close(resolve));
  });
  runtime.store.set("mcp", [
    {
      id: "fixture",
      url: `http://127.0.0.1:${fixture.address().port}`,
      status: "not_checked",
      tools: [],
    },
  ]);
  const direct = await mcpRequest(
    {
      id: "fixture",
      url: `http://127.0.0.1:${fixture.address().port}`,
    },
    "tools",
  );
  assert.equal(direct.tools[0].name, "fixture_echo");
  const request = async (route, body) => {
    const response = await fetch(`${runtime.origin}/api/${route}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${runtime.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  };

  const checked = await request("mcp/check", { id: "fixture" });
  assert.equal(checked.status, 200);
  assert.equal(checked.data.status, "connected");
  assert.deepEqual(checked.data.tools, [
    {
      name: "fixture_echo",
      description: "Return deterministic fixture output.",
      inputSchema: {
        type: "object",
        properties: {},
      },
      readOnly: true,
    },
  ]);
  const preview = await request("mcp/prepare", {
    id: "fixture",
    name: "fixture_echo",
    arguments: {},
  });
  const called = await request("mcp/call", {
    approvalId: preview.data.id,
    digest: preview.data.digest,
  });
  assert.equal(called.status, 200);
  assert.equal(
    (
      await request("mcp/call", {
        approvalId: preview.data.id,
        digest: preview.data.digest,
      })
    ).status,
    400,
  );
  assert.equal(called.data.content[0].text, "MCP_E2E_OK");
});

test("catalog imports deduplicated skills without symlink escapes", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "omcode-catalog-home-"));
  const first = path.join(home, ".codex/skills/first");
  const duplicate = path.join(home, ".agents/skills/duplicate");
  await fs.mkdir(first, { recursive: true });
  await fs.mkdir(duplicate, { recursive: true });
  const content = [
    "---",
    "name: fixture-skill",
    "description: Deterministic skill import fixture.",
    "---",
    "Use this fixture safely.",
    "",
  ].join("\n");
  await fs.writeFile(path.join(first, "SKILL.md"), content);
  await fs.writeFile(path.join(duplicate, "SKILL.md"), content);
  await fs.writeFile(path.join(home, "outside-secret"), "never-copy\n");
  await fs.symlink(
    path.join(home, "outside-secret"),
    path.join(first, "secret-link"),
  );

  const previousHome = process.env.HOME;
  process.env.HOME = home;
  const store = createStore(path.join(home, "state"));
  try {
    const skills = await importSkills(store);
    assert.equal(skills.length, 1);
    assert.equal(skills[0].name, "fixture-skill");
    assert.match(skills[0].path, /state\/skills/);
    await assert.rejects(fs.access(path.join(skills[0].path, "secret-link")));
  } finally {
    store.close();
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
  }
});

test("catalog exposes seven unique roles and imports only URL-based MCP servers", async () => {
  assert.equal(ROLES.length, 7);
  assert.equal(new Set(ROLES.map((role) => role.id)).size, 7);
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "omcode-mcp-home-"));
  await fs.mkdir(path.join(home, ".codex"), { recursive: true });
  await fs.writeFile(
    path.join(home, ".codex/config.toml"),
    [
      "[mcp_servers.remote]",
      'url = "https://mcp.example.test/v1"',
      "",
      "[mcp_servers.local_command]",
      'command = "unsafe-command"',
      "",
    ].join("\n"),
  );
  const previousHome = process.env.HOME;
  process.env.HOME = home;
  const store = createStore(path.join(home, "state"));
  try {
    assert.deepEqual(await importMcp(store), [
      {
        id: "remote",
        url: "https://mcp.example.test/v1",
        status: "not_checked",
        tools: [],
      },
    ]);
  } finally {
    store.close();
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
  }
});
