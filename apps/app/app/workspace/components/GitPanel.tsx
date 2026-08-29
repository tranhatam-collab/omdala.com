// ─── GitPanel — Git status, branches, commits, diff viewer ────────────────
"use client";

import * as React from "react";
import type { GitStatus, GitBranch, GitCommit } from "../hooks/useGit";

interface GitPanelProps {
  status: GitStatus[];
  branches: GitBranch[];
  currentBranch: string;
  commits: GitCommit[];
  isLoading: boolean;
  error: string | null;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onCommit: (message: string) => void;
  onCreateBranch: (name: string) => void;
  onCheckout: (name: string) => void;
  onInit: () => void;
  onRefresh: () => void;
  onGetDiff: (path: string) => Promise<{ head: string; workdir: string } | null>;
  clearError: () => void;
}

export function GitPanel({
  status,
  branches,
  currentBranch,
  commits,
  isLoading,
  error,
  onStage,
  onUnstage,
  onCommit,
  onCreateBranch,
  onCheckout,
  onInit,
  onRefresh,
  onGetDiff,
  clearError,
}: GitPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"status" | "branches" | "commits">("status");
  const [commitMessage, setCommitMessage] = React.useState("");
  const [newBranchName, setNewBranchName] = React.useState("");
  const [diffPath, setDiffPath] = React.useState<string | null>(null);
  const [diffData, setDiffData] = React.useState<{ head: string; workdir: string } | null>(null);
  const [showDiff, setShowDiff] = React.useState(false);

  const handleShowDiff = async (path: string) => {
    setDiffPath(path);
    setShowDiff(true);
    const diff = await onGetDiff(path);
    setDiffData(diff);
  };

  const handleCloseDiff = () => {
    setShowDiff(false);
    setDiffPath(null);
    setDiffData(null);
  };

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    onCommit(commitMessage.trim());
    setCommitMessage("");
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    onCreateBranch(newBranchName.trim());
    setNewBranchName("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "8px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#f7fbff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Git{currentBranch ? ` · ${currentBranch}` : ""}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={onInit}
            title="Khởi tạo Git repository"
            style={{
              width: 24, height: 24, borderRadius: 6, border: "none",
              background: "rgba(255,255,255,0.05)", color: "#a8b9d0",
              fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            +
          </button>
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
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <TabButton active={activeTab === "status"} onClick={() => setActiveTab("status")}>
          Status ({status.length})
        </TabButton>
        <TabButton active={activeTab === "branches"} onClick={() => setActiveTab("branches")}>
          Branches ({branches.length})
        </TabButton>
        <TabButton active={activeTab === "commits"} onClick={() => setActiveTab("commits")}>
          Commits
        </TabButton>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {error && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.2)",
            marginBottom: 12,
          }}>
            <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>
            <button
              onClick={clearError}
              style={{
                marginTop: 8,
                padding: "4px 10px",
                borderRadius: 6,
                border: "none",
                background: "rgba(248,113,113,0.2)",
                color: "#f87171",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Đóng
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 20, color: "#6b7f99", fontSize: 13 }}>
            Đang tải...
          </div>
        ) : (
          <>
            {activeTab === "status" && (
              <>
                {status.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: "#6b7f99", fontSize: 13 }}>
                    Không có thay đổi
                  </div>
                ) : (
                  <>
                    {status.map((item) => (
                      <div
                        key={item.path}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 6,
                          marginBottom: 4,
                          background: "rgba(255,255,255,0.02)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <StatusIcon status={item.status} />
                        <span style={{ flex: 1, fontSize: 12, color: "#a8b9d0", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.path}
                        </span>
                        <button
                          onClick={() => handleShowDiff(item.path)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "none",
                            background: "rgba(126,242,255,0.1)",
                            color: "#7ef2ff",
                            fontSize: 10,
                            cursor: "pointer",
                          }}
                        >
                          Diff
                        </button>
                        {item.staged ? (
                          <button
                            onClick={() => onUnstage(item.path)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              border: "none",
                              background: "rgba(250,204,21,0.1)",
                              color: "#fbbf24",
                              fontSize: 10,
                              cursor: "pointer",
                            }}
                          >
                            Unstage
                          </button>
                        ) : (
                          <button
                            onClick={() => onStage(item.path)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              border: "none",
                              background: "rgba(74,222,128,0.1)",
                              color: "#4ade80",
                              fontSize: 10,
                              cursor: "pointer",
                            }}
                          >
                            Stage
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Commit input */}
                    <div style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                      <input
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCommit()}
                        placeholder="Commit message..."
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(6,13,26,0.8)",
                          color: "#f7fbff",
                          fontSize: 12,
                          outline: "none",
                          marginBottom: 8,
                        }}
                      />
                      <button
                        onClick={handleCommit}
                        disabled={!commitMessage.trim()}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: 6,
                          border: "none",
                          background: commitMessage.trim()
                            ? "linear-gradient(135deg, #153a72, #3d8bff)"
                            : "rgba(255,255,255,0.05)",
                          color: commitMessage.trim() ? "#f7fbff" : "#6b7f99",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: commitMessage.trim() ? "pointer" : "not-allowed",
                        }}
                      >
                        Commit
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === "branches" && (
              <>
                <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                  <input
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateBranch()}
                    placeholder="Tên branch mới..."
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(6,13,26,0.8)",
                      color: "#f7fbff",
                      fontSize: 11,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleCreateBranch}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: "rgba(74,222,128,0.15)",
                      color: "#4ade80",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    Tạo
                  </button>
                </div>
                {branches.map((branch) => (
                  <div
                    key={branch.name}
                    onClick={() => !branch.isCurrent && onCheckout(branch.name)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      marginBottom: 4,
                      background: branch.isCurrent
                        ? "rgba(126,242,255,0.1)"
                        : "rgba(255,255,255,0.02)",
                      color: branch.isCurrent ? "#7ef2ff" : "#a8b9d0",
                      fontSize: 12,
                      cursor: branch.isCurrent ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {branch.isCurrent && <span>●</span>}
                    <span>{branch.name}</span>
                  </div>
                ))}
              </>
            )}

            {activeTab === "commits" && (
              <>
                {commits.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: "#6b7f99", fontSize: 13 }}>
                    Chưa có commit nào
                  </div>
                ) : (
                  commits.map((commit) => (
                    <div
                      key={commit.oid}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 6,
                        marginBottom: 4,
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#7ef2ff", fontFamily: "monospace" }}>
                          {commit.oid}
                        </span>
                        <span style={{ fontSize: 11, color: "#6b7f99" }}>
                          {commit.author}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#f7fbff", margin: 0, fontWeight: 500 }}>
                        {commit.message}
                      </p>
                      <p style={{ fontSize: 11, color: "#6b7f99", margin: "4px 0 0" }}>
                        {commit.date.toLocaleString("vi-VN")}
                      </p>
                    </div>
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Diff Modal */}
      {showDiff && diffData && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 9998,
            }}
            onClick={handleCloseDiff}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              maxWidth: 900,
              maxHeight: "80vh",
              background: "#060d1a",
              border: "1px solid rgba(126,242,255,0.2)",
              borderRadius: 12,
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f7fbff" }}>
                Diff: {diffPath}
              </span>
              <button
                onClick={handleCloseDiff}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: "none",
                  background: "rgba(255,255,255,0.05)", color: "#a8b9d0",
                  fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "#6b7f99", marginBottom: 8, textTransform: "uppercase" }}>
                  HEAD (Original)
                </p>
                <pre style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  color: "#a8b9d0",
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                }}>
                  {diffData.head || "(trống)"}
                </pre>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "#6b7f99", marginBottom: 8, textTransform: "uppercase" }}>
                  Working Directory
                </p>
                <pre style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "rgba(74,222,128,0.05)",
                  color: "#4ade80",
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                }}>
                  {diffData.workdir || "(trống)"}
                </pre>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 12px",
        border: "none",
        background: active ? "rgba(126,242,255,0.1)" : "transparent",
        color: active ? "#7ef2ff" : "#6b7f99",
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        borderBottom: active ? "2px solid #7ef2ff" : "none",
        transition: "all 150ms",
      }}
    >
      {children}
    </button>
  );
}

function StatusIcon({ status }: { status: GitStatus["status"] }) {
  const map: Record<GitStatus["status"], { icon: string; color: string }> = {
    modified: { icon: "◈", color: "#fbbf24" },
    added: { icon: "◆", color: "#4ade80" },
    deleted: { icon: "◇", color: "#f87171" },
    renamed: { icon: "◊", color: "#60a5fa" },
    untracked: { icon: "○", color: "#a8b9d0" },
  };
  const { icon, color } = map[status];
  return <span style={{ color, fontSize: 12 }}>{icon}</span>;
}
