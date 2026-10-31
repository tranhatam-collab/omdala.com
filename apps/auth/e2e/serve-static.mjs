// Minimal static server for the built Next export (apps/auth/out). No dependencies.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const port = Number(process.env.PORT || 3014);
// Send the global `/*` rule of the export's own _headers, so the e2e run sees the same CSP and
// security headers as production. `upgrade-insecure-requests` is dropped for the plain-http
// loopback server (it would rewrite every subresource URL to https); the HSTS header is skipped.
function globalHeaders(root) {
  let text = "";
  try {
    text = readFileSync(path.join(root, "_headers"), "utf8");
  } catch {
    return {};
  }
  const headers = {};
  let inGlobal = false;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) {
      inGlobal = line.trim() === "/*";
      continue;
    }
    if (!inGlobal) continue;
    const index = line.indexOf(":");
    const name = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (name.toLowerCase() === "strict-transport-security") continue;
    if (name.toLowerCase() === "content-security-policy") value = value.replace(/upgrade-insecure-requests;?/, "").trim();
    headers[name] = value;
  }
  return headers;
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function resolveFile(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [clean, path.join(clean, "index.html"), `${clean}.html`];
  for (const candidate of candidates) {
    const full = path.join(root, candidate);
    if (!full.startsWith(root)) continue;
    try {
      if ((await stat(full)).isFile()) return full;
    } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  if (pathname !== "/" && !pathname.endsWith("/") && !path.extname(pathname)) {
    const query = (req.url ?? "").includes("?") ? `?${(req.url ?? "").split("?")[1]}` : "";
    res.writeHead(308, { Location: `${pathname}/${query}` }).end();
    return;
  }
  const file = await resolveFile(pathname);
  const status = file ? 200 : 404;
  const target = file ?? path.join(root, "404.html");
  try {
    const body = await readFile(target);
    res.writeHead(status, { ...globalHeaders(root), "Content-Type": types[path.extname(target)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`auth static export on http://127.0.0.1:${port}`));
