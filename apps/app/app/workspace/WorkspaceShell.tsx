// ─── WorkspaceShell — Full IDE layout with all panels ─────────────────────
"use client";

import * as React from "react";
import { useFileSystem } from "./hooks/useFileSystem";
import { useTerminal } from "./hooks/useTerminal";
import { useGit } from "./hooks/useGit";
import { FileExplorer } from "./components/FileExplorer";
import { EditorPanel } from "./components/EditorPanel";
import { TerminalPanel } from "./components/TerminalPanel";
import { GitPanel } from "./components/GitPanel";
import { AIChatPanel } from "./components/AIChatPanel";
import { SettingsPanel, loadSettings, applySettingsToRouter } from "./components/SettingsPanel";
import { WelcomeScreen, saveRecentProject } from "./components/WelcomeScreen";
import { StatusBar } from "./components/StatusBar";
import { AICommandPalette } from "../ai/AICommandPalette";
import { useI18n } from "./hooks/useI18n";
import { detectProjectType, detectProjectLogo, type ProjectMeta } from "./hooks/useProjectType";
import { CostDashboard, recordUsage } from "./components/CostDashboard";
import { ChatHistoryPanel } from "./components/ChatHistoryPanel";
import { CodeHistoryPanel, recordCodeEdit } from "./components/CodeHistoryPanel";
import { AccountPanel } from "./components/AccountPanel";
import { TermsAcceptance, hasAcceptedTerms } from "./components/TermsAcceptance";
import { TerminalRiskBanner, ApplyCodeRiskBanner } from "./components/RiskBanner";
import { ProjectTrackerPanel } from "./components/ProjectTrackerPanel";
import { ErrorLogPanel } from "./components/ErrorLogPanel";
import { ShortcutsHelpPanel } from "./components/ShortcutsHelpPanel";

type Panel = "explorer" | "editor" | "terminal" | "git";

