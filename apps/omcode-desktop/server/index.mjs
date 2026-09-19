import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { createStore } from "./store.mjs";
import { files, execute, gitStatus } from "./local.mjs";
import {
  saveProvider,
  checkProvider,
  importProviders,
  probeGeneration,
} from "./providers.mjs";
import { importSkills, importMcp, ROLES } from "./catalog.mjs";
import { mcpRequest } from "./mcp.mjs";
import { createAgent } from "./agent.mjs";
import { APP_VERSION } from "./meta.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const hash = (content) => createHash("sha256").update(content).digest("hex");
const emptyHash = hash("");

export async function startServer(options = {}) {
  const dataDirectory =
    options.dataDirectory ||
    process.env.OMCODE_DATA_DIR ||
    path.join(process.env.HOME, "Library/Application Support/OMCODE");
  const store = createStore(dataDirectory);
  const agent = createAgent(store);
  const token = options.token || randomBytes(32).toString("hex");
  const staticRoot = options.staticRoot || path.join(here, "../dist");
  let origin = "";
  const json = (response, status, data) => {
    response.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify(data));
  };
  const readBody = async (request) => {
    let text = "";
    for await (const chunk of request) {
      text += chunk;
      if (Buffer.byteLength(text) > 3 * 1024 * 1024)
        throw new Error("Yêu cầu quá lớn.");
    }
    return text ? JSON.parse(text) : {};
  };
  const knownRoot = (root) => {
    if (!store.get("projects", []).some((p) => p.root === root))
      throw new Error("Mở dự án trước khi truy cập tệp.");
    return root;
  };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, origin || "http://127.0.0.1");
      if (req.headers.host !== new URL(origin).host)
        return json(res, 403, { error: "Invalid host" });
      if (req.headers.origin && req.headers.origin !== origin)
        return json(res, 403, { error: "Invalid origin" });
      if (url.pathname === "/health")
        return json(res, 200, {
          app: "OMCODE",
          version: APP_VERSION,
          ready: true,
        });
      if (url.pathname.startsWith("/api/")) {
        const supplied = Buffer.from(
          req.headers.authorization?.replace(/^Bearer /, "") || "",
        );
        const expected = Buffer.from(token);
        if (
          supplied.length !== expected.length ||
          !timingSafeEqual(supplied, expected)
        )
          return json(res, 401, {
            error: "Phiên local không hợp lệ. Mở lại OMCODE.",
          });
        if (!["GET", "POST"].includes(req.method))
          return json(res, 405, { error: "Method not allowed" });
        if (
          req.method === "POST" &&
          !req.headers["content-type"]?.startsWith("application/json")
        )
          return json(res, 415, { error: "JSON required" });
        const body = req.method === "POST" ? await readBody(req) : {};
        const route = `${req.method} ${url.pathname}`;
        let result;
        if (route === "GET /api/bootstrap")
          result = {
            version: APP_VERSION,
            projects: store.get("projects", []),
            providers: store.get("providers", []),
            skills: store.get("skills", []),
            mcp: store.get("mcp", []),
            roles: ROLES.map(({ instruction, ...r }) => r),
            sessions: store.sessions(),
            settings: store.get("preferences", {}),
            dataDirectory,
            activeRun: agent.active(),
          };
        else if (route === "POST /api/project/open") {
          const project = await files("open", String(body.path));
          const projects = store
            .get("projects", [])
            .filter((p) => p.root !== project.root);
          projects.unshift(project);
          store.set("projects", projects.slice(0, 30));
          result = project;
        } else if (route === "GET /api/files")
          result = await files(
            "list",
            knownRoot(url.searchParams.get("root")),
            url.searchParams.get("path") || "",
          );
        else if (route === "GET /api/file") {
          const root = knownRoot(url.searchParams.get("root"));
          const file = url.searchParams.get("path");
          const draft = store.draft(root, file);
          try {
            result = await files("read", root, file);
          } catch (error) {
            if (!draft?.isNew || !error.message.includes("không tồn tại"))
              throw error;
            result = { content: "", hash: emptyHash, isNew: true };
          }
          if (draft?.dirty) result.draft = draft;
        } else if (route === "GET /api/drafts")
          result = store.drafts(knownRoot(url.searchParams.get("root")));
        else if (route === "POST /api/draft") {
          knownRoot(body.root);
          if (
            typeof body.path !== "string" ||
            !body.path ||
            path.isAbsolute(body.path) ||
            body.path
              .split("/")
              .some((part) => part === ".." || part === ".git") ||
            typeof body.content !== "string" ||
            Buffer.byteLength(body.content) > 2 * 1024 * 1024 ||
            !/^[a-f0-9]{64}$/.test(body.baseHash)
          )
            throw new Error("Bản nháp không hợp lệ.");
          store.saveDraft(
            body.root,
            body.path,
            body.content,
            body.baseHash,
            body.isNew,
            true,
          );
          result = { ok: true };
        } else if (route === "POST /api/file") {
          knownRoot(body.root);
          let before = "";
          try {
            before = (await files("read", body.root, body.path)).content;
          } catch (e) {
            if (!e.message.includes("không tồn tại")) throw e;
          }
          if (hash(before) !== body.expectedHash)
            throw new Error(
              "Tệp đã thay đổi ở ngoài OMCODE. Tải lại trước khi lưu.",
            );
          const editId = store.recordEdit(
            body.root,
            body.path,
            before,
            body.content,
          );
          result = {
            ...(await files("write", body.root, body.path, {
              content: body.content,
              expectedHash: body.expectedHash,
            })),
            editId,
          };
          delete result.before;
          store.saveDraft(
            body.root,
            body.path,
            body.content,
            result.hash,
            false,
            false,
          );
        } else if (route === "GET /api/git")
          result = await gitStatus(knownRoot(url.searchParams.get("root")));
        else if (route === "GET /api/git/diff") {
          const root = knownRoot(url.searchParams.get("root"));
          const diff = await execute(
            "/usr/bin/git",
            [
              "--no-pager",
              "diff",
              "--no-ext-diff",
              "HEAD",
              "--",
              url.searchParams.get("path") || ".",
            ],
            { cwd: root },
          );
          result = diff;
        } else if (route === "GET /api/sessions") result = store.sessions();
        else if (route === "POST /api/sessions")
          result = store.createSession(
            knownRoot(body.root),
            body.title || "Phiên mới",
          );
        else if (route === "GET /api/session") {
          result = store.session(url.searchParams.get("id"));
          if (!result) throw new Error("Không tìm thấy phiên.");
        } else if (route === "POST /api/agent/run") {
          if (
            typeof body.prompt !== "string" ||
            !body.prompt.trim() ||
            body.prompt.length > 40000
          )
            throw new Error("Yêu cầu phải có nội dung và dưới 40.000 ký tự.");
          result = agent.start(body);
        } else if (route === "GET /api/agent/run") {
          result = agent.get(url.searchParams.get("id"));
          if (!result)
            throw new Error(
              "Lượt xử lý không còn trong bộ nhớ; xem lịch sử phiên.",
            );
        } else if (route === "POST /api/agent/cancel") {
          agent.cancel(body.id);
          result = { ok: true };
        } else if (route === "POST /api/proposal/apply") {
          const session = store.session(body.sessionId);
          if (!session) throw new Error("Phiên không tồn tại.");
          const proposal = session.messages
            .flatMap((m) => m.proposals || [])
            .find((p) => p.id === body.id);
          if (
            !proposal ||
            proposal.type !== "edit" ||
            proposal.status !== "pending"
          )
            throw new Error("Đề xuất không còn chờ duyệt.");
          const expectedHash = proposal.expectedHash || emptyHash;
          store.recordEdit(
            session.project,
            proposal.path,
            proposal.before,
            proposal.content,
          );
          result = await files("write", session.project, proposal.path, {
            content: proposal.content,
            expectedHash,
          });
          delete result.before;
          proposal.status = "applied";
          store.saveSession(session);
        } else if (route === "POST /api/terminal") {
          const root = knownRoot(body.root);
          if (
            typeof body.command !== "string" ||
            !body.command.trim() ||
            body.command.length > 4000
          )
            throw new Error("Lệnh không hợp lệ.");
          const controller = new AbortController();
          res.on("close", () => {
            if (!res.writableEnded) controller.abort();
          });
          result = await execute("/bin/zsh", ["-f", "-c", body.command], {
            cwd: root,
            timeout: 60000,
            signal: controller.signal,
            env: { ...process.env, OMCODE_LOCAL_TERMINAL: "1" },
          });
        } else if (route === "GET /api/edits")
          result = store.edits(knownRoot(url.searchParams.get("root")));
        else if (route === "POST /api/edit/restore") {
          const edit = store.edit(body.id);
          if (!edit) throw new Error("Không tìm thấy bản lưu.");
          knownRoot(edit.project);
          const current = await files("read", edit.project, edit.path);
          if (current.content !== edit.after)
            throw new Error(
              "Tệp đã có sửa đổi mới. Xem bản lưu trước khi khôi phục.",
            );
          store.recordEdit(
            edit.project,
            edit.path,
            current.content,
            edit.before,
          );
          result = await files("write", edit.project, edit.path, {
            content: edit.before,
            expectedHash: current.hash,
          });
          delete result.before;
        } else if (route === "POST /api/provider")
          result = await saveProvider(store, body);
        else if (route === "POST /api/provider/check")
          result = await checkProvider(store, body.id);
        else if (route === "POST /api/provider/probe")
          result = await probeGeneration(store, body.id);
        else if (route === "POST /api/import/providers")
          result = await importProviders(store);
        else if (route === "POST /api/import/skills")
          result = await importSkills(store);
        else if (route === "POST /api/import/mcp")
          result = await importMcp(store);
        else if (route === "POST /api/mcp/check") {
          const list = store.get("mcp", []);
          const item = list.find((s) => s.id === body.id);
          if (!item) throw new Error("MCP không tồn tại.");
          try {
            const answer = await mcpRequest(item, "tools");
            item.tools = answer.tools.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
              readOnly: !!t.annotations?.readOnlyHint,
            }));
            item.status = "connected";
            item.error = null;
          } catch {
            item.status = "needs_connection";
            item.error = "Cần kết nối hoặc cấp OAuth riêng cho OMCODE.";
          }
          store.set("mcp", list);
          result = item;
        } else if (route === "POST /api/mcp/call") {
          const item = store.get("mcp", []).find((s) => s.id === body.id);
          if (!item?.tools?.some((t) => t.name === body.name))
            throw new Error("Tool chưa được kiểm tra.");
          result = await mcpRequest(item, "call", {
            name: body.name,
            arguments: body.arguments || {},
          });
        } else if (route === "POST /api/preferences") {
          store.set("preferences", {
            theme: body.theme === "dark" ? "dark" : "light",
          });
          result = { ok: true };
        } else if (route === "GET /api/system") {
          result = {
            platform: process.platform,
            architecture: process.arch,
            node: process.version,
            rssMiB: Math.round(process.memoryUsage().rss / 1048576),
            agentConcurrency: 1,
            skills: store.get("skills", []).length,
            providerCount: store.get("providers", []).length,
          };
        } else return json(res, 404, { error: "API không tồn tại." });
        return json(res, 200, result);
      }
      if (req.method !== "GET")
        return json(res, 405, { error: "Method not allowed" });
      const relative =
        url.pathname === "/"
          ? "index.html"
          : decodeURIComponent(url.pathname).replace(/^\/+/, "");
      const file = path.resolve(staticRoot, relative);
      if (!file.startsWith(path.resolve(staticRoot) + path.sep))
        return json(res, 403, { error: "Forbidden" });
      let content;
      try {
        content = await fs.readFile(file);
      } catch {
        return json(res, 404, { error: "Tài nguyên không tồn tại." });
      }
      const type =
        {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".png": "image/png",
          ".svg": "image/svg+xml",
          ".woff2": "font/woff2",
        }[path.extname(file)] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": type,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'",
      });
      res.end(content);
    } catch (error) {
      json(res, 400, { error: error.message });
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(
      options.port ?? Number(process.env.OMCODE_PORT || 0),
      "127.0.0.1",
      resolve,
    );
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  return {
    server,
    store,
    origin,
    token,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      store.close();
    },
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const runtime = await startServer();
  process.stdout.write(
    JSON.stringify({ ready: true, url: runtime.origin, token: runtime.token }) +
      "\n",
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => runtime.close().finally(() => process.exit()));
}
