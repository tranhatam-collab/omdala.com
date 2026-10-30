#!/usr/bin/env node
// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// Local-integrated stand-up for the OMDALA API.
//
//   OMDALA_LOCAL_PG_URL=postgresql://user@127.0.0.1:5432/postgres \
//     pnpm --filter @omdala/api run local:stack          # start and stay up
//   ... run local:smoke                                  # start, smoke, tear down
//
// It creates a scratch database on a LOOPBACK PostgreSQL server (plain or TLS),
// applies infra/postgres/migrations, seeds one test account, and starts
// `wrangler dev --local` (no remote bindings, never --remote) with secrets
// generated for this run only. ENVIRONMENT is "development": account data goes
// through PostgreSQL, but magic links and sessions are in-memory by design in
// that mode (lost on restart), and mail is printed to the worker console, never
// sent.
//
// The API always connects with TLS and verifies the certificate, and workerd
// ignores `rejectUnauthorized: false`. So the script makes a throwaway CA, runs a
// loopback TLS-terminating proxy in front of the scratch server, and hands the CA
// to workerd through SSL_CERT_FILE: verification stays ON, nothing is bypassed.
// Nothing is written to the repository; the scratch database, proxy, CA and
// secrets are removed on exit.
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import tls from "node:tls";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(here, "..");
const migrationsDir = resolve(apiDir, "../../infra/postgres/migrations");
const smokeMode = process.argv.includes("--smoke");
const SEED_EMAIL = "local-dev@example.test";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function fail(message) {
  console.error(`local-stack: ${message}`);
  process.exit(1);
}

const adminUrl = process.env.OMDALA_LOCAL_PG_URL;
if (!adminUrl) {
  fail(
    "set OMDALA_LOCAL_PG_URL to a disposable LOCAL PostgreSQL server, " +
      "for example postgresql://postgres@127.0.0.1:5432/postgres",
  );
}
let parsedAdmin;
try {
  parsedAdmin = new URL(adminUrl);
} catch {
  fail("OMDALA_LOCAL_PG_URL is not a valid URL");
}
if (!LOOPBACK.has(parsedAdmin.hostname)) {
  fail(`refusing non-loopback database host "${parsedAdmin.hostname}"; this stand-up is local only`);
}

const dbName = `omdala_local_${randomBytes(5).toString("hex")}`;
const withDatabase = (database) => {
  const url = new URL(adminUrl);
  url.pathname = `/${database}`;
  return url.toString();
};

async function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

let admin;
let scratch;
let wrangler;
let proxy;
const proxySockets = new Set();
let workDir;
let tornDown = false;
let workerOutput = ""; // worker stdout; the console mail transport prints the login link here

