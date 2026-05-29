// ─── useTerminal — Bash-like shell using File System Access API ─────────
"use client";

import { useState, useCallback } from "react";

export interface TerminalEntry {
  id: string;
  type: "command" | "output" | "error" | "info";
  text: string;
  timestamp: number;
}

let entryId = 0;
function nextId() {
  return `${++entryId}`;
}

export function useTerminal(
  rootHandle: FileSystemDirectoryHandle | null,
  t?: (key: string) => string,
) {
  const _t = t || ((k: string) => k);
  const [history, setHistory] = useState<TerminalEntry[]>([
    {
      id: nextId(),
      type: "info",
      text: _t("terminalWelcome"),
      timestamp: Date.now(),
    },
  ]);
  const [cwd, setCwd] = useState<string>("");

  const addEntry = useCallback((type: TerminalEntry["type"], text: string) => {
    setHistory((prev) => [...prev, { id: nextId(), type, text, timestamp: Date.now() }]);
  }, []);

  async function resolveCurrentDir() {
    if (!rootHandle) return null;
    let current = rootHandle;
    for (const part of cwd.split("/").filter(Boolean)) {
      current = await (current as any).getDirectoryHandle(part);
    }
    return current;
  }

  async function resolvePath(path: string) {
    if (!rootHandle) return null;
    if (!path) return rootHandle;
    const full = cwd ? `${cwd}/${path}` : path;
    let current = rootHandle;
    for (const part of full.split("/").filter(Boolean)) {
      current = await (current as any).getDirectoryHandle(part);
    }
    return current;
  }

  const executeCommand = useCallback(
    async (input: string) => {
      addEntry("command", `$ ${input}`);
      const args = input.trim().split(/\s+/);
      const cmd = args[0];

      if (!cmd) return;

      if (cmd === "help") {
        addEntry(
          "output",
          `${_t("cmdHelp")}:
  ls              Liệt kê file/thư mục
  cd <path>       Di chuyển thư mục
  pwd             Hiển thị đường dẫn hiện tại
  cat <file>      Hiển thị nội dung file
  cp <src> <dst>  Sao chép file
  mv <src> <dst>  Di chuyển/đổi tên file
  mkdir <name>    Tạo thư mục
  touch <name>    Tạo file rỗng
  rm <name>       Xóa file/thư mục
  echo <text>     In văn bản
  find <query>    Tìm file theo tên
  tree            Hiển thị cây thư mục
  date            Hiển thị ngày giờ hiện tại
  whoami          Thông tin người dùng
  which <cmd>     Kiểm tra lệnh
  clear           Xóa màn hình
  git <cmd>       Lệnh git cơ bản (status, log, branch)
  npm <cmd>       Thông tin npm
  pnpm <cmd>      Thông tin pnpm
  python <cmd>    Thông tin Python
  npx <cmd>       Thông tin npx`,
        );
        return;
      }

      if (cmd === "clear") {
        setHistory([
          {
            id: nextId(),
            type: "info",
            text: "OMDALA Terminal v1.0",
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      if (cmd === "date") {
        addEntry("output", new Date().toString());
        return;
      }

      if (cmd === "whoami") {
        addEntry("output", "omcode-user@local");
        return;
      }

      if (cmd === "which") {
        const target = args[1];
        if (!target) {
          addEntry("error", "which: thiếu tên lệnh.");
          return;
        }
        const builtins = ["ls", "cd", "pwd", "cat", "cp", "mv", "mkdir", "touch", "rm", "echo", "find", "tree", "date", "whoami", "which", "clear", "help", "git", "npm", "pnpm", "npx", "python", "node"];
        addEntry("output", builtins.includes(target) ? `${target}: builtin` : `${target}: not found`);
        return;
      }

      if (!rootHandle) {
        addEntry("error", _t("noFolderOpenTerminal"));
        return;
      }

      try {
        switch (cmd) {
          case "pwd": {
            addEntry("output", cwd || "/");
            break;
          }

          case "ls": {
            const targetPath = args[1] || cwd;
            let current = rootHandle;
            const parts = targetPath.split("/").filter(Boolean);
            for (const part of parts) {
              current = await (current as any).getDirectoryHandle(part);
            }
            const items: string[] = [];
            for await (const [name, handle] of (current as any).entries()) {
              const icon = handle.kind === "directory" ? "📁" : "📄";
              items.push(`${icon} ${name}`);
            }
            addEntry("output", items.length ? items.join("\n") : "(trống)");
            break;
          }

          case "cd": {
            const target = args[1];
            if (!target) {
              setCwd("");
              addEntry("output", "Đã về thư mục gốc.");
              return;
            }
            if (target === "..") {
              const parts = cwd.split("/").filter(Boolean);
              parts.pop();
              setCwd(parts.join("/"));
              addEntry("output", `Đã chuyển: ${parts.join("/") || "/"}`);
              return;
            }
            const newPath = cwd ? `${cwd}/${target}` : target;
            let test = rootHandle;
            for (const part of newPath.split("/").filter(Boolean)) {
              test = await (test as any).getDirectoryHandle(part);
            }
            setCwd(newPath);
            addEntry("output", `Đã chuyển: /${newPath}`);
            break;
          }

          case "cat": {
            if (!args[1]) {
              addEntry("error", "cat: thiếu tên file.");
              return;
            }
            const current = await resolveCurrentDir();
            if (!current) return;
            const fileHandle = await (current as any).getFileHandle(args[1]);
            const file = await (fileHandle as any).getFile();
            const text = await file.text();
            addEntry("output", text || "(file rỗng)");
            break;
          }

          case "cp": {
            if (!args[1] || !args[2]) {
              addEntry("error", "cp: thiếu đối số. Cú pháp: cp <src> <dst>");
              return;
            }
            const current = await resolveCurrentDir();
            if (!current) return;
            const srcHandle = await (current as any).getFileHandle(args[1]);
            const srcFile = await (srcHandle as any).getFile();
            const srcText = await srcFile.text();
            const dstHandle = await (current as any).getFileHandle(args[2], { create: true });
            const writable = await (dstHandle as any).createWritable();
            await writable.write(srcText);
            await writable.close();
            addEntry("output", `Đã sao chép: ${args[1]} → ${args[2]}`);
            break;
          }

          case "mv": {
            if (!args[1] || !args[2]) {
              addEntry("error", "mv: thiếu đối số. Cú pháp: mv <src> <dst>");
              return;
            }
            const current = await resolveCurrentDir();
            if (!current) return;
            const srcHandle = await (current as any).getFileHandle(args[1]);
            const srcFile = await (srcHandle as any).getFile();
            const srcText = await srcFile.text();
            const dstHandle = await (current as any).getFileHandle(args[2], { create: true });
            const writable = await (dstHandle as any).createWritable();
            await writable.write(srcText);
            await writable.close();
            await (current as any).removeEntry(args[1]);
            addEntry("output", `Đã di chuyển: ${args[1]} → ${args[2]}`);
            break;
          }

          case "mkdir": {
            if (!args[1]) {
              addEntry("error", "mkdir: thiếu tên thư mục.");
              return;
            }
            const current = await resolveCurrentDir();
            if (!current) return;
            await (current as any).getDirectoryHandle(args[1], { create: true });
            addEntry("output", `Đã tạo thư mục: ${args[1]}`);
            break;
          }

          case "touch": {
            if (!args[1]) {
              addEntry("error", "touch: thiếu tên file.");
              return;
            }
            const current = await resolveCurrentDir();
            if (!current) return;
            const fh = await (current as any).getFileHandle(args[1], { create: true });
            const writable = await (fh as any).createWritable();
            await writable.write("");
            await writable.close();
            addEntry("output", `Đã tạo file: ${args[1]}`);
            break;
          }

          case "rm": {
            if (!args[1]) {
              addEntry("error", "rm: thiếu tên file/thư mục.");
              return;
            }
            const current = await resolveCurrentDir();
            if (!current) return;
            await (current as any).removeEntry(args[1], { recursive: true });
            addEntry("output", `Đã xóa: ${args[1]}`);
            break;
          }

          case "find": {
            const query = args[1] || "";
            async function searchDir(dir: FileSystemDirectoryHandle, path: string): Promise<string[]> {
              const results: string[] = [];
              for await (const [name, handle] of (dir as any).entries()) {
                const childPath = path ? `${path}/${name}` : name;
                if (name.toLowerCase().includes(query.toLowerCase())) {
                  results.push(`${handle.kind === "directory" ? "📁" : "📄"} ${childPath}`);
                }
                if (handle.kind === "directory") {
                  results.push(...await searchDir(handle as FileSystemDirectoryHandle, childPath));
                }
              }
              return results;
            }
            const results = await searchDir(rootHandle, "");
            addEntry("output", results.length ? results.join("\n") : "(không tìm thấy)");
            break;
          }

          case "tree": {
            async function treeDir(dir: FileSystemDirectoryHandle, prefix = ""): Promise<string[]> {
              const lines: string[] = [];
              const entries: Array<{ name: string; kind: string; handle: FileSystemHandle }> = [];
              for await (const [name, handle] of (dir as any).entries()) {
                entries.push({ name, kind: handle.kind, handle });
              }
              entries.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "directory" ? -1 : 1));
              for (let i = 0; i < entries.length; i++) {
                const isLast = i === entries.length - 1;
                const line = `${prefix}${isLast ? "└── " : "├── "}${entries[i].name}`;
                lines.push(line);
                if (entries[i].kind === "directory") {
                  lines.push(...await treeDir(entries[i].handle as FileSystemDirectoryHandle, `${prefix}${isLast ? "    " : "│   "}`));
                }
              }
              return lines;
            }
            const lines = await treeDir(rootHandle);
            addEntry("output", [".", ...lines].join("\n"));
            break;
          }

          case "echo": {
            addEntry("output", args.slice(1).join(" "));
            break;
          }

          case "git": {
            const gitCmd = args[1] || "status";
            if (gitCmd === "status") {
              addEntry("output", "git status: Đang phát triển. Dùng Git Panel để xem chi tiết.");
            } else if (gitCmd === "log") {
              addEntry("output", "git log: Chưa có commit nào hoặc đang phát triển.");
            } else if (gitCmd === "branch") {
              addEntry("output", "* main\n  (sử dụng Git Panel để quản lý branch)");
            } else {
              addEntry("info", `git ${gitCmd}: Chức năng này đang được phát triển. Sử dụng Git Panel.`);
            }
            break;
          }

          case "npm":
          case "pnpm":
          case "npx":
          case "python":
          case "node": {
            addEntry(
              "info",
              `${cmd}: Browser terminal cannot run system commands directly. Use an external terminal or deploy pipeline.`,
            );
            break;
          }

          default:
            addEntry("error", _t("cmdNotFound"));
        }
      } catch (err: any) {
        addEntry("error", err.message || `Lỗi thực thi: ${cmd}`);
      }
    },
    [rootHandle, cwd, addEntry, _t],
  );

  return { history, cwd, executeCommand, addEntry };
}
