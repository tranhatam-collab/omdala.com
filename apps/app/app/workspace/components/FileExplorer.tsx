// ─── FileExplorer — Tree view với File System Access API ────────────────
"use client";

import * as React from "react";
import type { FileSystemNode } from "../hooks/useFileSystem";

interface FileExplorerProps {
  fileTree: FileSystemNode[];
  activePath: string | null;
  onOpenFile: (node: FileSystemNode) => void;
  onCreateFile: (dirPath: string, name: string) => void;
  onCreateDir: (dirPath: string, name: string) => void;
  onDelete: (node: FileSystemNode) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenFolder: () => void;
  rootHandle: FileSystemDirectoryHandle | null;
}

function FileIcon({ kind, name }: { kind: string; name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const color = kind === "directory" ? "#60a5fa" : getFileColor(ext);
  return (
    <span style={{ color, fontSize: 14, marginRight: 6, display: "inline-block", width: 16 }}>
      {kind === "directory" ? "▸" : getFileIcon(name)}
    </span>
  );
}

function getFileColor(ext: string): string {
  const map: Record<string, string> = {
    ts: "#60a5fa", tsx: "#60a5fa", js: "#fbbf24", jsx: "#fbbf24", mjs: "#fbbf24",
    json: "#a8b9d0", css: "#a78bfa", scss: "#a78bfa", sass: "#a78bfa", less: "#a78bfa", html: "#f87171", htm: "#f87171",
    md: "#f7fbff", mdx: "#f7fbff",
    py: "#4ade80", ipynb: "#4ade80",
    go: "#7ef2ff", rs: "#f87171", c: "#a8b9d0", cpp: "#a8b9d0", h: "#a8b9d0", hpp: "#a8b9d0",
    java: "#f87171", kt: "#a78bfa", swift: "#f87171", cs: "#a78bfa", php: "#6b7f99",
    rb: "#ef4444", r: "#4ade80", lua: "#60a5fa", sh: "#4ade80", bash: "#4ade80", zsh: "#4ade80",
    sql: "#fbbf24", graphql: "#f87171", gql: "#f87171",
    dockerfile: "#7ef2ff", vue: "#4ade80", svelte: "#f87171", astro: "#f87171",
    yaml: "#a8b9d0", yml: "#a8b9d0", toml: "#a8b9d0", ini: "#a8b9d0", conf: "#a8b9d0",
    xml: "#fbbf24", svg: "#fbbf24",
    tex: "#f7fbff", pdf: "#ef4444",
    lock: "#6b7f99", gitignore: "#6b7f99", env: "#4ade80",
  };
  return map[ext] || "#a8b9d0";
}

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "◈", tsx: "◈", js: "◇", jsx: "◇", mjs: "◇",
    json: "◉", css: "◊", scss: "◊", sass: "◊", less: "◊", html: "◆", htm: "◆",
    md: "◆", mdx: "◆",
    py: "◈", ipynb: "◈",
    go: "◈", rs: "◈", c: "◇", cpp: "◇", h: "◇", hpp: "◇",
    java: "◆", kt: "◊", swift: "◆", cs: "◊", php: "◇",
    rb: "◆", r: "◈", lua: "◈", sh: "◈", bash: "◈", zsh: "◈",
    sql: "◉", graphql: "◆", gql: "◆",
    dockerfile: "◆", vue: "◈", svelte: "◆", astro: "◆",
    yaml: "◉", yml: "◉", toml: "◉", ini: "◉", conf: "◉",
    xml: "◉", svg: "◉",
    tex: "◆", pdf: "◆",
    lock: "◉", gitignore: "◉", env: "◈",
  };
  return map[ext] || "◆";
}