async function teardown() {
  if (tornDown) return;
  tornDown = true;
  if (wrangler && !wrangler.killed) wrangler.kill("SIGTERM");
  for (const socket of proxySockets) socket.destroy();
  proxy?.close();
  if (workDir) rmSync(workDir, { recursive: true, force: true });
  await scratch?.end().catch(() => undefined);
  if (admin) {
    await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`).catch(() => undefined);
    await admin.end().catch(() => undefined);
  }
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => teardown().finally(() => process.exit(130)));
}

function makeCertificates(dir) {
  const run = (args) => execFileSync("openssl", args, { stdio: "ignore" });
  const ca = { key: join(dir, "ca.key"), cert: join(dir, "ca.pem") };
  const server = { key: join(dir, "srv.key"), csr: join(dir, "srv.csr"), cert: join(dir, "srv.pem") };
  const ext = join(dir, "srv.ext");
  run(["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=omdala-local-ca",
    "-addext", "basicConstraints=critical,CA:TRUE", "-keyout", ca.key, "-out", ca.cert]);
  run(["req", "-newkey", "rsa:2048", "-nodes", "-subj", "/CN=localhost", "-keyout", server.key, "-out", server.csr]);
  writeFileSync(ext, "subjectAltName=DNS:localhost,IP:127.0.0.1\nbasicConstraints=CA:FALSE\n");
  run(["x509", "-req", "-in", server.csr, "-CA", ca.cert, "-CAkey", ca.key, "-CAcreateserial",
    "-days", "1", "-extfile", ext, "-out", server.cert]);
  return { caCert: ca.cert, key: readFileSync(server.key), cert: readFileSync(server.cert) };
}

// Speaks just enough of the PostgreSQL wire protocol to terminate TLS: answer the
// SSLRequest with 'S', handshake, then pipe the decrypted stream to the scratch server.
function startTlsProxy({ key, cert }, upstreamHost, upstreamPort, port) {
  return new Promise((resolvePromise, reject) => {
    const server = net.createServer((socket) => {
      proxySockets.add(socket);
      socket.on("close", () => proxySockets.delete(socket));
      socket.on("error", () => undefined);
      socket.once("data", (first) => {
        if (first.length < 8 || first.readInt32BE(0) !== 8 || first.readInt32BE(4) !== 80877103) {
          socket.destroy();
          return;
        }
        socket.write("S");
        const secure = new tls.TLSSocket(socket, { isServer: true, key, cert });
        const upstream = net.connect(upstreamPort, upstreamHost);
        proxySockets.add(upstream);
        upstream.on("close", () => proxySockets.delete(upstream));
        for (const side of [secure, upstream]) side.on("error", () => { secure.destroy(); upstream.destroy(); });
        secure.on("close", () => upstream.destroy());
        upstream.on("close", () => secure.destroy());
        secure.pipe(upstream);
        upstream.pipe(secure);
      });
    });
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolvePromise(server));
  });
}

async function waitForHealth(baseUrl) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (wrangler.exitCode !== null) fail(`wrangler exited early with code ${wrangler.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  fail("the worker did not become healthy within 90 seconds");
}

async function smoke(baseUrl) {
  const health = await fetch(`${baseUrl}/health`);
  if (health.status !== 200) throw new Error(`GET /health answered ${health.status}`);
  const healthBody = await health.json();
  if (healthBody.ok !== true || healthBody.service !== "omdala-api") {
    throw new Error("GET /health body is not the expected omdala-api payload");
  }

  const request = await fetch(`${baseUrl}/v1/auth/magic-link/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: SEED_EMAIL, redirectTo: "/dashboard" }),
  });
  const body = await request.json();
  if (request.status !== 201 || body.ok !== true || body.data?.sent !== true) {
    throw new Error(`magic-link request answered ${request.status}: ${JSON.stringify(body).slice(0, 200)}`);
  }
  if (body.data?.deliveryReceipt?.transport !== "console") {
    throw new Error("expected the local console mail transport; no mail may leave this stack");
  }

  // The console transport prints the login link; read the token from the worker output.
  let token;
  for (let i = 0; i < 40 && !token; i++) {
    token = workerOutput.match(/[?&]token=([A-Za-z0-9_%.\-]+)/)?.[1];
    if (!token) await new Promise((r) => setTimeout(r, 250));
  }
  if (!token) throw new Error("the login link did not appear in the worker's console mail output");

  const exchange = await fetch(`${baseUrl}/v1/auth/session/exchange`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: decodeURIComponent(token) }),
  });
  if (exchange.status !== 200) throw new Error(`session exchange answered ${exchange.status}`);
  const cookies = exchange.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
  if (!cookies.includes("omdala_access_token=")) throw new Error("session exchange set no access cookie");

  // The seeded account lives only in the scratch PostgreSQL database.
  const profile = await fetch(`${baseUrl}/v1/account/profile`, { headers: { cookie: cookies } });
  const profileBody = await profile.json();
  if (profile.status !== 200 || profileBody.data?.displayName !== "Local Dev") {
    throw new Error(`profile read answered ${profile.status}: ${JSON.stringify(profileBody).slice(0, 200)}`);
  }
  console.log(
    "local-stack smoke: /health 200; magic-link request 201 (console transport); " +
      "session exchange 200; seeded profile read back from PostgreSQL",
  );
}

async function main() {
  // 1. scratch database on the local server (plain first, TLS if the server insists)
  const connect = async (url) => {
    for (const ssl of [false, { rejectUnauthorized: false }]) {
      const client = new pg.Client({ connectionString: url, ssl });
      client.on("error", () => undefined);
      try {
        await client.connect();
        return client;
      } catch (error) {
        await client.end().catch(() => undefined);
        if (ssl) fail(`cannot connect to the local PostgreSQL (${error.message})`);
      }
    }
  };
  admin = await connect(adminUrl);
  await admin.query(`CREATE DATABASE ${dbName}`);
  const scratchUrl = withDatabase(dbName);
  scratch = await connect(scratchUrl);

  // 2. migrations in order, then one seeded account
  for (const name of readdirSync(migrationsDir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort()) {
    await scratch.query(readFileSync(join(migrationsDir, name), "utf8"));
  }
  await scratch.query(
    `INSERT INTO omdala.account_profiles (email, id, display_name) VALUES ($1, $2, $3)`,
    [SEED_EMAIL, `acc_local_${randomBytes(4).toString("hex")}`, "Local Dev"],
  );
  await scratch.query(`INSERT INTO omdala.account_preferences (email) VALUES ($1)`, [SEED_EMAIL]);

  // 3. throwaway CA + TLS proxy in front of the scratch server, and run-time secrets,
  //    all in a private temp directory
  workDir = mkdtempSync(join(tmpdir(), "omdala-local-stack-"));
  const certs = makeCertificates(workDir);
  const proxyPort = await freePort();
  proxy = await startTlsProxy(
    certs,
    parsedAdmin.hostname.replace(/^\[|\]$/g, ""),
    Number(parsedAdmin.port) || 5432,
    proxyPort,
  );
  const workerDbUrl = new URL(scratchUrl);
  workerDbUrl.hostname = "127.0.0.1";
  workerDbUrl.port = String(proxyPort);
  const envFile = join(workDir, "stack.env");
  writeFileSync(
    envFile,
    [
      `MAGIC_LINK_SECRET=${randomBytes(32).toString("hex")}`,
      `E2E_TEST_SECRET=${randomBytes(32).toString("hex")}`,
      `DATABASE_URL=${workerDbUrl.toString()}`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );

  // 4. the worker, local mode only
  const port = Number(process.env.OMDALA_LOCAL_API_PORT) || (await freePort());
  const baseUrl = `http://127.0.0.1:${port}`;
  const wranglerBin = join(apiDir, "node_modules/wrangler/bin/wrangler.js");
  wrangler = spawn(
    process.execPath,
    [
      wranglerBin, "dev", "--local",
      "--ip", "127.0.0.1", "--port", String(port),
      "--env-file", envFile,
      "--var", "ENVIRONMENT:development",
      "--var", `APP_BASE_URL:${baseUrl}`,
      "--var", `AUTH_BASE_URL:${baseUrl}`,
      "--var", `WEB_BASE_URL:${baseUrl}`,
      "--persist-to", join(workDir, "state"),
    ],
    {
      cwd: apiDir,
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: "false",
        CI: "1",
        SSL_CERT_FILE: certs.caCert,
        NODE_EXTRA_CA_CERTS: certs.caCert,
      },
      stdio: ["ignore", "pipe", "inherit"],
    },
  );
  wrangler.stdout.on("data", (chunk) => {
    workerOutput = (workerOutput + chunk.toString()).slice(-200_000);
  });
  wrangler.on("exit", (code) => {
    if (!tornDown && code !== 0 && code !== null) console.error(`local-stack: wrangler exited with ${code}`);
  });
  await waitForHealth(baseUrl);

  if (smokeMode) {
    await smoke(baseUrl);
    return;
  }

  console.log(`local-stack: API ready at ${baseUrl}`);
  console.log(`local-stack: seeded account ${SEED_EMAIL}; scratch database ${dbName} (dropped on exit)`);
  console.log("local-stack: press Ctrl+C to stop");
  await new Promise(() => undefined); // run until a signal arrives
}

main()
  .then(() => teardown().then(() => process.exit(0)))
  .catch((error) => {
    console.error(`local-stack: ${error.message}`);
    return teardown().then(() => process.exit(1));
  });
