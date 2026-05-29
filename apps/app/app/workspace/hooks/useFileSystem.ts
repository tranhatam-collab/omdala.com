// ─── useFileSystem — File System Access API wrapper ─────────────────────
"use client";

import { useState, useCallback, useEffect } from "react";

export interface FileSystemNode {
  name: string;
  path: string;
  kind: "file" | "directory";
  children?: FileSystemNode[];
  handle: FileSystemHandle;
}

export interface OpenFileEntry {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  language: string;
  handle: FileSystemFileHandle;
}

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    json: "json", css: "css", scss: "scss", html: "html", xml: "xml",
    md: "markdown", py: "python", rb: "ruby", go: "go", rs: "rust",
    java: "java", kt: "kotlin", swift: "swift", c: "c", cpp: "cpp",
    h: "c", hpp: "cpp", cs: "csharp", php: "php", sql: "sql",
    sh: "shell", bash: "shell", zsh: "shell", yaml: "yaml", yml: "yaml",
    dockerfile: "dockerfile", toml: "toml", lua: "lua", r: "r",
    graphql: "graphql", svg: "xml", vue: "html", svelte: "html",
  };
  return map[ext] || "plaintext";
}

async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  path = "",
): Promise<FileSystemNode[]> {
  const nodes: FileSystemNode[] = [];
  for await (const [name, handle] of (dirHandle as any).entries()) {
    const nodePath = path ? `${path}/${name}` : name;
    if (handle.kind === "directory") {
      const children = await scanDirectory(handle as FileSystemDirectoryHandle, nodePath);
      nodes.push({ name, path: nodePath, kind: "directory", children, handle });
    } else {
      nodes.push({ name, path: nodePath, kind: "file", handle });
    }
  }
  return nodes.sort((a, b) => {
    if (a.kind === b.kind) return a.name.localeCompare(b.name);
    return a.kind === "directory" ? -1 : 1;
  });
}

async function readFileContent(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return await file.text();
}

export function useFileSystem() {
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [fileTree, setFileTree] = useState<FileSystemNode[]>([]);
  const [openFiles, setOpenFiles] = useState<OpenFileEntry[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openFolder = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (typeof (window as any).showDirectoryPicker !== "function") {
        setError("Trình duyệt không hỗ trợ File System Access API. Vui lòng dùng Chrome/Edge.");
        return;
      }
      const handle = await (window as any).showDirectoryPicker();
      const tree = await scanDirectory(handle);
      setRootHandle(handle);
      setFileTree(tree);
      setOpenFiles([]);
      setActivePath(null);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Không thể mở thư mục");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openFile = useCallback(async (node: FileSystemNode) => {
    if (node.kind !== "file") return;
    try {
      const handle = node.handle as FileSystemFileHandle;
      const content = await readFileContent(handle);
      const alreadyOpen = openFiles.find((f) => f.path === node.path);
      if (!alreadyOpen) {
        setOpenFiles((prev) => [
          ...prev,
          {
            path: node.path,
            name: node.name,
            content,
            originalContent: content,
            language: getLanguageFromPath(node.path),
            handle,
          },
        ]);
      }
      setActivePath(node.path);
    } catch (err: any) {
      setError(err.message || "Không thể đọc file");
    }
  }, [openFiles]);

  const closeFile = useCallback((path: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.path !== path);
      if (activePath === path) {
        const idx = prev.findIndex((f) => f.path === path);
        const newActive = next[idx] ?? next[idx - 1] ?? next[0] ?? null;
        setActivePath(newActive?.path ?? null);
      }
      return next;
    });
  }, [activePath]);

  const setActiveFile = useCallback((path: string) => {
    setActivePath(path);
  }, []);

  const updateFileContent = useCallback((path: string, content: string) => {
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content } : f)),
    );
  }, []);

  const saveFile = useCallback(async (path: string) => {
    const file = openFiles.find((f) => f.path === path);
    if (!file) return;
    try {
      const writable = await (file.handle as any).createWritable();
      await writable.write(file.content);
      await writable.close();
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.path === path ? { ...f, originalContent: f.content } : f,
        ),
      );
    } catch (err: any) {
      setError(err.message || "Không thể lưu file");
    }
  }, [openFiles]);

  const refreshFileTree = useCallback(async () => {
    if (!rootHandle) return;
    const tree = await scanDirectory(rootHandle);
    setFileTree(tree);
  }, [rootHandle]);

  const createFile = useCallback(async (dirPath: string, fileName: string) => {
    if (!rootHandle) return;
    try {
      // Find parent directory
      const parts = dirPath.split("/");
      let current = rootHandle;
      for (const part of parts) {
        if (!part) continue;
        current = await (current as any).getDirectoryHandle(part);
      }
      const newHandle = await (current as any).getFileHandle(fileName, { create: true });
      const writable = await (newHandle as any).createWritable();
      await writable.write("");
      await writable.close();
      await refreshFileTree();
    } catch (err: any) {
      setError(err.message || "Không thể tạo file");
    }
  }, [rootHandle, refreshFileTree]);

  const createDirectory = useCallback(async (dirPath: string, dirName: string) => {
    if (!rootHandle) return;
    try {
      const parts = dirPath.split("/");
      let current = rootHandle;
      for (const part of parts) {
        if (!part) continue;
        current = await (current as any).getDirectoryHandle(part);
      }
      await (current as any).getDirectoryHandle(dirName, { create: true });
      await refreshFileTree();
    } catch (err: any) {
      setError(err.message || "Không thể tạo thư mục");
    }
  }, [rootHandle, refreshFileTree]);

  const deleteEntry = useCallback(async (node: FileSystemNode) => {
    if (!rootHandle) return;
    try {
      const parentPath = node.path.substring(0, node.path.lastIndexOf("/"));
      const parts = parentPath.split("/").filter(Boolean);
      let current = rootHandle;
      for (const part of parts) {
        current = await (current as any).getDirectoryHandle(part);
      }
      await (current as any).removeEntry(node.name, { recursive: true });
      await refreshFileTree();
      if (node.kind === "file") {
        closeFile(node.path);
      }
    } catch (err: any) {
      setError(err.message || "Không thể xóa");
    }
  }, [rootHandle, refreshFileTree, closeFile]);

  const hasUnsavedChanges = (path: string) => {
    const file = openFiles.find((f) => f.path === path);
    return file ? file.content !== file.originalContent : false;
  };

  // File watchers: refresh on window focus + poll every 3s
  useEffect(() => {
    if (!rootHandle) return;
    const onFocus = () => refreshFileTree();
    window.addEventListener("focus", onFocus);
    const iv = setInterval(() => refreshFileTree(), 3000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(iv);
    };
  }, [rootHandle, refreshFileTree]);

  // Detect external changes to open files on window focus
  useEffect(() => {
    if (openFiles.length === 0) return;
    async function checkOpenFiles() {
      for (const file of openFiles) {
        try {
          const current = await readFileContent(file.handle);
          if (current !== file.originalContent && current !== file.content) {
            // File changed externally — auto-reload to match disk
            setOpenFiles((prev) =>
              prev.map((f) =>
                f.path === file.path ? { ...f, content: current, originalContent: current } : f
              ),
            );
          }
        } catch {}
      }
    }
    const onFocus = () => checkOpenFiles();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [openFiles]);

  return {
    rootHandle,
    fileTree,
    openFiles,
    activePath,
    isLoading,
    error,
    openFolder,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    saveFile,
    refreshFileTree,
    createFile,
    createDirectory,
    deleteEntry,
    hasUnsavedChanges,
    clearError: () => setError(null),
  };
}
