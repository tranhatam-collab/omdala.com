import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const infraDir = fileURLToPath(new URL("..", import.meta.url));
const compose = readFileSync(resolve(infraDir, "docker-compose.yml"), "utf8");
const stagingCompose = readFileSync(resolve(infraDir, "docker-compose.staging.yml"), "utf8");
const caddy = readFileSync(resolve(infraDir, "caddy/Caddyfile"), "utf8");

function containerNamesByService(source) {
  const names = new Map();
  let service;
  for (const line of source.split(/\r?\n/)) {
    const header = /^  ([a-z][a-z0-9-]*):$/.exec(line);
    if (header) service = header[1];
    const name = /^    container_name: ([a-z][a-z0-9-]*)$/.exec(line);
    if (name) {
      assert.ok(service, "container_name must belong to a service");
      names.set(service, name[1]);
    }
  }
  return names;
}

test("Compose build contexts and bind sources exist relative to its base file", () => {
  const buildContexts = [...compose.matchAll(/^\s+context: (\.\/[^\s]+)$/gm)]
    .map((match) => match[1]);
  const bindSources = [...compose.matchAll(/^\s+- (\.\/[^:\s]+):\//gm)]
    .map((match) => match[1]);

  assert.equal(buildContexts.length, 3);
  assert.equal(bindSources.length, 2);
  for (const path of [...buildContexts, ...bindSources]) {
    assert.ok(existsSync(resolve(infraDir, path)), `${path} is absent`);
  }
});

test("Caddy site addresses follow the selected Infra environment domain", () => {
  const sites = [...caddy.matchAll(/^([^#\s][^\n]*) \{$/gm)]
    .map((match) => match[1]);
  assert.deepEqual(sites, [
    ":80",
    "{$INFRA_DOMAIN}",
    "api.{$INFRA_DOMAIN}",
    "auth.{$INFRA_DOMAIN}",
    "monitor.{$INFRA_DOMAIN}",
  ]);

  const stagingDomain = "staging.infra.omdala.com";
  assert.deepEqual(
    sites.slice(1).map((site) => site.replace("{$INFRA_DOMAIN}", stagingDomain)),
    [
      stagingDomain,
      `api.${stagingDomain}`,
      `auth.${stagingDomain}`,
      `monitor.${stagingDomain}`,
    ],
  );
  const productionDomain = "infra.omdala.com";
  assert.deepEqual(
    sites.slice(1).map((site) => site.replace("{$INFRA_DOMAIN}", productionDomain)),
    [
      productionDomain,
      `api.${productionDomain}`,
      `auth.${productionDomain}`,
      `monitor.${productionDomain}`,
    ],
  );
});

test("every staging container has a name separate from the base stack", () => {
  const base = containerNamesByService(compose);
  const staging = containerNamesByService(stagingCompose);
  assert.equal(base.size, 9);
  assert.deepEqual([...staging.keys()].sort(), [...base.keys()].sort());
  assert.equal(new Set(staging.values()).size, staging.size);
  for (const [service, name] of staging) {
    assert.match(name, /^omdala-staging-/);
    assert.notEqual(name, base.get(service));
  }
});

test("staging worker receives the sink and staging runtime mode", () => {
  assert.match(stagingCompose, /worker:\n(?:.|\n)*?NODE_ENV=staging/);
  assert.match(stagingCompose, /EMAIL_STAGING_SINK_ADDRESS=\$\{EMAIL_STAGING_SINK_ADDRESS\}/);
  assert.doesNotMatch(compose, /EMAIL_STAGING_SINK_ADDRESS/);
});
