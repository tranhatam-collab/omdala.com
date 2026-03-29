import { createServer } from "node:http";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function resolveRoot() {
  const requestedRoot = getArgValue("--root");

  if (!requestedRoot) {
    return projectRoot;
  }

  return path.resolve(projectRoot, requestedRoot);
}

function resolvePort() {
  const portFromArg = getArgValue("--port");
  const rawPort = portFromArg ?? process.env.PORT ?? "4173";
  const parsedPort = Number.parseInt(rawPort, 10);

  if (Number.isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(`Invalid port: ${rawPort}`);
  }

  return parsedPort;
}

function toFilePath(requestUrl, rootDir) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const targetPath = path.resolve(rootDir, `.${normalized}`);
  const relativePath = path.relative(rootDir, targetPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return targetPath;
}

async function resolveRequestedFile(filePath) {
  try {
    const currentStat = await stat(filePath);

    if (currentStat.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      await access(indexPath);
      return indexPath;
    }

    return filePath;
  } catch {
    return null;
  }
}

function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function createRequestHandler(rootDir) {
  return async (request, response) => {
    const filePath = toFilePath(request.url ?? "/", rootDir);

    if (!filePath) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    const requestedFile = await resolveRequestedFile(filePath);

    if (!requestedFile) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not Found");
      return;
    }

    try {
      const fileContents = await readFile(requestedFile);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": getMimeType(requestedFile)
      });
      response.end(fileContents);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Internal Server Error");
      console.error(error);
    }
  };
}

async function listenWithFallback(server, host, startPort, attempts = 10) {
  let currentPort = startPort;

  while (currentPort < startPort + attempts) {
    try {
      await new Promise((resolve, reject) => {
        const onError = (error) => {
          server.off("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          resolve();
        };

        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(currentPort, host);
      });

      return currentPort;
    } catch (error) {
      if (error.code !== "EADDRINUSE") {
        throw error;
      }

      currentPort += 1;
    }
  }

  throw new Error(`Could not find an open port starting at ${startPort}`);
}

async function main() {
  const host = process.env.HOST ?? "0.0.0.0";
  const rootDir = resolveRoot();
  const desiredPort = resolvePort();
  const server = createServer(createRequestHandler(rootDir));
  const activePort = await listenWithFallback(server, host, desiredPort);
  const hostLabel = host === "0.0.0.0" ? "127.0.0.1" : host;

  console.log(`OMDALA dev server running from ${rootDir}`);
  console.log(`Local:   http://localhost:${activePort}`);
  console.log(`Host:    http://${hostLabel}:${activePort}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
