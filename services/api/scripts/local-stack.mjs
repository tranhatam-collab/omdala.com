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
// generated for this run only.
//
// Profiles (--profile=<name>):
//   persistent (default)  ENVIRONMENT=staging. Magic links and sessions live in
//                         PostgreSQL and survive a worker restart. Mail goes to a
//                         loopback stub sink, never to a provider; read it at the
//                         printed "mail inbox" URL.
//   development           ENVIRONMENT=development. Magic links and sessions are
//                         in memory (lost on restart); mail is printed to the
//                         worker console.
//
// The API always connects with TLS and verifies the certificate, and workerd
// ignores `rejectUnauthorized: false`. So the script makes a throwaway CA, runs a
// loopback TLS-terminating proxy in front of the scratch server, and hands the CA
// to workerd through SSL_CERT_FILE: verification stays ON, nothing is bypassed.
// Nothing is written to the repository; the scratch database, proxy, CA, mail
// sink and secrets are removed on exit.
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
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
const profile =
  process.argv.find((arg) => arg.startsWith("--profile="))?.split("=")[1] ?? "persistent";
if (!["persistent", "development"].includes(profile)) {
  console.error(`local-stack: unknown profile "${profile}" (use persistent or development)`);
  process.exit(1);
}
const persistent = profile === "persistent";
const SINK_ADDRESS = "local-sink@example.test";
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
let mailSink;
const mailInbox = [];
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
  mailSink?.close();
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

function startMailSink() {
  return new Promise((resolvePromise, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method === "GET" && req.url === "/__inbox") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(mailInbox));
        return;
      }
      if (req.method === "POST" && req.url === "/emails") {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          let body = {};
          try {
            body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
          } catch {
            // keep the empty body; the API validates its own payload
          }
          mailInbox.push(body);
          res.writeHead(202, {
            "content-type": "application/json",
            "x-message-id": `local-sink-${mailInbox.length}`,
          });
          res.end('{"status":"queued"}');
        });
        return;
      }
      res.writeHead(404).end();
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolvePromise(server));
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

const jsonPost = (url, body, headers = {}) =>
  fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const cookieHeader = (response) =>
  response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");

