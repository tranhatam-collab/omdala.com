import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const worker = fileURLToPath(new URL("./files-worker.mjs", import.meta.url));
const children = new Set();
process.on("exit", () => {
  for (const pid of children)
    try {
      process.kill(-pid, "SIGTERM");
    } catch {}
});
export function execute(
  command,
  args,
  { cwd, input, timeout = 20000, signal, env = process.env } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });
    if (child.pid) children.add(child.pid);
    let stdout = "",
      stderr = "",
      done = false,
      timedOut = false;
    const stop = () => {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {}
    };
    const timer = setTimeout(() => {
      timedOut = true;
      stop();
    }, timeout);
    const hard = setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {}
    }, timeout + 1500);
    signal?.addEventListener("abort", stop, { once: true });
    const finish = (error, code) => {
      if (done) return;
      done = true;
      children.delete(child.pid);
      clearTimeout(timer);
      clearTimeout(hard);
      signal?.removeEventListener("abort", stop);
      if (error) reject(error);
      else resolve({ stdout, stderr, code, timedOut });
    };
    child.on("error", (e) => finish(e));
    child.stdout.on("data", (d) => {
      stdout += d;
      if (stdout.length > 512000) {
        stdout = stdout.slice(0, 512000) + "\n[Đã đạt giới hạn đầu ra]";
        stop();
      }
    });
    child.stderr.on("data", (d) => {
      stderr = (stderr + d).slice(-64000);
    });
    child.on("close", (code) => finish(null, code));
    child.stdin.on("error", () => {});
    child.stdin.end(input || "");
  });
}
export async function files(operation, root, file = "", extra = {}) {
  const output = await execute(process.execPath, [worker], {
    input: JSON.stringify({ operation, root, file, ...extra }),
    timeout: 8000,
  });
  if (output.timedOut)
    throw new Error(
      "Đọc dự án quá 8 giây. Kiểm tra quyền Documents hoặc tải tệp iCloud về máy.",
    );
  let data;
  try {
    data = JSON.parse(output.stdout);
  } catch {
    throw new Error("Không đọc được tệp local.");
  }
  if (data.error) throw new Error(data.error);
  return data.result;
}
export async function gitStatus(root) {
  const r = await execute(
    "/usr/bin/git",
    [
      "--no-optional-locks",
      "-c",
      "core.fsmonitor=false",
      "status",
      "--porcelain=v1",
      "-z",
      "--untracked-files=normal",
    ],
    { cwd: root, timeout: 10000 },
  );
  if (r.code !== 0)
    return {
      available: false,
      error: r.timedOut ? "Git quá thời gian." : r.stderr.slice(0, 400),
      files: [],
    };
  const records = r.stdout.split("\0").filter(Boolean);
  const list = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    list.push({ status: record.slice(0, 2), path: record.slice(3) });
    if (/[RC]/.test(record.slice(0, 2))) i++;
  }
  const branch = await execute("/usr/bin/git", ["branch", "--show-current"], {
    cwd: root,
    timeout: 4000,
  });
  return { available: true, branch: branch.stdout.trim(), files: list };
}
