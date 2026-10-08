import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { scanArtifactJson } from "./scan-staging-artifacts-for-secrets.mjs";

describe("staging artifact secret scanner", () => {
  it("accepts canonical non-secret JSON", () => {
    const directory = mkdtempSync(join(tmpdir(), "omdala-artifact-scan-"));
    try {
      const path = join(directory, "receipt.json");
      writeFileSync(path, '{"verdict":"accepted","secret_values_logged":false}\n');
      assert.equal(scanArtifactJson([path], ["protected-secret", "sink@example.invalid"]).length, 1);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it("rejects direct, nested, and base64-embedded protected values", () => {
    const directory = mkdtempSync(join(tmpdir(), "omdala-artifact-scan-"));
    try {
      const secret = "protected-secret";
      for (const [name, value] of [
        ["direct", { value: secret }],
        ["nested", { nested: [{ status: `prefix-${secret}-suffix` }] }],
        ["base64", { payload: Buffer.from(JSON.stringify({ value: secret })).toString("base64") }],
      ]) {
        const path = join(directory, `${name}.json`);
        writeFileSync(path, `${JSON.stringify(value)}\n`);
        assert.throws(() => scanArtifactJson([path], [secret, "sink@example.invalid"]), /protected literal/);
      }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