async function findLoginToken(read) {
  for (let i = 0; i < 40; i++) {
    const token = read()?.match(/[?&]token=([A-Za-z0-9_%.\-]+)/)?.[1];
    if (token) return decodeURIComponent(token);
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("the login link did not arrive in the local mail output");
}

async function expectProfile(baseUrl, cookies, label) {
  const profileResponse = await fetch(`${baseUrl}/v1/account/profile`, { headers: { cookie: cookies } });
  const body = await profileResponse.json();
  if (profileResponse.status !== 200 || body.data?.displayName !== "Local Dev") {
    throw new Error(`${label}: profile read answered ${profileResponse.status}: ${JSON.stringify(body).slice(0, 200)}`);
  }
}

async function smoke(baseUrl, restartWorker) {
  const health = await fetch(`${baseUrl}/health`);
  if (health.status !== 200) throw new Error(`GET /health answered ${health.status}`);
  const healthBody = await health.json();
  if (healthBody.ok !== true || healthBody.service !== "omdala-api") {
    throw new Error("GET /health body is not the expected omdala-api payload");
  }

  const request = await jsonPost(`${baseUrl}/v1/auth/magic-link/request`, {
    email: SEED_EMAIL,
    redirectTo: "/dashboard",
  });
  const body = await request.json();
  if (request.status !== 201 || body.ok !== true || body.data?.sent !== true) {
    throw new Error(`magic-link request answered ${request.status}: ${JSON.stringify(body).slice(0, 200)}`);
  }
  const transport = body.data?.deliveryReceipt?.transport;
  if (transport !== (persistent ? "mail-api" : "console")) {
    throw new Error(`unexpected mail transport "${transport}"; no mail may leave this stack`);
  }

  // The link arrives in the stub sink (persistent) or the worker console (development).
  const token = await findLoginToken(() =>
    persistent ? mailInbox.map((mail) => JSON.stringify(mail)).join("\n") : workerOutput,
  );
  if (persistent && !mailInbox.every((mail) => mail.to === SINK_ADDRESS)) {
    throw new Error("a mail reached the sink with a recipient other than the sink address");
  }

  const exchange = await jsonPost(`${baseUrl}/v1/auth/session/exchange`, { token });
  if (exchange.status !== 200) throw new Error(`session exchange answered ${exchange.status}`);
  const cookies = cookieHeader(exchange);
  if (!cookies.includes("omdala_access_token=")) throw new Error("session exchange set no access cookie");

  // The seeded account lives only in the scratch PostgreSQL database.
  await expectProfile(baseUrl, cookies, "after login");

  if (!persistent) {
    // Outside staging/production the /v2/reality routes are open; with a database
    // configured, scenes and runs are stored per owner in PostgreSQL.
    const owner = "local-test@omdala.invalid";
    const scenes = await (await fetch(`${baseUrl}/v2/reality/scenes`)).json();
    const sceneId = scenes.data?.scenes?.[0]?.scene_id;
    if (!sceneId) throw new Error("no scene came back from /v2/reality/scenes");
    const ran = await fetch(`${baseUrl}/v2/reality/scenes/${sceneId}/run`, { method: "POST" });
    const runs = await (await fetch(`${baseUrl}/v2/reality/runs`)).json();
    const stored = await scratch.query(
      `SELECT (SELECT count(*)::int FROM omdala.reality_scenes WHERE owner_email = $1) AS scenes,
              (SELECT count(*)::int FROM omdala.reality_runs WHERE owner_email = $1) AS runs`,
      [owner],
    );
    if (ran.status !== 200 || runs.data?.pagination?.total !== 1 || stored.rows[0].scenes < 1 || stored.rows[0].runs !== 1) {
      throw new Error(`scenes/runs were not persisted in PostgreSQL (run ${ran.status}, ${JSON.stringify(stored.rows[0])})`);
    }
    console.log(
      "local-stack smoke [development]: /health 200; magic-link request 201 (console transport); " +
        "session exchange 200; seeded profile read back from PostgreSQL; scenes and runs persisted in PostgreSQL",
    );
    return;
  }

  // Persistent auth: the link is consumed and the session exists in PostgreSQL ...
  const link = await scratch.query(
    "SELECT consumed_at IS NOT NULL AS consumed FROM omdala.auth_magic_links WHERE email = $1",
    [SEED_EMAIL],
  );
  const sessions = await scratch.query(
    "SELECT count(*)::int AS n FROM omdala.auth_sessions WHERE email = $1 AND revoked_at IS NULL",
    [SEED_EMAIL],
  );
  if (link.rows.length !== 1 || link.rows[0].consumed !== true || sessions.rows[0].n !== 1) {
    throw new Error("magic link and session state were not persisted in PostgreSQL");
  }

  // ... so a worker restart changes nothing: same session, link still single-use.
  await restartWorker();
  const session = await fetch(`${baseUrl}/v1/auth/session`, { headers: { cookie: cookies } });
  if (session.status !== 200) throw new Error(`session after restart answered ${session.status}`);
  await expectProfile(baseUrl, cookies, "after restart");
  const replay = await jsonPost(`${baseUrl}/v1/auth/session/exchange`, { token });
  if (replay.status !== 401) throw new Error(`replayed link after restart answered ${replay.status}, expected 401`);
  const refreshed = await fetch(`${baseUrl}/v1/auth/refresh`, { method: "POST", headers: { cookie: cookies } });
  if (refreshed.status !== 200) throw new Error(`refresh after restart answered ${refreshed.status}`);

  console.log(
    "local-stack smoke [persistent]: /health 200; magic-link request 201 (stub mail sink); " +
      "session exchange 200; link and session persisted in PostgreSQL; " +
      "session valid after worker restart; replayed link refused; refresh 200",
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
  // Applied set plus infra/postgres/migrations/proposed (migrations awaiting promotion).
  const migrationFiles = [migrationsDir, join(migrationsDir, "proposed")]
    .filter((dir) => existsSync(dir))
    .flatMap((dir) => readdirSync(dir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).map((n) => join(dir, n)))
    .sort((a, b) => a.split("/").pop().localeCompare(b.split("/").pop()));
  for (const file of migrationFiles) await scratch.query(readFileSync(file, "utf8"));
  await scratch.query(
    `INSERT INTO omdala.account_profiles (email, id, display_name) VALUES ($1, $2, $3)`,
    [SEED_EMAIL, `acc_local_${randomBytes(4).toString("hex")}`, "Local Dev"],
  );
  await scratch.query(`INSERT INTO omdala.account_preferences (email) VALUES ($1)`, [SEED_EMAIL]);

  // 3. throwaway CA + TLS proxy in front of the scratch server, optional stub mail
  //    sink, and run-time secrets, all in a private temp directory
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
  let mailUrl = "";
  if (persistent) {
    mailSink = await startMailSink();
    mailUrl = `http://127.0.0.1:${mailSink.address().port}`;
  }
  const envFile = join(workDir, "stack.env");
  writeFileSync(
    envFile,
    [
      `MAGIC_LINK_SECRET=${randomBytes(32).toString("hex")}`,
      `E2E_TEST_SECRET=${randomBytes(32).toString("hex")}`,
      `DATABASE_URL=${workerDbUrl.toString()}`,
      ...(persistent ? [`MAIL_API_KEY=${randomBytes(24).toString("hex")}`] : []),
      "",
    ].join("\n"),
    { mode: 0o600 },
  );

  // 4. the worker, local mode only; restartable so persistence can be proven
  const port = Number(process.env.OMDALA_LOCAL_API_PORT) || (await freePort());
  const baseUrl = `http://127.0.0.1:${port}`;
  const wranglerBin = join(apiDir, "node_modules/wrangler/bin/wrangler.js");
  const profileVars = persistent
    ? [
        "--var", "ENVIRONMENT:staging",
        "--var", "MAIL_DELIVERY_MODE:sink",
        "--var", "MAIL_API_WORKSPACE_ID:omdala.com-staging",
        "--var", `MAIL_STAGING_SINK_ADDRESS:${SINK_ADDRESS}`,
        "--var", `MAIL_API_URL:${mailUrl}`,
        "--var", "AIAGENT_API_URL:https://staging-api.aiagent.iai.one",
        "--var", "AIAGENT_WORKSPACE_ID:omdala-com-staging",
      ]
    : ["--var", "ENVIRONMENT:development"];

  const startWorker = () => {
    wrangler = spawn(
      process.execPath,
      [
        wranglerBin, "dev", "--local",
        "--ip", "127.0.0.1", "--port", String(port),
        "--env-file", envFile,
        ...profileVars,
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
  };
  const stopWorker = async () => {
    const child = wrangler;
    if (!child || child.exitCode !== null) return;
    const exited = new Promise((resolveExit) => child.once("exit", resolveExit));
    child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 10_000);
    await exited;
    clearTimeout(timer);
  };
  const restartWorker = async () => {
    const previousPid = wrangler.pid;
    await stopWorker();
    startWorker();
    if (wrangler.pid === previousPid) throw new Error("the worker was not replaced on restart");
    await waitForHealth(baseUrl);
  };

  startWorker();
  await waitForHealth(baseUrl);

  if (smokeMode) {
    await smoke(baseUrl, restartWorker);
    return;
  }

  console.log(`local-stack: API ready at ${baseUrl} (profile: ${profile})`);
  if (persistent) console.log(`local-stack: mail inbox at ${mailUrl}/__inbox (stub sink, loopback only)`);
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
