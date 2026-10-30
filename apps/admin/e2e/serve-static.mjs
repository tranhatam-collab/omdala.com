// Minimal static server for the built Next exports. No dependencies.
// Serves out/ (preview build) on PORT and out-deny/ (default deny build) on PORT+1.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 3016);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function resolveFile(root, urlPath) {
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

function serve(root, port) {
  createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  if (pathname !== "/" && !pathname.endsWith("/") && !path.extname(pathname)) {
    const query = (req.url ?? "").includes("?") ? `?${(req.url ?? "").split("?")[1]}` : "";
    res.writeHead(308, { Location: `${pathname}/${query}` }).end();
    return;
  }
  const file = await resolveFile(root, pathname);
  const status = file ? 200 : 404;
  const target = file ?? path.join(root, "404.html");
  try {
    const body = await readFile(target);
    res.writeHead(status, { "Content-Type": types[path.extname(target)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`admin static export on http://127.0.0.1:${port}`));
}

serve(path.join(appDir, "out"), port);
serve(path.join(appDir, "out-deny"), port + 1);
