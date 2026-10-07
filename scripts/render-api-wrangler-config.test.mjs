import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  normalizeHyperdriveId,
  renderApiWranglerConfig,
  writeApiWranglerConfig,
} from "./render-api-wrangler-config.mjs";

const ID = "57b7076f58be42419276f058a8968187";
const SHA = "1".repeat(40);
const GOOGLE_CLIENT = "1234567890-omdala.apps.googleusercontent.com";
const BASE = readFileSync("services/api/wrangler.toml", "utf8");

const releaseInputs = { releaseSha: SHA, googleClientId: GOOGLE_CLIENT };

describe("API Wrangler Hyperdrive release config", () => {
  it("renders a production-only HYPERDRIVE binding without changing the base prefix", () => {
    const result = renderApiWranglerConfig({
      source: BASE,
      environment: "production",
      hyperdriveId: ID,
      ...releaseInputs,
    });
    assert.match(result.rendered, new RegExp(`^RELEASE_SHA = "${SHA}"$`, "m"));
    assert.match(result.rendered, new RegExp(`^GOOGLE_CLIENT_ID = "${GOOGLE_CLIENT.replaceAll(".", "\\.")}"$`, "m"));
    assert.match(result.rendered, /^\[\[hyperdrive\]\]$/m);
    assert.doesNotMatch(result.rendered, /^\[\[env\.staging\.hyperdrive\]\]$/m);
    assert.equal(result.receipt.hyperdrive_id, ID);
    assert.equal(result.receipt.binding_scope, "hyperdrive");
  });

  it("renders a staging-only HYPERDRIVE binding", () => {
    const result = renderApiWranglerConfig({
      source: BASE,
      environment: "staging",
      hyperdriveId: ID,
      ...releaseInputs,
    });
    assert.doesNotMatch(result.rendered, /^\[\[hyperdrive\]\]$/m);
    assert.match(result.rendered, /^\[\[env\.staging\.hyperdrive\]\]$/m);
    assert.match(result.rendered, /^binding = "HYPERDRIVE"$/m);
    assert.match(result.rendered, new RegExp(`^id = "${ID}"$`, "m"));
    assert.equal(result.receipt.binding_scope, "env.staging.hyperdrive");
  });

  it("rejects missing, malformed, and non-canonical IDs", () => {
    for (const value of [
      "",
      "57b7076f58be42419276f058a896818",
      "57B7076F58BE42419276F058A8968187",
      "57b7076f-58be-4241-9276-f058a8968187",
      `${ID}\n[[unsafe]]`,
    ]) {
      assert.throws(() => normalizeHyperdriveId(value), /canonical 32-character/);
    }
  });

  it("rejects a pre-bound base config and route drift", () => {
    assert.throws(
      () =>
        renderApiWranglerConfig({
          source: `${BASE}\n[[hyperdrive]]\nbinding = "HYPERDRIVE"\nid = "${ID}"\n`,
          environment: "production",
          hyperdriveId: ID,
          ...releaseInputs,
        }),
      /must not contain a Hyperdrive table/,
    );
    assert.throws(
      () =>
        renderApiWranglerConfig({
          source: BASE.replace("api-staging.omdala.com", "api.omdala.com"),
          environment: "staging",
          hyperdriveId: ID,
          ...releaseInputs,
        }),
      /Staging API route/,
    );
  });

  it("rejects AIAGENT destination/workspace drift and legacy direct-provider variables", () => {
    for (const source of [
      BASE.replace("https://api.aiagent.iai.one", "https://example.invalid"),
      BASE.replace("omdala-com-staging", "omdala-com-production"),
      `${BASE}\nAI_API_URL = "https://example.invalid"\n`,
      `${BASE}\nOPENAI_API_KEY = "forbidden"\n`,
    ]) {
      assert.throws(
        () =>
          renderApiWranglerConfig({
            source,
            environment: "staging",
            hyperdriveId: ID,
            ...releaseInputs,
          }),
        /AIAGENT|direct-provider/,
      );
    }
  });

  it("writes only beside the base config and refuses symlink outputs", () => {
    const dir = mkdtempSync(join(tmpdir(), "omdala-api-config-"));
    const other = mkdtempSync(join(tmpdir(), "omdala-api-config-other-"));
    const input = join(dir, "wrangler.toml");
    const output = join(dir, "wrangler.release.toml");
    writeFileSync(input, BASE);
    assert.throws(
      () =>
        writeApiWranglerConfig({
          inputPath: input,
          outputPath: join(other, "wrangler.release.toml"),
          environment: "staging",
          hyperdriveId: ID,
          ...releaseInputs,
        }),
      /must be written beside/,
    );
    symlinkSync(join(dir, "symlink-target.toml"), output);
    assert.throws(
      () =>
        writeApiWranglerConfig({
          inputPath: input,
          outputPath: output,
          environment: "staging",
          hyperdriveId: ID,
          ...releaseInputs,
        }),
      /must not be a symlink/,
    );
  });
});
