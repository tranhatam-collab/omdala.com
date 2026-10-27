import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const infraDir = fileURLToPath(new URL("..", import.meta.url));

function serviceBlock(compose, name) {
  const lines = compose.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `  ${name}:`);
  if (start < 0) return "";
  let end = start + 1;
  while (end < lines.length && !/^  [a-z][a-z0-9-]*:$/.test(lines[end]) &&
    !/^[a-z][a-z0-9_-]*:$/.test(lines[end])) end += 1;
  return lines.slice(start, end).join("\n");
}

function command(block) {
  return /^    command:\s*(.*)$/m.exec(block)?.[1] ?? "";
}

export function detectStagingEdgeAuthHazards(baseCompose, stagingCompose, caddyfile) {
  const errors = [];
  const baseKeycloak = serviceBlock(baseCompose, "keycloak");
  const stagingKeycloak = serviceBlock(stagingCompose, "keycloak");
  const effectiveCommand = command(stagingKeycloak) || command(baseKeycloak);
  if (!/^start(?:\s|$)/.test(effectiveCommand) || /\bstart-dev\b/.test(effectiveCommand)) {
    errors.push("STAGING_KEYCLOAK_DEV_MODE_OR_COMMAND_UNVERIFIED");
  }

  const caddyDirectives = caddyfile.split(/\r?\n/)
    .map((line) => line.replace(/\s*#.*$/, "").trim())
    .filter(Boolean);
  if (caddyDirectives.some((line) => /^auto_https\s+(?:off|disable_redirects|disable_certs)\s*$/.test(line))) {
    errors.push("STAGING_CADDY_HTTPS_AUTOMATION_DISABLED");
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = ["docker-compose.yml", "docker-compose.staging.yml", "caddy/Caddyfile"];
  const [baseCompose, stagingCompose, caddyfile] = files.map((name) =>
    readFileSync(resolve(infraDir, name), "utf8"));
  const errors = detectStagingEdgeAuthHazards(baseCompose, stagingCompose, caddyfile);
  if (errors.length) {
    for (const error of errors) console.error(`Staging edge/Auth source blocked: ${error}`);
    process.exit(1);
  }
  console.log("Staging edge/Auth source hazards absent (runtime TLS/Auth still requires receipt)");
}
