// ─── useGit — Git operations bằng isomorphic-git (browser) ───────────────
"use client";

import { useState, useCallback } from "react";
import * as git from "isomorphic-git";

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

  const fs = {
    promises: {
      readFile: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await (current as any).getDirectoryHandle(part);
        }
        const file = await (current as any).getFileHandle(parts[parts.length - 1]);
        const f = await (file as any).getFile();
        return await f.text();
      },
      writeFile: async (path: string, data: string | Uint8Array) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await (current as any).getDirectoryHandle(part);
        }
        const file = await (current as any).getFileHandle(parts[parts.length - 1], { create: true });
        const writable = await (file as any).createWritable();
        await writable.write(data);
        await writable.close();
      },
      readdir: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts) {
          current = await (current as any).getDirectoryHandle(part);
        }
        const entries: string[] = [];
        for await (const [name] of (current as any).entries()) {
          entries.push(name);
        }
        return entries;
      },
      mkdir: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts) {
          current = await (current as any).getDirectoryHandle(part, { create: true });
        }
      },
      rm: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await (current as any).getDirectoryHandle(part);
        }
        await (current as any).removeEntry(parts[parts.length - 1], { recursive: true });
      },
      rmdir: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await (current as any).getDirectoryHandle(part);
        }
        await (current as any).removeEntry(parts[parts.length - 1], { recursive: true });
      },
      unlink: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await (current as any).getDirectoryHandle(part);
        }
        await (current as any).removeEntry(parts[parts.length - 1]);
      },
      lstat: async (path: string) => {
        if (!rootHandle) throw new Error("No root handle");
        const parts = path.split("/").filter(Boolean);
        let current = rootHandle;
        for (const part of parts.slice(0, -1)) {
          current = await (current as any).getDirectoryHandle(part);
        }
        const handle = await (current as any).getFileHandle(parts[parts.length - 1]);
        const file = await (handle as any).getFile();
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
          current = await (current as any).getDirectoryHandle(part);
        }
        const handle = await (current as any).getFileHandle(parts[parts.length - 1]);
        const file = await (handle as any).getFile();
        return {
          isFile: () => true,
          isDirectory: () => false,
          mtimeMs: file.lastModified,
          size: file.size,
        };
      },
    },
  };

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
    } catch (err: any) {
      if (err.message?.includes("not a git repository")) {
        setError("Chưa phải Git repo. Chọn 'Khởi tạo Git' để bắt đầu.");
      } else {
        setError(err.message || "Không thể tải status");
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
    } catch (err: any) {
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
    } catch (err: any) {
      setError(err.message || "Không thể khởi tạo repo");
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
    } catch (err: any) {
      console.error("Load commits error:", err);
    }
  }, [rootHandle, fs]);

  const stageFile = useCallback(async (path: string) => {
    if (!rootHandle) return;
    try {
      await git.add({ fs, dir: "/", gitdir, filepath: path });
      await loadStatus();
    } catch (err: any) {
      setError(err.message || "Không thể stage file");
    }
  }, [rootHandle, fs, loadStatus]);

  const unstageFile = useCallback(async (path: string) => {
    if (!rootHandle) return;
    try {
      await git.remove({ fs, dir: "/", gitdir, filepath: path });
      await loadStatus();
    } catch (err: any) {
      setError(err.message || "Không thể unstage file");
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
    } catch (err: any) {
      setError(err.message || "Không thể commit");
    } finally {
      setIsLoading(false);
    }
  }, [rootHandle, fs, loadStatus, loadCommits]);

  const createBranch = useCallback(async (name: string) => {
    if (!rootHandle) return;
    try {
      await git.branch({ fs, dir: "/", gitdir, ref: name });
      await loadBranches();
    } catch (err: any) {
      setError(err.message || "Không thể tạo branch");
    }
  }, [rootHandle, fs, loadBranches]);

  const checkoutBranch = useCallback(async (name: string) => {
    if (!rootHandle) return;
    try {
      setIsLoading(true);
      await git.checkout({ fs, dir: "/", gitdir, ref: name });
      await loadStatus();
      await loadBranches();
    } catch (err: any) {
      setError(err.message || "Không thể checkout branch");
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
          const headContent = head ? await (head as any).content() : "";
          const workdirContent = workdir ? await (workdir as any).content() : "";
          return { head: headContent, workdir: workdirContent };
        },
      });
      const result = diff.filter(Boolean)[0] as any;
      return result;
    } catch (err: any) {
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
