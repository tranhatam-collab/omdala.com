// ─── EditorPanel — Monaco Editor + Tabs ─────────────────────────────────
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { OpenFileEntry } from "../hooks/useFileSystem";
import { useI18n } from "../hooks/useI18n";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

interface EditorPanelProps {
  openFiles: OpenFileEntry[];
  activePath: string | null;
  onSetActive: (path: string) => void;
  onClose: (path: string) => void;
  onChange: (path: string, content: string) => void;
  onSave: (path: string) => void;
  hasUnsaved: (path: string) => boolean;
}

export function EditorPanel({
  openFiles,
  activePath,
  onSetActive,
  onClose,
  onChange,
  onSave,
  hasUnsaved,
}: EditorPanelProps) {
  const { t } = useI18n();
  const activeFile = openFiles.find((f) => f.path === activePath);
  const [theme, setTheme] = React.useState<"vs-dark" | "vs">("vs-dark");
  const [saving, setSaving] = React.useState(false);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = React.useRef<any>(null);

  // Autosave: debounce 2s after last change
  React.useEffect(() => {
    if (!activeFile || !hasUnsaved(activeFile.path)) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaving(true);
      onSave(activeFile.path);
      setTimeout(() => setSaving(false), 600);
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [activeFile?.content, activeFile?.path]);

  // Keyboard shortcuts
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (activePath) onSave(activePath);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePath, onSave]);

  if (openFiles.length === 0) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "linear-gradient(135deg, rgba(126,242,255,0.1), rgba(61,139,255,0.1))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
        }}>
          ✦
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#f7fbff", margin: 0 }}>
            {t("noOpenFile")}
          </p>
          <p style={{ fontSize: 13, color: "#6b7f99", margin: "8px 0 0" }}>
            {t("openFileHint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Tab Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {openFiles.map((file) => {
          const isActive = file.path === activePath;
          const unsaved = hasUnsaved(file.path);
          return (
            <div
              key={file.path}
              onClick={() => onSetActive(file.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                fontSize: 12,
                cursor: "pointer",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                background: isActive ? "rgba(126,242,255,0.06)" : "transparent",
                color: isActive ? "#7ef2ff" : "#6b7f99",
                fontWeight: isActive ? 600 : 400,
                whiteSpace: "nowrap",
                transition: "all 150ms",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: unsaved ? "#fbbf24" : "transparent",
                flexShrink: 0,
              }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                {file.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(file.path);
                }}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: "none",
                  background: "transparent",
                  color: "#6b7f99",
                  fontSize: 14,
                  lineHeight: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.2)"; e.currentTarget.style.color = "#f87171"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7f99"; }}
              >
                ×
              </button>
              {isActive && (
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "#7ef2ff",
                  borderRadius: "2px 2px 0 0",
                }} />
              )}
            </div>
          );
        })}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme((t) => (t === "vs-dark" ? "vs" : "vs-dark"))}
          style={{
            marginLeft: "auto",
            marginRight: 12,
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent",
            color: "#6b7f99",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          {theme === "vs-dark" ? "🌙" : "☀️"}
        </button>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {activeFile && (
          <MonacoEditor
            key={activeFile.path}
            value={activeFile.content}
            language={activeFile.language}
            theme={theme === "vs-dark" ? "omdala-dark" : "vs"}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              minimap: { enabled: true, scale: 1 },
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              tabSize: 2,
              wordWrap: "on",
              folding: true,
              renderLineHighlight: "all",
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true, indentation: true },
              quickSuggestions: true,
              suggestOnTriggerCharacters: true,
              parameterHints: { enabled: true },
              formatOnType: true,
              formatOnPaste: true,
            }}
            onChange={(value) => {
              if (value !== undefined) onChange(activeFile.path, value);
            }}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              // Autosave on blur
              editor.onDidBlurEditorWidget(() => {
                if (activeFile && hasUnsaved(activeFile.path)) {
                  setSaving(true);
                  onSave(activeFile.path);
                  setTimeout(() => setSaving(false), 600);
                }
              });
              // Define custom theme
              monaco.editor.defineTheme("omdala-dark", {
                base: "vs-dark",
                inherit: true,
                rules: [
                  { token: "comment", foreground: "6b7f99", fontStyle: "italic" },
                  { token: "keyword", foreground: "7ef2ff" },
                  { token: "identifier", foreground: "a8b9d0" },
                  { token: "string", foreground: "4ade80" },
                  { token: "number", foreground: "fbbf24" },
                  { token: "type", foreground: "a78bfa" },
                  { token: "function", foreground: "60a5fa" },
                  { token: "variable", foreground: "f7fbff" },
                  { token: "operator", foreground: "f87171" },
                ],
                colors: {
                  "editor.background": "#060d1a",
                  "editor.foreground": "#a8b9d0",
                  "editor.lineHighlightBackground": "#0f1d33",
                  "editor.selectionBackground": "rgba(126,242,255,0.15)",
                  "editor.inactiveSelectionBackground": "rgba(126,242,255,0.08)",
                  "editorCursor.foreground": "#7ef2ff",
                  "editorWhitespace.foreground": "rgba(255,255,255,0.05)",
                  "editorLineNumber.foreground": "#3a4a5c",
                  "editorLineNumber.activeForeground": "#7ef2ff",
                  "editorIndentGuide.background": "rgba(255,255,255,0.03)",
                  "editorIndentGuide.activeBackground": "rgba(126,242,255,0.1)",
                  "editorSuggestWidget.background": "#0f1d33",
                  "editorSuggestWidget.border": "rgba(126,242,255,0.15)",
                  "editorSuggestWidget.selectedBackground": "rgba(126,242,255,0.1)",
                  "editorWidget.background": "#0f1d33",
                  "editorWidget.border": "rgba(126,242,255,0.15)",
                  "menu.background": "#0f1d33",
                  "menu.selectionBackground": "rgba(126,242,255,0.1)",
                  "panel.background": "#060d1a",
                  "sideBar.background": "#0a1628",
                  "statusBar.background": "#0f1d33",
                  "activityBar.background": "#0a1628",
                  "tab.activeBackground": "rgba(126,242,255,0.06)",
                  "tab.inactiveBackground": "#060d1a",
                  "tab.border": "rgba(255,255,255,0.06)",
                },
              });
              monaco.editor.setTheme("omdala-dark");
            }}
          />
        )}
      </div>

      {/* Status bar */}
      <div style={{
        padding: "4px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontSize: 11,
        color: "#6b7f99",
      }}>
        {activeFile && (
          <>
            <span>{activeFile.language}</span>
            <span>UTF-8</span>
            <span>{activeFile.content.split("\n").length} {t("lines")}</span>
            <span>{activeFile.content.length} {t("chars")}</span>
            {hasUnsaved(activeFile.path) && !saving && (
              <span style={{ color: "#fbbf24" }}>● {t("unsaved")}</span>
            )}
            {saving && (
              <span style={{ color: "#4ade80" }}>◌ {t("saving")}</span>
            )}
            <button
              onClick={() => {
                editorRef.current?.getAction("editor.action.formatDocument")?.run();
              }}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: "#6b7f99",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {t("formatShortcut")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