export function WorkspaceShell() {
  const { lang, t, toggleLang } = useI18n();
  const fileSystem = useFileSystem();
  const terminal = useTerminal(fileSystem.rootHandle, t);
  const git = useGit(fileSystem.rootHandle);

  const [activePanel, setActivePanel] = React.useState<Panel>("editor");
  const [sidebarPanel, setSidebarPanel] = React.useState<"explorer" | "git">("explorer");
  const [bottomPanel, setBottomPanel] = React.useState<"terminal" | "git" | null>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = React.useState(200);
  const [aiPaletteOpen, setAiPaletteOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(true);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [costPanelOpen, setCostPanelOpen] = React.useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = React.useState(false);
  const [codeHistoryOpen, setCodeHistoryOpen] = React.useState(false);
  const [projectMeta, setProjectMeta] = React.useState<ProjectMeta | null>(null);
  const [projectLogo, setProjectLogo] = React.useState<string | undefined>();
  const [termsAccepted, setTermsAccepted] = React.useState(true);
  const [trackerOpen, setTrackerOpen] = React.useState(false);
  const [errorLogOpen, setErrorLogOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [projectKey, setProjectKey] = React.useState<string | null>(null);
  const [isOnline, setIsOnline] = React.useState(true);

  // Apply persisted settings to model router on mount
  React.useEffect(() => {
    applySettingsToRouter(loadSettings());
  }, []);

  // Check terms acceptance
  React.useEffect(() => {
    setTermsAccepted(hasAcceptedTerms());
  }, []);

  // Network status
  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Detect project type & logo + assign unique project key when folder opens
  React.useEffect(() => {
    async function detect() {
      if (fileSystem.rootHandle) {
        const allPaths = fileSystem.fileTree.map((f: { path?: string }) => f.path || "");
        const meta = detectProjectType(allPaths);
        setProjectMeta(meta);
        const logo = await detectProjectLogo(fileSystem.rootHandle);
        if (logo) setProjectLogo(logo);
        // Generate unique project key to avoid name collisions across folders
        setProjectKey(crypto.randomUUID ? crypto.randomUUID() : `pk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      }
    }
    detect();
  }, [fileSystem.rootHandle, fileSystem.fileTree]);

  // Check git repo on mount
  React.useEffect(() => {
    if (fileSystem.rootHandle) {
      git.checkGitRepo().then((isRepo) => {
        if (isRepo) {
          git.loadStatus();
          git.loadBranches();
          git.loadCommits();
        }
      });
    }
  }, [fileSystem.rootHandle, git]);

  // Save to recent projects when folder opened
  React.useEffect(() => {
    if (fileSystem.rootHandle) {
      saveRecentProject(fileSystem.rootHandle.name, fileSystem.rootHandle.name);
    }
  }, [fileSystem.rootHandle]);

  // Keyboard shortcuts
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setAiPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        const sel = window.getSelection()?.toString() || "";
        if (sel) {
          window.dispatchEvent(new CustomEvent("omcode:inline-ai", { detail: sel }));
          setChatOpen(true);
        }
      }
      if (e.key === "Escape") {
        setAiPaletteOpen(false);
      }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleResizeBottom = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newHeight = startHeight - (moveEvent.clientY - startY);
      if (newHeight >= 100 && newHeight <= 500) {
        setBottomPanelHeight(newHeight);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Welcome screen when no folder open
  if (!fileSystem.rootHandle) {
    return (
      <div style={{ height: "100vh", background: "#060d1a" }}>
        <WelcomeScreen
          onOpenFolder={fileSystem.openFolder}
          onOpenRecent={() => fileSystem.openFolder()}
        />
      </div>
    );
  }

  if (!termsAccepted) {
    return <TermsAcceptance onAccept={() => setTermsAccepted(true)} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#060d1a", fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)" }}>
      {/* Top bar */}
      <div style={{
        height: 40,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        background: "rgba(6,13,26,0.95)",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#f7fbff" }}>
          OMDALA Workspace
        </span>
        {fileSystem.rootHandle && (
          <>
            {projectLogo ? (
              <img src={projectLogo} alt="logo" style={{ marginLeft: 12, width: 18, height: 18, borderRadius: 4, objectFit: "cover" }} />
            ) : projectMeta ? (
              <span style={{ marginLeft: 12, fontSize: 14 }} title={projectMeta.type}>{projectMeta.icon}</span>
            ) : null}
            <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7f99" }}>
              {fileSystem.rootHandle.name}
            </span>
          </>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={toggleLang}
            title={lang === "vi" ? t("switchToEnglish") : t("switchToVietnamese")}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid rgba(126,242,255,0.25)",
              background: "rgba(126,242,255,0.08)",
              color: "#7ef2ff",
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {lang === "vi" ? "VI 🇻🇳" : "EN 🇺🇸"}
          </button>
          <button
            onClick={() => fileSystem.openFolder()}
            title={t("openOtherProject")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: "rgba(126,242,255,0.1)",
              color: "#7ef2ff",
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🗂 {t("openProject")}
          </button>
          <button
            onClick={() => setAiPaletteOpen(true)}
            title={t("aiPaletteTitle")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: "rgba(255,255,255,0.05)",
              color: "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            ⌘K
          </button>
          <button
            onClick={() => setChatOpen((v) => !v)}
            title={t("aiChat")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: chatOpen ? "rgba(126,242,255,0.15)" : "rgba(255,255,255,0.05)",
              color: chatOpen ? "#7ef2ff" : "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            💬 {t("aiChat")}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            title={t("settings")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: "rgba(255,255,255,0.05)",
              color: "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            ⚙️
          </button>
          <button
            onClick={() => setBottomPanel(bottomPanel === "terminal" ? null : "terminal")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: bottomPanel === "terminal" ? "rgba(126,242,255,0.15)" : "rgba(255,255,255,0.05)",
              color: bottomPanel === "terminal" ? "#7ef2ff" : "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {t("terminal")}
          </button>
          <button
            onClick={() => setBottomPanel(bottomPanel === "git" ? null : "git")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: bottomPanel === "git" ? "rgba(126,242,255,0.15)" : "rgba(255,255,255,0.05)",
              color: bottomPanel === "git" ? "#7ef2ff" : "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {t("git")}
          </button>
          <button
            onClick={() => setCostPanelOpen((v) => !v)}
            title={t("totalCost")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: costPanelOpen ? "rgba(126,242,255,0.15)" : "rgba(255,255,255,0.05)",
              color: costPanelOpen ? "#7ef2ff" : "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            📊
          </button>
          <button
            onClick={() => setChatHistoryOpen((v) => !v)}
            title={t("history")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: chatHistoryOpen ? "rgba(126,242,255,0.15)" : "rgba(255,255,255,0.05)",
              color: chatHistoryOpen ? "#7ef2ff" : "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            🗨️
          </button>
          <button
            onClick={() => setCodeHistoryOpen((v) => !v)}
            title={t("history")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: codeHistoryOpen ? "rgba(126,242,255,0.15)" : "rgba(255,255,255,0.05)",
              color: codeHistoryOpen ? "#7ef2ff" : "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            📝
          </button>
          <button
            onClick={() => setAccountOpen(true)}
            title={t("plans")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: "rgba(255,255,255,0.05)",
              color: "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            👤
          </button>
          <button
            onClick={() => setTrackerOpen((v) => !v)}
            title={t("trackerTitle")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: trackerOpen ? "rgba(126,242,255,0.15)" : "rgba(255,255,255,0.05)",
              color: trackerOpen ? "#7ef2ff" : "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            📊 {t("trackerTitle")}
          </button>
          <button
            onClick={() => setErrorLogOpen((v) => !v)}
            title={t("errorLog")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: errorLogOpen ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
              color: errorLogOpen ? "#ef4444" : "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            🐛
          </button>
          <button
            onClick={() => setShortcutsOpen(true)}
            title={t("shortcutHelp")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: "rgba(255,255,255,0.05)",
              color: "#a8b9d0",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            ?
          </button>
        </div>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div style={{
          padding: "4px 16px",
          background: "rgba(239,68,68,0.1)",
          borderBottom: "1px solid rgba(239,68,68,0.2)",
          color: "#ef4444",
          fontSize: 11,
          textAlign: "center",
        }}>
          ⚠️ {t("offline")} — {t("offlineWarning")}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: 260,
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <button
              onClick={() => setSidebarPanel("explorer")}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                background: sidebarPanel === "explorer" ? "rgba(126,242,255,0.1)" : "transparent",
                color: sidebarPanel === "explorer" ? "#7ef2ff" : "#6b7f99",
                fontSize: 11,
                cursor: "pointer",
                borderBottom: sidebarPanel === "explorer" ? "2px solid #7ef2ff" : "none",
              }}
            >
              {t("explorer")}
            </button>
            <button
              onClick={() => setSidebarPanel("git")}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                background: sidebarPanel === "git" ? "rgba(126,242,255,0.1)" : "transparent",
                color: sidebarPanel === "git" ? "#7ef2ff" : "#6b7f99",
                fontSize: 11,
                cursor: "pointer",
                borderBottom: sidebarPanel === "git" ? "2px solid #7ef2ff" : "none",
              }}
            >
              {t("git")}
            </button>
          </div>

          {sidebarPanel === "explorer" && (
            <FileExplorer
              fileTree={fileSystem.fileTree}
              activePath={fileSystem.activePath}
              onOpenFile={fileSystem.openFile}
              onCreateFile={fileSystem.createFile}
              onCreateDir={fileSystem.createDirectory}
              onDelete={fileSystem.deleteEntry}
              onRefresh={fileSystem.refreshFileTree}
              isLoading={fileSystem.isLoading}
              onOpenFolder={fileSystem.openFolder}
              rootHandle={fileSystem.rootHandle}
            />
          )}

          {sidebarPanel === "git" && (
            <GitPanel
              status={git.status}
              branches={git.branches}
              currentBranch={git.currentBranch}
              commits={git.commits}
              isLoading={git.isLoading}
              error={git.error}
              onStage={git.stageFile}
              onUnstage={git.unstageFile}
              onCommit={git.commit}
              onCreateBranch={git.createBranch}
              onCheckout={git.checkoutBranch}
              onInit={git.initRepo}
              onRefresh={() => { git.loadStatus(); git.loadBranches(); git.loadCommits(); }}
              onGetDiff={git.getFileDiff}
              clearError={git.clearError}
            />
          )}
        </div>

        {/* Editor + Bottom Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginRight: chatOpen ? 360 : 0 }}>
          {bottomPanel === "terminal" && <TerminalRiskBanner />}
          {/* Editor */}
          <div style={{ flex: bottomPanel ? `calc(100% - ${bottomPanelHeight}px)` : "100%", overflow: "hidden" }}>
            <EditorPanel
              openFiles={fileSystem.openFiles}
              activePath={fileSystem.activePath}
              onSetActive={fileSystem.setActiveFile}
              onClose={fileSystem.closeFile}
              onChange={fileSystem.updateFileContent}
              onSave={fileSystem.saveFile}
              hasUnsaved={fileSystem.hasUnsavedChanges}
            />
          </div>

          {/* Bottom Panel */}
          {bottomPanel && (
            <>
              <div
                onMouseDown={handleResizeBottom}
                style={{
                  height: 4,
                  cursor: "row-resize",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ width: 40, height: 2, background: "rgba(126,242,255,0.3)", borderRadius: 1 }} />
              </div>
              <div style={{ height: bottomPanelHeight, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {bottomPanel === "terminal" && (
                  <TerminalPanel
                    history={terminal.history}
                    cwd={terminal.cwd}
                    onExecute={terminal.executeCommand}
                  />
                )}
                {bottomPanel === "git" && (
                  <GitPanel
                    status={git.status}
                    branches={git.branches}
                    currentBranch={git.currentBranch}
                    commits={git.commits}
                    isLoading={git.isLoading}
                    error={git.error}
                    onStage={git.stageFile}
                    onUnstage={git.unstageFile}
                    onCommit={git.commit}
                    onCreateBranch={git.createBranch}
                    onCheckout={git.checkoutBranch}
                    onInit={git.initRepo}
                    onRefresh={() => { git.loadStatus(); git.loadBranches(); git.loadCommits(); }}
                    onGetDiff={git.getFileDiff}
                    clearError={git.clearError}
                  />
                )}
              </div>
            </>
          )}

          {/* Floating panels */}
          {costPanelOpen && (
            <div style={{
              position: "fixed",
              right: chatOpen ? 370 : 10,
              top: 50,
              width: 320,
              height: "calc(100% - 60px)",
              background: "rgba(10,20,36,0.98)",
              border: "1px solid rgba(126,242,255,0.15)",
              borderRadius: 10,
              zIndex: 60,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#7ef2ff" }}>📊 {t("totalCost")}</span>
                <span style={{ flex: 1 }} />
                <button onClick={() => setCostPanelOpen(false)} style={{ background: "transparent", border: "none", color: "#6b7f99", fontSize: 14, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                <CostDashboard />
              </div>
            </div>
          )}

          {chatHistoryOpen && (
            <div style={{
              position: "fixed",
              right: chatOpen ? 370 : 10,
              top: 50,
              width: 320,
              height: "calc(100% - 60px)",
              background: "rgba(10,20,36,0.98)",
              border: "1px solid rgba(126,242,255,0.15)",
              borderRadius: 10,
              zIndex: 60,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#7ef2ff" }}>💬 {t("history")}</span>
                <span style={{ flex: 1 }} />
                <button onClick={() => setChatHistoryOpen(false)} style={{ background: "transparent", border: "none", color: "#6b7f99", fontSize: 14, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                <ChatHistoryPanel />
              </div>
            </div>
          )}

          {codeHistoryOpen && (
            <div style={{
              position: "fixed",
              right: chatOpen ? 370 : 10,
              top: 50,
              width: 340,
              height: "calc(100% - 60px)",
              background: "rgba(10,20,36,0.98)",
              border: "1px solid rgba(126,242,255,0.15)",
              borderRadius: 10,
              zIndex: 60,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#7ef2ff" }}>📝 {t("history")}</span>
                <span style={{ flex: 1 }} />
                <button onClick={() => setCodeHistoryOpen(false)} style={{ background: "transparent", border: "none", color: "#6b7f99", fontSize: 14, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                <CodeHistoryPanel />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right AI Chat Sidebar */}
      {chatOpen && (
        <div style={{
          position: "fixed",
          right: 0,
          top: 40,
          bottom: 0,
          width: 360,
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(6,13,26,0.95)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}>
          <AIChatPanel
            workspaceFiles={fileSystem.openFiles.map((f) => ({ path: f.path, content: f.content }))}
            workspaceName={fileSystem.rootHandle?.name ?? t("untitled")}
            activePath={fileSystem.activePath}
            onApplyCode={(code, targetPath) => {
              const path = targetPath ?? fileSystem.activePath;
              if (path) {
                const before = fileSystem.openFiles.find((f) => f.path === path)?.content ?? "";
                fileSystem.updateFileContent(path, code);
                recordCodeEdit({
                  id: `edit-${Date.now()}`,
                  path,
                  timestamp: Date.now(),
                  action: "apply",
                  description: t("appliedAiCode") + " " + path.split("/").pop(),
                  before,
                  after: code,
                });
              }
            }}
          />
        </div>
      )}

      {/* Error Log */}
      {errorLogOpen && (
        <div style={{
          position: "fixed",
          right: chatOpen ? 370 : 10,
          top: 50,
          width: 360,
          height: "calc(100% - 60px)",
          background: "rgba(10,20,36,0.98)",
          border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 10,
          zIndex: 60,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>🐛 {t("errorLog")}</span>
            <span style={{ flex: 1 }} />
            <button onClick={() => setErrorLogOpen(false)} style={{ background: "transparent", border: "none", color: "#6b7f99", fontSize: 14, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            <ErrorLogPanel />
          </div>
        </div>
      )}

      {/* Account */}
      <AccountPanel isOpen={accountOpen} onClose={() => setAccountOpen(false)} />

      {/* Shortcuts Help */}
      <ShortcutsHelpPanel isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Project Tracker */}
      {trackerOpen && (
        <div style={{
          position: "fixed",
          right: chatOpen ? 370 : 10,
          top: 50,
          width: 360,
          height: "calc(100% - 60px)",
          background: "rgba(10,20,36,0.98)",
          border: "1px solid rgba(126,242,255,0.15)",
          borderRadius: 10,
          zIndex: 60,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7ef2ff" }}>📊 {t("trackerTitle")}</span>
            <span style={{ flex: 1 }} />
            <button onClick={() => setTrackerOpen(false)} style={{ background: "transparent", border: "none", color: "#6b7f99", fontSize: 14, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            <ProjectTrackerPanel
              currentProjectKey={projectKey}
              currentProjectName={fileSystem.rootHandle?.name ?? t("untitled")}
              currentProjectType={projectMeta?.type ?? "generic"}
              currentModel={loadSettings().defaultModel ?? "auto"}
            />
          </div>
        </div>
      )}

      {/* Settings */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} t={t} />

      {/* AI Command Palette */}
      <AICommandPalette
        isOpen={aiPaletteOpen}
        onClose={() => setAiPaletteOpen(false)}
        workspaceFiles={fileSystem.openFiles.map((f) => ({ path: f.path, content: f.content }))}
        onExecuteAction={(action, params) => {
          // AI action handled silently
        }}
      />

      {/* Status Bar */}
      <StatusBar
        gitBranch={git.currentBranch}
        gitStatus={git.status}
        openFilesCount={fileSystem.openFiles.length}
        activeFilePath={fileSystem.activePath}
        bottomPanel={bottomPanel}
      />
    </div>
  );
}