function TreeNode({
  node,
  depth,
  activePath,
  onOpenFile,
  onCreateFile,
  onCreateDir,
  onDelete,
}: {
  node: FileSystemNode;
  depth: number;
  activePath: string | null;
  onOpenFile: (node: FileSystemNode) => void;
  onCreateFile: (dirPath: string, name: string) => void;
  onCreateDir: (dirPath: string, name: string) => void;
  onDelete: (node: FileSystemNode) => void;
}) {
  const [expanded, setExpanded] = React.useState(depth < 1);
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);
  const [creating, setCreating] = React.useState<"file" | "dir" | null>(null);
  const [newName, setNewName] = React.useState("");
  const isActive = activePath === node.path;

  const handleClick = () => {
    if (node.kind === "directory") {
      setExpanded((e) => !e);
    } else {
      onOpenFile(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    if (creating === "file") onCreateFile(node.path, newName.trim());
    else onCreateDir(node.path, newName.trim());
    setCreating(null);
    setNewName("");
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "4px 12px",
          paddingLeft: 12 + depth * 16,
          cursor: "pointer",
          borderRadius: 6,
          background: isActive ? "rgba(126,242,255,0.1)" : "transparent",
          color: isActive ? "#7ef2ff" : node.kind === "directory" ? "#f7fbff" : "#a8b9d0",
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          transition: "all 150ms",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = "transparent";
        }}
      >
        <span style={{ display: "inline-block", width: 14, transition: "transform 150ms", transform: node.kind === "directory" && expanded ? "rotate(90deg)" : "none" }}>
          {node.kind === "directory" ? "▸" : ""}
        </span>
        <FileIcon kind={node.kind} name={node.name} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{node.name}</span>
      </div>

      {creating && (
        <div style={{ paddingLeft: 12 + (depth + 1) * 16, paddingRight: 12, display: "flex", gap: 6, marginTop: 4 }}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder={creating === "file" ? "tên file..." : "tên thư mục..."}
            style={{
              flex: 1,
              background: "rgba(6,13,26,0.8)",
              border: "1px solid rgba(126,242,255,0.3)",
              borderRadius: 6,
              padding: "4px 8px",
              color: "#f7fbff",
              fontSize: 12,
              outline: "none",
            }}
          />
          <button onClick={handleCreate} style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: "none",
            background: "rgba(126,242,255,0.15)",
            color: "#7ef2ff",
            fontSize: 12,
            cursor: "pointer",
          }}>Tạo</button>
        </div>
      )}

      {expanded && node.children?.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          activePath={activePath}
          onOpenFile={onOpenFile}
          onCreateFile={onCreateFile}
          onCreateDir={onCreateDir}
          onDelete={onDelete}
        />
      ))}

      {contextMenu && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
            }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position: "fixed",
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 9999,
              background: "rgba(15, 29, 51, 0.98)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "6px 0",
              minWidth: 160,
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            }}
          >
            {node.kind === "directory" && (
              <>
                <ContextItem onClick={() => { setCreating("file"); setContextMenu(null); }}>📄 Tạo file mới</ContextItem>
                <ContextItem onClick={() => { setCreating("dir"); setContextMenu(null); }}>📁 Tạo thư mục</ContextItem>
                <ContextDivider />
              </>
            )}
            <ContextItem onClick={() => { onDelete(node); setContextMenu(null); }}>🗑️ Xóa</ContextItem>
            <ContextItem onClick={() => { onOpenFile(node); setContextMenu(null); }}>📂 Mở</ContextItem>
          </div>
        </>
      )}
    </div>
  );
}

function ContextItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: "8px 14px",
        textAlign: "left",
        background: "transparent",
        border: "none",
        color: "#a8b9d0",
        fontSize: 13,
        cursor: "pointer",
        transition: "all 150ms",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(126,242,255,0.08)"; e.currentTarget.style.color = "#f7fbff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a8b9d0"; }}
    >
      {children}
    </button>
  );
}

function ContextDivider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />;
}

export function FileExplorer({
  fileTree,
  activePath,
  onOpenFile,
  onCreateFile,
  onCreateDir,
  onDelete,
  onRefresh,
  isLoading,
  onOpenFolder,
  rootHandle,
}: FileExplorerProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#f7fbff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Explorer
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {rootHandle && (
            <button
              onClick={onRefresh}
              title="Làm mới"
              style={{
                width: 24, height: 24, borderRadius: 6, border: "none",
                background: "rgba(255,255,255,0.05)", color: "#a8b9d0",
                fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(126,242,255,0.1)"; e.currentTarget.style.color = "#7ef2ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#a8b9d0"; }}
            >
              ↻
            </button>
          )}
        </div>
      </div>

      {/* Open Folder Button */}
      {!rootHandle && (
        <div style={{ padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#6b7f99", marginBottom: 16 }}>
            Chưa có dự án nào được mở
          </p>
          <button
            onClick={onOpenFolder}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg, #153a72, #3d8bff)",
              color: "#f7fbff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "filter 200ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
          >
            📂 Mở thư mục
          </button>
          <p style={{ fontSize: 11, color: "#6b7f99", marginTop: 12 }}>
            Yêu cầu Chrome/Edge để truy cập file hệ thống
          </p>
        </div>
      )}

      {/* File Tree */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 20, color: "#6b7f99", fontSize: 13 }}>
            Đang tải...
          </div>
        ) : (
          fileTree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              activePath={activePath}
              onOpenFile={onOpenFile}
              onCreateFile={onCreateFile}
              onCreateDir={onCreateDir}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
