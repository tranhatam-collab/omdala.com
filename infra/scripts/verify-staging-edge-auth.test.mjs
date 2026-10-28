import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { detectStagingEdgeAuthHazards } from "./verify-staging-edge-auth.mjs";

const infraDir = fileURLToPath(new URL("..", import.meta.url));
const base = readFileSync(resolve(infraDir, "docker-compose.yml"), "utf8");
const staging = readFileSync(resolve(infraDir, "docker-compose.staging.yml"), "utf8");
const caddy = readFileSync(resolve(infraDir, "caddy/Caddyfile"), "utf8");

test("current staging source is blocked for Keycloak dev mode and disabled Caddy HTTPS automation", () => {
  assert.deepEqual(detectStagingEdgeAuthHazards(base, staging, caddy), [
    "STAGING_KEYCLOAK_DEV_MODE_OR_COMMAND_UNVERIFIED",
    "STAGING_CADDY_HTTPS_AUTOMATION_DISABLED",
  ]);
  const result = spawnSync(process.execPath, [resolve(infraDir, "scripts/verify-staging-edge-auth.mjs")], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /STAGING_KEYCLOAK_DEV_MODE_OR_COMMAND_UNVERIFIED/);
  assert.match(result.stderr, /STAGING_CADDY_HTTPS_AUTOMATION_DISABLED/);
});

test("reviewed production-mode command and automatic HTTPS remove these source hazards", () => {
  const hardened = staging.replace("  keycloak:\n", "  keycloak:\n    command: start --optimized --http-enabled=true\n");
  assert.deepEqual(detectStagingEdgeAuthHazards(base, hardened, caddy.replace("\tauto_https off\n", "")), []);
});

test("a staging override cannot hide a development-mode command", () => {
  const override = staging.replace("  keycloak:\n", "  keycloak:\n    command: start-dev\n");
  assert.ok(detectStagingEdgeAuthHazards(base, override, caddy).includes("STAGING_KEYCLOAK_DEV_MODE_OR_COMMAND_UNVERIFIED"));
  const unparsed = staging.replace("  keycloak:\n", "  keycloak:\n    command: >\n      start-dev\n");
  assert.ok(detectStagingEdgeAuthHazards(base, unparsed, caddy).includes("STAGING_KEYCLOAK_DEV_MODE_OR_COMMAND_UNVERIFIED"));
});
