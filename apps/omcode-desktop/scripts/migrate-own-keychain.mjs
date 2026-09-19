import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";

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
      if (code !== 0)
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
for (const id of ["google", "deepseek", "cerebras"]) {
  const original = await invoke(legacy, "--keychain-get", id);
  await invoke(helper, "--keychain-set", id, original);
  const restored = await invoke(helper, "--keychain-get", id);
  const verified =
    original.length === restored.length && timingSafeEqual(original, restored);
  original.fill(0);
  restored.fill(0);
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
