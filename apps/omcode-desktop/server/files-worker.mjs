import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
const EXCLUDE = new Set([
  ".git",
  "node_modules",
  ".next",
  ".turbo",
  ".wrangler",
  ".venv",
  "venv",
  "dist",
  "build",
  "coverage",
  ".DS_Store",
]);
const hash = (s) => createHash("sha256").update(s).digest("hex");
let input = "";
for await (const chunk of process.stdin) input += chunk;
try {
  const {
    operation,
    root,
    file = "",
    content,
    expectedHash,
  } = JSON.parse(input);
  const resolvedRoot = await fs.realpath(root);
  if (!(await fs.stat(resolvedRoot)).isDirectory())
    throw new Error("Thư mục dự án không hợp lệ.");
  if (resolvedRoot === "/" || resolvedRoot === process.env.HOME)
    throw new Error(
      "Hãy chọn một dự án cụ thể, không chọn toàn bộ máy hoặc thư mục người dùng.",
    );
  const absolute = path.resolve(resolvedRoot, file);
  const inside = (p) =>
    p === resolvedRoot || p.startsWith(resolvedRoot + path.sep);
  if (!inside(absolute)) throw new Error("Đường dẫn nằm ngoài dự án.");
  const parent = await fs.realpath(path.dirname(absolute));
  if (absolute !== resolvedRoot && !inside(parent))
    throw new Error("Liên kết trỏ ra ngoài dự án.");
  let info;
  try {
    info = await fs.lstat(absolute);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  if (info?.isSymbolicLink()) throw new Error("Không mở liên kết tượng trưng.");
  let result;
  if (operation === "open")
    result = { root: resolvedRoot, name: path.basename(resolvedRoot) };
  else if (operation === "list") {
    const entries = await fs.readdir(absolute, { withFileTypes: true });
    const safe = entries.filter(
      (e) => !EXCLUDE.has(e.name) && !e.isSymbolicLink(),
    );
    safe.sort(
      (a, b) =>
        Number(b.isDirectory()) - Number(a.isDirectory()) ||
        a.name.localeCompare(b.name),
    );
    result = {
      entries: safe.slice(0, 400).map((e) => ({
        name: e.name,
        path: path.relative(resolvedRoot, path.join(absolute, e.name)),
        directory: e.isDirectory(),
      })),
      truncated: safe.length > 400,
    };
  } else if (operation === "read" || operation === "write") {
    if (file.split(path.sep).includes(".git"))
      throw new Error("Git metadata được bảo vệ.");
    if (info && (!info.isFile() || info.size > 2 * 1024 * 1024))
      throw new Error("Chỉ mở tệp văn bản tối đa 2 MiB.");
    const before = info ? await fs.readFile(absolute, "utf8") : "";
    if (before.includes("\0"))
      throw new Error("Tệp nhị phân không mở trong trình soạn thảo.");
    if (operation === "read") {
      if (!info) throw new Error("Tệp không tồn tại.");
      result = { content: before, hash: hash(before) };
    } else {
      if (
        typeof content !== "string" ||
        Buffer.byteLength(content) > 2 * 1024 * 1024
      )
        throw new Error("Nội dung tệp không hợp lệ.");
      if (expectedHash !== hash(before))
        throw new Error(
          "Tệp đã thay đổi ở ngoài OMCODE. Tải lại trước khi lưu để tránh ghi đè.",
        );
      const temporary = path.join(parent, `.omcode-save-${randomUUID()}`);
      await fs.writeFile(temporary, content, {
        mode: info ? info.mode & 0o777 : 0o600,
        flag: "wx",
      });
      try {
        const current = await fs.lstat(absolute).catch((error) => {
          if (error.code === "ENOENT") return null;
          throw error;
        });
        if (
          current?.isSymbolicLink() ||
          (current && !current.isFile()) ||
          expectedHash !==
            hash(current ? await fs.readFile(absolute, "utf8") : "") ||
          (await fs.realpath(path.dirname(absolute))) !== parent
        )
          throw new Error("Tệp đã thay đổi trong khi lưu; không ghi đè.");
        await fs.rename(temporary, absolute);
      } finally {
        await fs.unlink(temporary).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
      result = { before, hash: hash(content) };
    }
  } else throw new Error("Thao tác tệp không hợp lệ.");
  process.stdout.write(JSON.stringify({ result }));
} catch (error) {
  process.stdout.write(JSON.stringify({ error: error.message }));
  process.exitCode = 1;
}
