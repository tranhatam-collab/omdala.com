import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./restore-test.sh", import.meta.url));

test("legacy restore drill fails before sourcing env or contacting providers", () => {
  const dir = mkdtempSync(join(tmpdir(), "omdala-restore-guard-"));
  const bin = join(dir, "bin");
  mkdirSync(bin);
  writeFileSync(join(dir, ".env"), "touch sourced-env\n");
  for (const command of ["aws", "docker", "gunzip"]) {
    writeFileSync(join(bin, command), "#!/bin/sh\ntouch provider-called\nexit 0\n", { mode: 0o755 });
  }

  try {
    const result = spawnSync(script, [], {
      cwd: dir,
      encoding: "utf8",
      env: { PATH: `${bin}:/usr/bin:/bin` },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /legacy restore-test is disabled/);
    assert.doesNotMatch(result.stdout + result.stderr, /RESTORE TEST PASSED|Safe for production/);
    assert.equal(existsSync(join(dir, "sourced-env")), false);
    assert.equal(existsSync(join(dir, "provider-called")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
