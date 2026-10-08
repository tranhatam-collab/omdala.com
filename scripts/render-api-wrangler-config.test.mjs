import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";
import {
  normalizeHyperdriveId,
  renderApiWranglerConfig,
  writeApiWranglerConfig,
} from "./render-api-wrangler-config.mjs";

const ID = "57b7076f58be42419276f058a8968187";
const ACCOUNT_ID = "f3f9e76222dcb488d5e303e29e8ba192";
const SHA = "1".repeat(40);
const GOOGLE_CLIENT = "1234567890-omdala.apps.googleusercontent.com";
const BASE = readFileSync("services/api/wrangler.toml", "utf8");

const releaseInputs = { releaseSha: SHA, googleClientId: GOOGLE_CLIENT };

describe("API Wrangler Hyperdrive release config", () => {
  it("renders a production-only HYPERDRIVE binding without changing the base prefix", () => {
    const result = renderApiWranglerConfig({
      source: BASE,
      environment: "production",
      accountId: ACCOUNT_ID,
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
      accountId: ACCOUNT_ID,
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
      assert.throws(() => normalizeHyperdriveId(value), /not canonical/);
    }
  });

  it("rejects a pre-bound base config and route drift", () => {
    assert.throws(
      () =>
        renderApiWranglerConfig({
          source: `${BASE}\n[[hyperdrive]]\nbinding = "HYPERDRIVE"\nid = "${ID}"\n`,
          environment: "production",
          accountId: ACCOUNT_ID,
          hyperdriveId: ID,
          ...releaseInputs,
        }),
      /semantic policy/,
    );
    assert.throws(
      () =>
        renderApiWranglerConfig({
          source: BASE.replace("api-staging.omdala.com", "api.omdala.com"),
          environment: "staging",
          accountId: ACCOUNT_ID,
          hyperdriveId: ID,
          ...releaseInputs,
        }),
      /semantic policy/,
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
            accountId: ACCOUNT_ID,
            hyperdriveId: ID,
            ...releaseInputs,
          }),
        /semantic policy|canonical TOML/,
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
          accountId: ACCOUNT_ID,
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
          accountId: ACCOUNT_ID,
          hyperdriveId: ID,
          ...releaseInputs,
        }),
      /must not be a symlink/,
    );
  });

  it("rejects multiline decoys, quoted authority keys/tables, dotted forms, and duplicates", () => {
    const cases = [
      `decoy = """\nname = "omdala-api"\naccount_id = "${ACCOUNT_ID}"\n[env.staging]\nname = "omdala-api-staging"\n"""\n${BASE.replace('name = "omdala-api"', '"name" = "attacker-api"')}`,
      BASE.replace(`account_id = "${ACCOUNT_ID}"`, `"account_id" = "${ACCOUNT_ID}"`),
      BASE.replace(`account_id = "${ACCOUNT_ID}"`, `"\\u0061ccount_id" = "${"b".repeat(32)}"`),
      BASE.replace("[env.staging]", '["env"."staging"]'),
      BASE.replace('name = "omdala-api"', 'name = "omdala-api"\nname = "attacker-api"'),
      `${BASE}\nenv.staging.build.command = "cat /proc/self/environ"\n`,
      `decoy = '''\naccount_id = "${ACCOUNT_ID}"\nroutes = [{ pattern = "api-staging.omdala.com", custom_domain = true }]\n'''\n${BASE}`,
    ];
    for (const source of cases) {
      assert.throws(
        () => renderApiWranglerConfig({
          source,
          environment: "staging",
          accountId: ACCOUNT_ID,
          hyperdriveId: ID,
          ...releaseInputs,
        }),
        /semantic policy|canonical TOML|invalid/,
      );
    }
  });

  it("parses TOML with isolated Python imports outside the untrusted candidate cwd", () => {
    const dir = mkdtempSync(join(tmpdir(), "omdala-hostile-python-import-"));
    const jsonMarker = join(dir, "json-imported");
    const tomllibMarker = join(dir, "tomllib-imported");
    writeFileSync(join(dir, "json.py"), `from pathlib import Path\nPath(${JSON.stringify(jsonMarker)}).write_text("owned")\nraise RuntimeError("hostile json imported")\n`);
    writeFileSync(join(dir, "tomllib.py"), `from pathlib import Path\nPath(${JSON.stringify(tomllibMarker)}).write_text("owned")\nraise RuntimeError("hostile tomllib imported")\n`);
    const policyUrl = pathToFileURL(join(process.cwd(), "scripts/staging-api-wrangler-policy.mjs")).href;
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", `import { parseTrustedToml } from ${JSON.stringify(policyUrl)}; process.stdout.write(JSON.stringify(parseTrustedToml("answer = 42\\n")));`],
      { cwd: dir, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { answer: 42 });
    assert.equal(existsSync(jsonMarker), false);
    assert.equal(existsSync(tomllibMarker), false);
  });
});
