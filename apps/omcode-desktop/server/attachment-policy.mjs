import fs from "node:fs/promises";
import path from "node:path";
import { execute } from "./local.mjs";
import { assertEgressAllowed } from "./egress-policy.mjs";

const sensitive =
  /(^|\/)(\.git|\.env(?:\..*)?|\.npmrc|\.pypirc|\.aws|\.ssh|\.wrangler|auth(?:-profiles)?\.json|credentials(?:\.[^/]*)?|secrets?(?:\.[^/]*)?|service[-_]account[^/]*|id_[^/]+|terraform\.tfstate(?:\..*)?|wrangler\.(?:jsonc?|toml))($|\/)|\.(?:pem|key|p12|pfx|keystore)$/i;
export function assertSafeAttachmentPath(file) {
  if (
    typeof file !== "string" ||
    !file ||
    path.isAbsolute(file) ||
    file.includes("\\") ||
    file.includes("\0") ||
    file.split("/").includes("..") ||
    sensitive.test(file)
  )
    throw new Error("Tệp nhạy cảm/đường dẫn không hợp lệ: không dùng cho AI.");
}
function ignored(pattern, file) {
  if (!pattern || pattern.startsWith("#")) return false;
  // Ignore rules are deny-only: a negation cannot override an egress deny.
  if (pattern.startsWith("!")) return false;
  const anchored = pattern.startsWith("/");
  pattern = pattern.replace(/^\//, "").replace(/\/$/, "");
  const expression = pattern
    .split("**")
    .map((part) =>
      part
        .split("*")
        .map((p) =>
          p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\?/g, "[^/]"),
        )
        .join("[^/]*"),
    )
    .join(".*");
  return new RegExp((anchored ? "^" : "(?:^|/)") + expression + "(?:$|/)").test(
    file,
  );
}
export async function validateAttachments(project, attachments = []) {
  if (!Array.isArray(attachments) || attachments.length > 5)
    throw new Error("Tối đa 5 tệp đính kèm.");
  const output = [];
  for (const item of attachments) {
    assertSafeAttachmentPath(item.path);
    if (
      typeof item.content !== "string" ||
      Buffer.byteLength(item.content) > 150000
    )
      throw new Error("Tệp đính kèm quá lớn.");
    const directories = [
      "",
      ...path
        .dirname(item.path)
        .split("/")
        .filter((p) => p !== "."),
    ];
    let directory = "";
    for (const part of directories) {
      directory = path.join(directory, part);
      for (const filename of [".omcodeignore", ".gitignore"]) {
        let rules = "";
        try {
          rules = await fs.readFile(
            path.join(project, directory, filename),
            "utf8",
          );
        } catch (error) {
          if (error.code !== "ENOENT")
            throw new Error("Không đọc được chính sách bỏ qua tệp.");
        }
        if (
          rules
            .split(/\r?\n/)
            .some((rule) =>
              ignored(rule.trim(), path.relative(directory, item.path)),
            )
        )
          throw new Error(
            "Tệp bị loại bởi .omcodeignore/.gitignore; chưa gửi dữ liệu.",
          );
      }
    }
    const git = await execute(
      "/usr/bin/git",
      [
        "-c",
        "core.excludesFile=/dev/null",
        "check-ignore",
        "--no-index",
        "--stdin",
        "-z",
      ],
      { cwd: project, input: `${item.path}\0`, timeout: 3000 },
    );
    if (git.code === 0) throw new Error("Tệp bị Git ignore; chưa gửi dữ liệu.");
    if (git.code !== 1 && git.code !== 128)
      throw new Error("Không kiểm chứng được chính sách tệp.");
    assertEgressAllowed(item.content);
    output.push({ path: item.path, content: item.content });
  }
  return output;
}
