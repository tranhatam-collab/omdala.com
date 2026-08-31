// ─── useGit — Git operations bằng isomorphic-git (browser) ───────────────
"use client";

import { useState, useCallback, useMemo } from "react";
import * as git from "isomorphic-git";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function decodeGitContent(content: Uint8Array | void): string {
  return content ? new TextDecoder().decode(content) : "";
}

export interface GitStatus {
  path: string;
  status: "modified" | "added" | "deleted" | "renamed" | "untracked";
  staged: boolean;
}

export interface GitCommit {
  oid: string;
  message: string;
  author: string;
  date: Date;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
}

export function useGit(rootHandle: FileSystemDirectoryHandle | null) {
  const [status, setStatus] = useState<GitStatus[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>("main");
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fs = useMemo(() => ({
    promises: {
      readFile: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await current.getDirectoryHandle(part);
        }
        const file = await current.getFileHandle(parts[parts.length - 1]);
        const f = await file.getFile();
        return await f.text();
      },
      writeFile: async (path: string, data: string | Uint8Array) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await current.getDirectoryHandle(part);
        }
        const file = await current.getFileHandle(parts[parts.length - 1], { create: true });
        const writable = await file.createWritable();
        if (typeof data === "string") {
          await writable.write(data);
        } else {
          const bytes = new Uint8Array(data.byteLength);
          bytes.set(data);
          await writable.write(bytes);
        }
        await writable.close();
      },
      readdir: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts) {
          current = await current.getDirectoryHandle(part);
        }
        const entries: string[] = [];
        for await (const [name] of current.entries()) {
          entries.push(name);
        }
        return entries;
      },
      mkdir: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts) {
          current = await current.getDirectoryHandle(part, { create: true });
        }
      },
      rm: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await current.getDirectoryHandle(part);
        }
        await current.removeEntry(parts[parts.length - 1], { recursive: true });
      },
      rmdir: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await current.getDirectoryHandle(part);
        }
        await current.removeEntry(parts[parts.length - 1], { recursive: true });
      },
      unlink: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await current.getDirectoryHandle(part);
        }
        await current.removeEntry(parts[parts.length - 1]);
      },
      lstat: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await current.getDirectoryHandle(part);
        }
        const handle = await current.getFileHandle(parts[parts.length - 1]);
        const file = await handle.getFile();
        return {
          isFile: () => true,
          isDirectory: () => false,
          mtimeMs: file.lastModified,
          size: file.size,
        };
      },
      stat: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await current.getDirectoryHandle(part);
        }
        const handle = await current.getFileHandle(parts[parts.length - 1]);
        const file = await handle.getFile();
        return {
          isFile: () => true,
          isDirectory: () => false,
          mtimeMs: file.lastModified,
          size: file.size,
        };
      },
    },
  }), [rootHandle]);

  const gitdir = ".git";

  const loadStatus = useCallback(async () => {
    if (!rootHandle) return;
    try {
      setIsLoading(true);
      const matrix = await git.statusMatrix({ fs, dir: "/", gitdir });
      const newStatus: GitStatus[] = [];
      for (const [path, head, workdir, stage] of matrix) {
        if (head !== workdir) {
          let status: GitStatus["status"] = "modified";
          if (head === 0 && workdir !== 0) status = "added";
          else if (head !== 0 && workdir === 0) status = "deleted";
          newStatus.push({ path, status, staged: stage !== 0 });
        }
      }
      setStatus(newStatus);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, "Không thể tải status");
      if (errorMessage.includes("not a git repository")) {
        setError("Chưa phải Git repo. Chọn 'Khởi tạo Git' để bắt đầu.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [rootHandle, fs]);

  const loadBranches = useCallback(async () => {
    if (!rootHandle) return;
    try {
      const refs = await git.listBranches({ fs, dir: "/", gitdir });
      const current = await git.currentBranch({ fs, dir: "/", gitdir, fullname: false });
      setCurrentBranch(current || "main");
      const branchList: GitBranch[] = refs.map((name) => ({
        name: name.replace("refs/heads/", ""),
        isCurrent: name === `refs/heads/${current}`,
      }));
      setBranches(branchList);
    } catch (err: unknown) {
      console.error("Load branches error:", err);
    }
  }, [rootHandle, fs]);

  const checkGitRepo = useCallback(async () => {
    if (!rootHandle) return false;
    try {
      await fs.promises.readdir(gitdir);
      return true;
    } catch {
      return false;
    }
  }, [rootHandle, fs]);

  const initRepo = useCallback(async () => {
    if (!rootHandle) return;
    try {
      setIsLoading(true);
      setError(null);
      await git.init({ fs, dir: "/", gitdir });
      await loadStatus();
      await loadBranches();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể khởi tạo repo"));
    } finally {
      setIsLoading(false);
    }
  }, [rootHandle, fs, loadStatus, loadBranches]);

  const loadCommits = useCallback(async () => {
    if (!rootHandle) return;
    try {
      const log = await git.log({ fs, dir: "/", gitdir, depth: 20 });
      const commitList: GitCommit[] = log.map((c) => ({
        oid: c.oid.substring(0, 7),
        message: c.commit.message.split("\n")[0],
        author: c.commit.author.name,
        date: new Date(c.commit.author.timestamp * 1000),
      }));
      setCommits(commitList);
    } catch (err: unknown) {
      console.error("Load commits error:", err);
    }
  }, [rootHandle, fs]);

  const stageFile = useCallback(async (path: string) => {
    if (!rootHandle) return;
    try {
      await git.add({ fs, dir: "/", gitdir, filepath: path });
      await loadStatus();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể stage file"));
    }
  }, [rootHandle, fs, loadStatus]);

  const unstageFile = useCallback(async (path: string) => {
    if (!rootHandle) return;
    try {
      await git.remove({ fs, dir: "/", gitdir, filepath: path });
      await loadStatus();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể unstage file"));
    }
  }, [rootHandle, fs, loadStatus]);

  const commit = useCallback(async (message: string) => {
    if (!rootHandle) return;
    try {
      setIsLoading(true);
      await git.commit({
        fs,
        dir: "/",
        gitdir,
        message,
        author: { name: "OMDALA User", email: "user@omdala.com" },
      });
      await loadStatus();
      await loadCommits();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể commit"));
    } finally {
      setIsLoading(false);
    }
  }, [rootHandle, fs, loadStatus, loadCommits]);

  const createBranch = useCallback(async (name: string) => {
    if (!rootHandle) return;
    try {
      await git.branch({ fs, dir: "/", gitdir, ref: name });
      await loadBranches();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể tạo branch"));
    }
  }, [rootHandle, fs, loadBranches]);

  const checkoutBranch = useCallback(async (name: string) => {
    if (!rootHandle) return;
    try {
      setIsLoading(true);
      await git.checkout({ fs, dir: "/", gitdir, ref: name });
      await loadStatus();
      await loadBranches();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể checkout branch"));
    } finally {
      setIsLoading(false);
    }
  }, [rootHandle, fs, loadStatus, loadBranches]);

  const getFileDiff = useCallback(async (path: string) => {
    if (!rootHandle) return null;
    try {
      const diff = await git.walk({
        fs,
        dir: "/",
        gitdir,
        trees: [git.TREE({ ref: "HEAD" }), git.WORKDIR()],
        map: async (filepath, [head, workdir]) => {
          if (filepath !== path) return null;
          const headOid = head ? await head.oid() : null;
          const workdirOid = workdir ? await workdir.oid() : null;
          if (headOid === workdirOid) return null;
          const headContent = head ? await head.content() : undefined;
          const workdirContent = workdir ? await workdir.content() : undefined;
          return {
            head: decodeGitContent(headContent),
            workdir: decodeGitContent(workdirContent),
          };
        },
      }) as Array<{ head: string; workdir: string } | null>;
      return diff.find(
        (item): item is { head: string; workdir: string } => item !== null,
      ) ?? null;
    } catch (err: unknown) {
      console.error("Get diff error:", err);
      return null;
    }
  }, [rootHandle, fs]);

  return {
    status,
    branches,
    currentBranch,
    commits,
    isLoading,
    error,
    checkGitRepo,
    initRepo,
    loadStatus,
    loadBranches,
    loadCommits,
    stageFile,
    unstageFile,
    commit,
    createBranch,
    checkoutBranch,
    getFileDiff,
    clearError: () => setError(null),
  };
}
