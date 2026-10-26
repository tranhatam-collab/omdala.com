import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./health-check.sh", import.meta.url));

function run(overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), "omdala-health-guard-"));
  const bin = join(dir, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "curl"), "#!/bin/sh\necho curl >> calls\nprintf 200\n", { mode: 0o755 });
  writeFileSync(join(bin, "docker"), `#!/bin/sh
echo "docker $*" >> calls
if [ "$1" = ps ]; then
  if [ "$FAKE_DOCKER_PS_FAIL" = 1 ]; then exit 1; fi
  for suffix in caddy postgres valkey api worker uptime keycloak backup; do
    printf 'omdala-staging-%s\\n' "$suffix"
  done
elif [ "$1" = inspect ]; then
  last=''
  for arg in "$@"; do last="$arg"; done
  if [ "$last" = omdala-staging-postgres ]; then
    printf '%s\\n' "$FAKE_POSTGRES_HEALTH"
  else
    printf 'healthy\\n'
  fi
elif [ "$1" = exec ]; then
  exit 0
else
  exit 99
fi
`, { mode: 0o755 });
  writeFileSync(join(bin, "df"), "#!/bin/sh\nprintf 'Filesystem Size Used Avail Use%% Mounted on\\nmock 100 1 99 %s%% /\\n' \"${FAKE_DISK_USAGE:-84}\"\n", { mode: 0o755 });
  try {
    const result = spawnSync(script, [], {
      cwd: dir,
      encoding: "utf8",
      env: {
        PATH: `${bin}:/usr/bin:/bin`,
        INFRA_ENVIRONMENT: "staging",
        INFRA_DOMAIN: "staging.infra.omdala.com",
        FAKE_POSTGRES_HEALTH: "healthy",
        FAKE_DOCKER_PS_FAIL: "0",
        ...overrides,
      },
    });
    return {
      ...result,
      calls: existsSync(join(dir, "calls")) ? readFileSync(join(dir, "calls"), "utf8") : "",
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("requires explicit staging identity before any HTTP or Docker call", () => {
  for (const overrides of [
    { INFRA_ENVIRONMENT: "" },
    { INFRA_DOMAIN: "infra.omdala.com" },
  ]) {
    const result = run(overrides);
    assert.equal(result.status, 1);
    assert.equal(result.calls, "");
    assert.doesNotMatch(result.stdout, /ALL CHECKS PASSED/);
  }
});

test("accepts healthy staging services with explicit identity", () => {
  const result = run();
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  assert.match(result.stdout, /ALL CHECKS PASSED/);
  assert.match(result.calls, /docker exec omdala-staging-postgres pg_isready/);
  assert.doesNotMatch(result.calls, /docker exec omdala-postgres /);
});

test("rejects unhealthy and missing container healthchecks", () => {
  for (const status of ["unhealthy", "no healthcheck"]) {
    const result = run({ FAKE_POSTGRES_HEALTH: status });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /\[FAIL\] PostgreSQL \(container:/);
    assert.doesNotMatch(result.stdout, /ALL CHECKS PASSED/);
  }
});

test("rejects an unavailable Docker inventory", () => {
  const result = run({ FAKE_DOCKER_PS_FAIL: "1" });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Docker inventory unavailable/);
  assert.doesNotMatch(result.stdout, /ALL CHECKS PASSED/);
});

test("rejects high or unreadable disk usage", () => {
  for (const usage of ["85", "unknown"]) {
    const result = run({ FAKE_DISK_USAGE: usage });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /\[FAIL\] Disk usage unavailable or high/);
    assert.doesNotMatch(result.stdout, /ALL CHECKS PASSED/);
  }
});
