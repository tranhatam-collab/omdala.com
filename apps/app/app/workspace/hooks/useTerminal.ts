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

export function useTerminal(rootHandle: FileSystemDirectoryHandle | null) {
  const [history, setHistory] = useState<TerminalEntry[]>([
    {
      id: nextId(),
      type: "info",
      text: "OMDALA Terminal v1.0 — Gõ 'help' để xem danh sách lệnh.",
      timestamp: Date.now(),
    },
  ]);
  const [cwd, setCwd] = useState<string>("");

  const addEntry = useCallback((type: TerminalEntry["type"], text: string) => {
    setHistory((prev) => [...prev, { id: nextId(), type, text, timestamp: Date.now() }]);
  }, []);

  const executeCommand = useCallback(
    async (input: string) => {
      addEntry("command", `$ ${input}`);
      const args = input.trim().split(/\s+/);
      const cmd = args[0];

      if (!cmd) return;

      if (cmd === "help") {
        addEntry(
          "output",
          `Lệnh có sẵn:
  ls              Liệt kê file/thư mục
  cd <path>       Di chuyển thư mục
  pwd             Hiển thị đường dẫn hiện tại
  cat <file>      Hiển thị nội dung file
  mkdir <name>    Tạo thư mục
  touch <name>    Tạo file rỗng
  rm <name>       Xóa file/thư mục
  echo <text>     In văn bản
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

      if (!rootHandle) {
        addEntry("error", "Chưa mở thư mục dự án. Dùng nút 'Mở thư mục' hoặc File Explorer.");
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
            let current = rootHandle;
            const parts = cwd.split("/").filter(Boolean);
            for (const part of parts) {
              current = await (current as any).getDirectoryHandle(part);
            }
            const fileHandle = await (current as any).getFileHandle(args[1]);
            const file = await (fileHandle as any).getFile();
            const text = await file.text();
            addEntry("output", text || "(file rỗng)");
            break;
          }

          case "mkdir": {
            if (!args[1]) {
              addEntry("error", "mkdir: thiếu tên thư mục.");
              return;
            }
            let current = rootHandle;
            const parts = cwd.split("/").filter(Boolean);
            for (const part of parts) {
              current = await (current as any).getDirectoryHandle(part);
            }
            await (current as any).getDirectoryHandle(args[1], { create: true });
            addEntry("output", `Đã tạo thư mục: ${args[1]}`);
            break;
          }

          case "touch": {
            if (!args[1]) {
              addEntry("error", "touch: thiếu tên file.");
              return;
            }
            let current = rootHandle;
            const parts = cwd.split("/").filter(Boolean);
            for (const part of parts) {
              current = await (current as any).getDirectoryHandle(part);
            }
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
            let current = rootHandle;
            const parts = cwd.split("/").filter(Boolean);
            for (const part of parts) {
              current = await (current as any).getDirectoryHandle(part);
            }
            await (current as any).removeEntry(args[1], { recursive: true });
            addEntry("output", `Đã xóa: ${args[1]}`);
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
              `${cmd}: Terminal trình duyệt không thể chạy lệnh hệ thống trực tiếp. Sử dụng terminal ngoài hoặc deploy pipeline.`,
            );
            break;
          }

          default:
            addEntry("error", `Lệnh không xác định: ${cmd}. Gõ 'help' để xem danh sách.`);
        }
      } catch (err: any) {
        addEntry("error", err.message || `Lỗi thực thi: ${cmd}`);
      }
    },
    [rootHandle, cwd, addEntry],
  );

  return { history, cwd, executeCommand, addEntry };
}
