// ─── AIChatPanel — Right sidebar chat với AI agent ────────────────────────
"use client";

import * as React from "react";
import {
  classifyTask,
  modelRouter,
  initAgentOrchestrator,
  getAgentOrchestrator,
} from "@omdala/core";
import { ModelPickerWithAuto } from "./ModelPicker";
import { loadSettings } from "./SettingsPanel";
import { SlashMenu, SLASH_COMMANDS } from "./SlashCommands";
import { recordUsage } from "./CostDashboard";
import { saveChatMessage } from "./ChatHistoryPanel";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  meta?: { model?: string; cost?: number; tokens?: number };
}

interface AIChatPanelProps {
  workspaceFiles: Array<{ path: string; content: string }>;
  workspaceName: string;
  activePath?: string | null;
  onApplyCode?: (code: string, targetPath?: string) => void;
}

function MessageContent({
  content,
  isAssistant,
  onApply,
  activePath,
}: {
  content: string;
  isAssistant: boolean;
  onApply?: (code: string, targetPath?: string) => void;
  activePath?: string | null;
}) {
  const segments: Array<{ type: "text"; text: string } | { type: "code"; lang?: string; code: string }> = [];
  const regex = /```([\w]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", text: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "code", lang: match[1] || undefined, code: match[2].trim() });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "text", text: content.slice(lastIndex) });
  }
  if (segments.length === 0) segments.push({ type: "text", text: content });

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <div key={i} style={{ margin: "6px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 8px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "6px 6px 0 0",
                border: "1px solid rgba(255,255,255,0.08)",
                borderBottom: "none",
              }}
            >
              <span style={{ fontSize: 10, color: "#6b7f99" }}>
                {seg.lang || "code"}
              </span>
              {isAssistant && onApply && (
                <button
                  onClick={() => onApply(seg.code, activePath ?? undefined)}
                  style={{
                    background: "rgba(74,222,128,0.15)",
                    color: "#4ade80",
                    border: "1px solid rgba(74,222,128,0.3)",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 10,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  ✓ Apply
                </button>
              )}
            </div>
            <pre
              style={{
                margin: 0,
                padding: "8px",
                background: "rgba(0,0,0,0.2)",
                borderRadius: "0 0 6px 6px",
                border: "1px solid rgba(255,255,255,0.08)",
                overflow: "auto",
                fontSize: 11,
                color: "#dbe7f5",
                fontFamily: "ui-monospace, monospace",
                maxHeight: 300,
              }}
            >
              <code>{seg.code}</code>
            </pre>
          </div>
        )
      )}
    </>
  );
}

export function AIChatPanel({ workspaceFiles, workspaceName, activePath, onApplyCode }: AIChatPanelProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<string>("auto");
  const [slashQuery, setSlashQuery] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    let orchestrator = getAgentOrchestrator();
    if (!orchestrator) {
      orchestrator = initAgentOrchestrator(modelRouter);
    }
    const s = loadSettings();
    if (s.defaultModel) setSelectedModel(s.defaultModel);

    function onInlineAI(e: Event) {
      const sel = (e as CustomEvent).detail as string;
      setInput(`Hãy giải thích / refactor đoạn code sau:\n\n${sel}`);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
    window.addEventListener("omcode:inline-ai", onInlineAI);
    return () => window.removeEventListener("omcode:inline-ai", onInlineAI);
  }, []);

  // Restore chat history per workspace
  React.useEffect(() => {
    if (!workspaceName) return;
    const key = `omcode:chat:${workspaceName}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, [workspaceName]);

  React.useEffect(() => {
    if (!workspaceName) return;
    const key = `omcode:chat:${workspaceName}`;
    try {
      localStorage.setItem(key, JSON.stringify(messages.slice(-100)));
    } catch {}
  }, [messages, workspaceName]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isProcessing) return;
    setInput("");
    setIsProcessing(true);

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);

    try {
      const classification = classifyTask(text, {
        filesInvolved: workspaceFiles.map((f) => f.path),
        language: "typescript",
        hasTests: workspaceFiles.some((f) => f.path.includes("test")),
        isDeployment: false,
        isSecuritySensitive: false,
      });

      // Parse @mentions
      const mentionRegex = /@(\S+)/g;
      const mentions = [...text.matchAll(mentionRegex)].map((m) => m[1]);
      const mentionFiles = workspaceFiles.filter((f) =>
        mentions.some((m) => f.path.includes(m) || f.path.split("/").pop()?.includes(m)),
      );

      // Build context from workspace
      const activeContext = workspaceFiles
        .slice(0, 5)
        .map((f) => `// ${f.path}\n${f.content.slice(0, 1500)}`)
        .join("\n\n");

      const mentionContext = mentionFiles.length
        ? mentionFiles.map((f) => `// ${f.path}\n${f.content.slice(0, 2000)}`).join("\n\n")
        : "";

      const systemPrompt = `Bạn là OMCODE AI, trợ lý lập trình. Workspace: ${workspaceName}. Task: ${classification.type}.

Active files context:
${activeContext || "(no files open)"}

${mentionContext ? `Mentioned files context:\n${mentionContext}` : ""}

Trả lời ngắn gọn, dùng tiếng Việt.`;

      // Override recommended model if user picked specific
      const effectiveClassification =
        selectedModel && selectedModel !== "auto"
          ? { ...classification, recommendedModel: selectedModel }
          : classification;

      const result = await modelRouter.route(
        {
          model: effectiveClassification.recommendedModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-6).map((m) => ({
              role: (m.role === "system" ? "user" : m.role) as "user" | "assistant",
              content: m.content,
            })),
            { role: "user", content: text },
          ],
          maxTokens: 1024,
        },
        classification,
      );

      // Track usage
      const providerId = result.modelUsed?.split(":")[0] || "unknown";
      recordUsage(
        result.modelUsed || "unknown",
        providerId,
        result.response.usage?.promptTokens || 0,
        result.response.usage?.completionTokens || 0,
        result.totalCost || 0,
      );
      saveChatMessage({ id: `u-${Date.now()}`, role: "user", content: text, timestamp: Date.now(), workspace: workspaceName, model: result.modelUsed });

      // Streaming reveal
      const msgId = `m-${Date.now() + 1}`;
      setMessages((m) => [
        ...m,
        {
          id: msgId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          meta: {
            model: result.modelUsed,
            cost: result.totalCost,
            tokens: result.response.usage?.totalTokens,
          },
        },
      ]);

      // Save assistant message after streaming (approximate)
      setTimeout(() => {
        saveChatMessage({ id: msgId, role: "assistant", content: result.response.content, timestamp: Date.now(), workspace: workspaceName, model: result.modelUsed });
      }, 2000);

      const fullText = result.response.content;
      const words = fullText.split(/(\s+)/);
      let idx = 0;
      const interval = setInterval(() => {
        if (idx >= words.length) {
          clearInterval(interval);
          return;
        }
        const chunk = words.slice(0, idx + 3).join("");
        setMessages((m) =>
          m.map((msg) => (msg.id === msgId ? { ...msg, content: chunk } : msg))
        );
        idx += 3;
      }, 30);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          id: `m-${Date.now() + 1}`,
          role: "system",
          content: `❌ Lỗi: ${err?.message ?? "unknown"}\n\nMẹo: kiểm tra API key trong Settings (⚙️).`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "rgba(6,13,26,0.7)" }}>
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#7ef2ff", letterSpacing: 0.5 }}>
            AI CHAT
          </span>
          <span style={{ fontSize: 10, color: "#6b7f99" }}>· {workspaceName}</span>
          <span style={{ flex: 1 }} />
          <button
            onClick={clearChat}
            title="Clear"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#a8b9d0",
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ModelPickerWithAuto value={selectedModel} onChange={setSelectedModel} />
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ color: "#6b7f99", fontSize: 12, textAlign: "center", marginTop: 24 }}>
            Hỏi AI về code workspace của bạn.
            <br />
            <span style={{ fontSize: 11 }}>Cần config API key trong ⚙️ Settings.</span>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "92%",
              padding: "8px 10px",
              borderRadius: 8,
              background:
                m.role === "user"
                  ? "rgba(126,242,255,0.12)"
                  : m.role === "system"
                  ? "rgba(255,160,80,0.08)"
                  : "rgba(255,255,255,0.04)",
              border:
                m.role === "system"
                  ? "1px solid rgba(255,160,80,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
              fontSize: 12,
              color: "#dbe7f5",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            <MessageContent
              content={m.content}
              isAssistant={m.role === "assistant"}
              onApply={onApplyCode}
              activePath={activePath}
            />
            {m.meta?.model && (
              <div style={{ marginTop: 4, fontSize: 10, color: "#6b7f99" }}>
                {m.meta.model} · {m.meta.tokens ?? 0} tok · ${m.meta.cost?.toFixed(5) ?? "0"}
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div style={{ color: "#6b7f99", fontSize: 11, fontStyle: "italic" }}>AI đang nghĩ…</div>
        )}
      </div>

      {slashQuery !== null && (
        <SlashMenu
          query={slashQuery}
          anchorRef={textareaRef}
          onSelect={(cmd) => {
            setSlashQuery(null);
            // Pick first open file as context
            const activeFile = workspaceFiles[0];
            const prompt = cmd.promptBuilder(
              activeFile?.content?.slice(0, 3000),
              activeFile?.path,
            );
            setInput(prompt);
          }}
          onClose={() => setSlashQuery(null)}
        />
      )}

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              const val = e.target.value;
              setInput(val);
              const match = val.match(/^\/(\w*)/);
              setSlashQuery(match ? match[1] : null);
            }}
            onKeyDown={(e) => {
              if (slashQuery !== null && (e.key === "Escape" || e.key === "ArrowDown" || e.key === "ArrowUp")) {
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Hỏi AI… (Enter để gửi, Shift+Enter xuống dòng, / để dùng command)"
            rows={2}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              padding: "8px",
              color: "#f7fbff",
              fontSize: 12,
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
            }}
          />
          <button
            onClick={send}
            disabled={isProcessing || !input.trim()}
            style={{
              background: "linear-gradient(135deg,#7ef2ff,#5cd9ff)",
              color: "#04101f",
              border: "none",
              borderRadius: 6,
              padding: "0 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing || !input.trim() ? 0.5 : 1,
            }}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
