import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  verifyApiExecutionSafety,
  verifySurfaceExecutionSafety,
} from "./verify-staging-wrangler-execution-safety.mjs";
import { renderApiWranglerConfig } from "./render-api-wrangler-config.mjs";

const ACCOUNT_ID = "f3f9e76222dcb488d5e303e29e8ba192";
const HYPERDRIVE_ID = "a".repeat(32);
const RELEASE_SHA = "1".repeat(40);
const GOOGLE_CLIENT_ID = "1234567890-omdala.apps.googleusercontent.com";

function rendered() {
  return renderApiWranglerConfig({
    source: readFileSync("services/api/wrangler.toml", "utf8"),
    environment: "staging",
    accountId: ACCOUNT_ID,
    hyperdriveId: HYPERDRIVE_ID,
    releaseSha: RELEASE_SHA,
    googleClientId: GOOGLE_CLIENT_ID,
  }).rendered;
}

const EXPECTED = {
  accountId: ACCOUNT_ID,
  hyperdriveId: HYPERDRIVE_ID,
  releaseSha: RELEASE_SHA,
  googleClientId: GOOGLE_CLIENT_ID,
};

describe("staging Wrangler execution safety", () => {
  it("accepts the trusted rendered API shape and rejects custom commands", () => {
    const source = rendered();
    assert.equal(verifyApiExecutionSafety(source, EXPECTED).custom_build_hooks, false);
    assert.throws(
      () => verifyApiExecutionSafety(`${source}\n[build]\ncommand = "env > leaked"\n`, EXPECTED),
      /semantic policy/,
    );
    for (const injected of [
      'build.command = "env > leaked"',
      'build = { command = "env > leaked" }',
      'env.staging.build.command = "env > leaked"',
      '[env.staging.build]\ncommand = "env > leaked"',
      '"build" = { command = "env > leaked" }',
      '"\\u0062uild" = { command = "env > leaked" }',
    ]) {
      assert.throws(
        () => verifyApiExecutionSafety(`${source}\n${injected}\n`, EXPECTED),
        /semantic policy|invalid/,
        injected,
      );
    }
  });

  it("rejects multiline identity decoys, quoted keys/tables, and attacker authority", () => {
    const source = rendered();
    const attacks = [
      `decoy = """\nname = "omdala-api"\nmain = "src/index.ts"\n[env.staging]\nname = "omdala-api-staging"\n"""\n${source.replace('name = "omdala-api"', '"name" = "attacker-api"')}`,
      source.replace(`account_id = "${ACCOUNT_ID}"`, `"account_id" = "${"b".repeat(32)}"`),
      source.replace(`account_id = "${ACCOUNT_ID}"`, `"\\u0061ccount_id" = "${"b".repeat(32)}"`),
      source.replace("[env.staging]", '["env"."staging"]'),
      source.replace("api-staging.omdala.com", "attacker.example"),
      source.replace('main = "src/index.ts"', '"main" = "attacker.mjs"'),
      source.replace('name = "omdala-api-staging"', '"name" = "attacker-staging"'),
    ];
    for (const attack of attacks) {
      assert.throws(
        () => verifyApiExecutionSafety(attack, EXPECTED),
        /semantic policy|canonical TOML|invalid/,
      );
    }
  });

  it("accepts exact static surface config and rejects extra build authority", () => {
    const source = readFileSync("infra/staging/surfaces/web.wrangler.jsonc", "utf8");
    assert.equal(
      verifySurfaceExecutionSafety({ source, surface: "web" }).custom_build_hooks,
      false,
    );
    const mutated = JSON.parse(source);
    mutated.build = { command: "env" };
    assert.throws(
      () => verifySurfaceExecutionSafety({ source: JSON.stringify(mutated), surface: "web" }),
      /keys are not exact|canonical JSON/,
    );
  });

  it("rejects JSONC parser differentials and every non-canonical surface authority byte", () => {
    const source = readFileSync("infra/staging/surfaces/web.wrangler.jsonc", "utf8");
    for (const attack of [
      source.replace('"./static-worker.mjs"', '"./static-/*payload*/worker.mjs"'),
      source.replace('"./static-worker.mjs"', '"./attacker-worker.mjs"'),
      source.replace('"compatibility_date": "2026-10-07"', '"compatibility_date": "2024-01-01"'),
      source.replace(
        '"$schema": "../../../services/api/node_modules/wrangler/config-schema.json"',
        '"$schema": "https://attacker.invalid/schema.json"',
      ),
      source.replace("{\n", "{\n  // accepted by JSONC only\n"),
      source.replace('"name":', '/* decoy */ "name":'),
      source.replace('  "name":', '    "name":'),
    ]) {
      assert.throws(
        () => verifySurfaceExecutionSafety({ source: attack, surface: "web" }),
        /strict canonical JSON|exact trusted static surface shape|exact canonical JSON bytes/,
      );
    }
  });
});
