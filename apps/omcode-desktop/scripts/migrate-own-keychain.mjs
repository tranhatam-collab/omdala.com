import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";

// OMCODE holds AIAGENT credentials only (Founder rule: AIAGENT is the sole
// remote AI provider). A one-off migration may name a subset through
// OMCODE_MIGRATE_IDS="aiagent,aiagent-staging"; any other account is refused
// so this script can never recreate a third-party provider credential.
const ALLOWED_IDS = new Set(["aiagent", "aiagent-staging"]);
// Helper exit code for a Keychain account that does not exist.
const ABSENT = 3;

const legacy = process.env.OMCODE_LEGACY_NATIVE;
const helper = process.env.OMCODE_KEYCHAIN_PATH;
if (!legacy || !helper)
  throw new Error("Set explicit legacy OMCODE binary and new OMCODE helper.");
function invoke(binary, mode, id, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, [mode, id], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const chunks = [];
    const timer = setTimeout(() => child.kill("SIGTERM"), 12000);
    child.stdout.on("data", (part) => chunks.push(part));
    child.stderr.resume();
    child.stdin.on("error", () => {});
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === ABSENT && mode === "--keychain-get") resolve(null);
      else if (code !== 0)
        reject(
          new Error(
            "OMCODE Keychain operation failed for " + id + ", code " + code,
          ),
        );
      else resolve(Buffer.concat(chunks));
    });
    child.stdin.end(input);
  });
}
const ids = (process.env.OMCODE_MIGRATE_IDS || "aiagent,aiagent-staging")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);
for (const id of ids)
  if (!ALLOWED_IDS.has(id))
    throw new Error(
      "OMCODE Keychain migration chỉ nhận tài khoản AIAGENT: " + id,
    );
for (const id of ids) {
  const original = await invoke(legacy, "--keychain-get", id);
  if (original === null) {
    console.log(JSON.stringify({ provider: id, skipped: "absent" }));
    continue;
  }
  await invoke(helper, "--keychain-set", id, original);
  const restored = await invoke(helper, "--keychain-get", id);
  const verified =
    restored !== null &&
    original.length === restored.length &&
    timingSafeEqual(original, restored);
  original.fill(0);
  if (restored) restored.fill(0);
  if (!verified) throw new Error("OMCODE Keychain verification failed.");
  console.log(
    JSON.stringify({
      provider: id,
      copiedWithinOMCODE: true,
      originalRetained: true,
      verified,
    }),
  );
}
