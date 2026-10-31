// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// Proves the client's TLS policy against a throwaway server that presents its
// own self-signed certificate, so the result does not depend on what the host
// trusts. The server speaks only the PostgreSQL SSLRequest + TLS handshake.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import tls from "node:tls";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ApiBindings } from "../contracts";
import { isAuthSessionActive } from "./auth-repository";

function opensslAvailable(): boolean {
  try {
    execFileSync("openssl", ["version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const haveOpenssl = opensslAvailable();
if (!haveOpenssl) {
  console.warn("tls-verification.test.ts skipped: openssl is not available to create a throwaway certificate");
}

describe.skipIf(!haveOpenssl)("PostgreSQL client TLS policy against an untrusted certificate", () => {
  const workDir = mkdtempSync(join(tmpdir(), "omdala-tls-"));
  let server: net.Server;
  let port = 0;
  let handshakes = 0;

  beforeAll(async () => {
    const keyPath = join(workDir, "key.pem");
    const certPath = join(workDir, "cert.pem");
    execFileSync("openssl", [
      "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
      "-subj", "/CN=untrusted.invalid", "-keyout", keyPath, "-out", certPath,
    ], { stdio: "ignore" });
    const key = readFileSync(keyPath);
    const cert = readFileSync(certPath);

    server = net.createServer((socket) => {
      socket.once("data", (chunk: Buffer) => {
        // PostgreSQL SSLRequest: length 8, code 80877103
        if (chunk.length >= 8 && chunk.readInt32BE(0) === 8 && chunk.readInt32BE(4) === 80877103) {
          socket.write("S");
          const secure = new tls.TLSSocket(socket, { isServer: true, key, cert });
          secure.on("secure", () => {
            handshakes += 1;
            secure.destroy();
          });
          secure.on("error", () => undefined);
        } else {
          socket.destroy();
        }
      });
      socket.on("error", () => undefined);
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    port = (server.address() as net.AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
    rmSync(workDir, { recursive: true, force: true });
  });

  const env = (extra: Partial<ApiBindings> = {}) =>
    ({
      ENVIRONMENT: "test",
      DATABASE_URL: `postgresql://user@127.0.0.1:${port}/db`,
      ...extra,
    }) as ApiBindings;
  const lookup = (e: ApiBindings) =>
    isAuthSessionActive(e, { id: "11111111-1111-4111-8111-111111111111", email: "a@example.com" });

  it("refuses the untrusted certificate by default and never completes the handshake", async () => {
    const before = handshakes;
    await expect(lookup(env())).rejects.toThrow(/self[- ]signed|certificate|unable to verify/i);
    expect(handshakes).toBe(before);
  });

  it("completes the handshake only when verification is explicitly disabled in a test environment", async () => {
    const before = handshakes;
    // the fake server hangs up after the handshake, so the query itself fails
    await expect(lookup(env({ OMDALA_DB_TLS_INSECURE: "1" }))).rejects.toThrow();
    expect(handshakes).toBe(before + 1);
  });

  it("refuses the disable flag in production before opening any connection", async () => {
    const before = handshakes;
    await expect(
      lookup(env({ ENVIRONMENT: "production", OMDALA_DB_TLS_INSECURE: "1" })),
    ).rejects.toThrow("DB_TLS_INSECURE_REFUSED");
    expect(handshakes).toBe(before);
  });
});
