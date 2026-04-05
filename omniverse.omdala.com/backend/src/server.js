import http from "node:http";
import { createOmniverseRuntime } from "./index.js";

const port = Number(process.env.PORT || 4080);

async function start() {
  const runtime = await createOmniverseRuntime({ env: process.env });

  const server = http.createServer(async (req, res) => {
    const baseUrl = `http://${req.headers.host || `localhost:${port}`}`;
    const request = new Request(new URL(req.url || "/", baseUrl), {
      method: req.method,
      headers: req.headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    });

    const response = await runtime.api.handle(request);
    res.statusCode = response.status;

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await response.text();
    res.end(body);
  });

  server.listen(port, () => {
    process.stdout.write(
      `Omniverse O1 API listening on http://localhost:${port}\n`,
    );
  });
}

start().catch((error) => {
  process.stderr.write(`Failed to start Omniverse O1 API: ${error.message}\n`);
  process.exitCode = 1;
});
