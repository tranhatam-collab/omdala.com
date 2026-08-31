// ─── AI Command Palette — Tích hợp đầy đủ AI Orchestration System ─────────
"use client";

import * as React from "react";
import {
  classifyTask,
  getTaskTypeLabel,
  modelRouter,
  initAgentOrchestrator,
  getAgentOrchestrator,
  contextEngine,
  permissionLayer,
  type TaskClassification,
  type OrchestratorPlan,
  type ApprovalRequest,
} from "@omdala/core";
import { ModelPickerWithAuto } from "../workspace/components/ModelPicker";

interface AICommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceFiles: Array<{ path: string; content: string }>;
  onExecuteAction: (action: string, params: Record<string, unknown>) => void;
}

export function AICommandPalette({
  isOpen,
  onClose,
  workspaceFiles,
  onExecuteAction,
}: AICommandPaletteProps) {
  const [input, setInput] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [classification, setClassification] = React.useState<TaskClassification | null>(null);
  const [plan, setPlan] = React.useState<OrchestratorPlan | null>(null);
  const [pendingApproval, setPendingApproval] = React.useState<ApprovalRequest | null>(null);
  const [hasApproval, setHasApproval] = React.useState(false);
  const [response, setResponse] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<string>("auto");

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Initialize orchestrator on mount
  React.useEffect(() => {
    let orchestrator = getAgentOrchestrator();
    if (!orchestrator) {
      orchestrator = initAgentOrchestrator(modelRouter);
    }
  }, []);

  // Analyze repo on mount
  React.useEffect(() => {
    if (workspaceFiles.length > 0) {
      contextEngine.analyzeRepo("/", workspaceFiles);
    }
  }, [workspaceFiles]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);
    setResponse(null);
    setPlan(null);
    setPendingApproval(null);
    setHasApproval(false);

    try {
      // Step 1: Classify task
      const taskClassification = classifyTask(input, {
        filesInvolved: workspaceFiles.map((f) => f.path),
        language: "typescript",
        hasTests: workspaceFiles.some((f) => f.path.includes("test")),
        isDeployment: false,
        isSecuritySensitive: false,
      });
      setClassification(taskClassification);

      // Step 2: Check permission for the action
      const permission = await permissionLayer.checkPermission(
        "write_file",
        "*",
        "ai-agent",
      );

      if (permission.level === "ask" && !hasApproval) {
        const approval = await permissionLayer.requestApproval(
          "write_file",
          "*",
          `AI agent wants to execute: ${input}`,
          "ai-agent",
        );
        if (approval.status === "pending") {
          setPendingApproval(approval);
          setIsProcessing(false);
          return;
        }
      }

      // Step 3: Get context
      const context = await contextEngine.queryContext({
        task: input,
        filesInvolved: workspaceFiles.map((f) => f.path),
        maxTokens: 8000,
        includeTests: true,
        includeDocs: false,
        preferRecent: true,
      });

      // Step 4: Create execution plan
      const orchestrator = getAgentOrchestrator();
      if (!orchestrator) {
        throw new Error("Agent orchestrator not initialized");
      }
      // Apply user-selected model override if not auto
      const effectiveClassification =
        selectedModel && selectedModel !== "auto"
          ? { ...taskClassification, recommendedModel: selectedModel }
          : taskClassification;
      const executionPlan = await orchestrator.plan(input, effectiveClassification, {
        files: context.files.map((file) => file.path),
        language: "typescript",
      });
      setPlan(executionPlan);
      onExecuteAction("orchestrator_plan_created", {
        prompt: input,
        taskCount: executionPlan.tasks.length,
        contextTokens: context.totalTokens,
      });

      // Step 5: Execute plan (simplified - just show plan for now)
      setResponse(`Kế hoạch thực thi đã tạo với ${executionPlan.tasks.length} tasks:\n\n` +
        executionPlan.tasks.map((t: { description: string; agentId: string }, i: number) => `${i + 1}. ${t.description} (${t.agentId})`).join("\n"));

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = () => {
    if (pendingApproval) {
      permissionLayer.approveRequest(pendingApproval.id);
      setPendingApproval(null);
      setHasApproval(true); // Set approval flag to avoid loop
      // Continue execution
      handleSubmit();
    }
  };

  const handleDeny = () => {
    if (pendingApproval) {
      permissionLayer.denyRequest(pendingApproval.id, "User denied");
      setPendingApproval(null);
      setError("User denied the action");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 700,
          maxHeight: "80vh",
          background: "#060d1a",
          border: "1px solid rgba(126,242,255,0.2)",
          borderRadius: 16,
          boxShadow: "0 0 60px rgba(126,242,255,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #153a72, #3d8bff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}>
              ✦
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f7fbff", margin: 0 }}>
                AI Command Palette
              </h2>
              <p style={{ fontSize: 12, color: "#6b7f99", margin: "4px 0 0" }}>
                Được hỗ trợ bởi Multi-Agent Orchestration System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "rgba(255,255,255,0.05)",
              color: "#a8b9d0",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Input */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <span style={{ fontSize: 20, color: "#7ef2ff" }}>✧</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Nhập yêu cầu... (ví dụ: 'Sửa lỗi trong file user.ts', 'Tạo component mới')"
              disabled={isProcessing}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#f7fbff",
                fontSize: 14,
                fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)",
              }}
            />
            {isProcessing && (
              <div style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "2px solid rgba(126,242,255,0.3)",
                borderTopColor: "#7ef2ff",
                animation: "spin 1s linear infinite",
              }} />
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "0 20px 20px" }}>
          {error && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.2)",
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
            </div>
          )}

          {classification && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(126,242,255,0.05)",
              border: "1px solid rgba(126,242,255,0.15)",
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 11, color: "#6b7f99", margin: "0 0 8px", textTransform: "uppercase" }}>
                Phân loại task
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "rgba(126,242,255,0.15)",
                  color: "#7ef2ff",
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {getTaskTypeLabel(classification.type)}
                </span>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: classification.priority === "high" ? "rgba(248,113,113,0.15)" : "rgba(251,191,36,0.15)",
                  color: classification.priority === "high" ? "#f87171" : "#fbbf24",
                  fontSize: 12,
                }}>
                  Priority: {classification.priority}
                </span>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "rgba(168,185,208,0.15)",
                  color: "#a8b9d0",
                  fontSize: 12,
                }}>
                  Complexity: {classification.complexity}
                </span>
              </div>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#6b7f99", whiteSpace: "nowrap" }}>
                  Model:
                </span>
                <ModelPickerWithAuto
                  value={selectedModel}
                  onChange={setSelectedModel}
                  size="sm"
                />
                <span style={{ fontSize: 10, color: "#6b7f99", whiteSpace: "nowrap" }}>
                  (đề xuất: {classification.recommendedModel})
                </span>
              </div>
            </div>
          )}

          {pendingApproval && (
            <div style={{
              padding: 16,
              borderRadius: 8,
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)",
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 13, color: "#fbbf24", margin: "0 0 12px", fontWeight: 600 }}>
                ⚠️ Yêu cầu phê duyệt
              </p>
              <p style={{ fontSize: 12, color: "#a8b9d0", margin: "0 0 16px" }}>
                {pendingApproval.description}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleApprove}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: "none",
                    background: "rgba(74,222,128,0.2)",
                    color: "#4ade80",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  ✓ Phê duyệt
                </button>
                <button
                  onClick={handleDeny}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: "none",
                    background: "rgba(248,113,113,0.2)",
                    color: "#f87171",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  ✕ Từ chối
                </button>
              </div>
            </div>
          )}

          {plan && (
            <div style={{
              padding: 16,
              borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 11, color: "#6b7f99", margin: "0 0 12px", textTransform: "uppercase" }}>
                Kế hoạch thực thi
              </p>
              {plan.tasks.map((task, i) => (
                <div
                  key={task.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.02)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: "rgba(126,242,255,0.15)",
                    color: "#7ef2ff",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: "#f7fbff", margin: 0, fontWeight: 500 }}>
                      {task.description}
                    </p>
                    <p style={{ fontSize: 11, color: "#6b7f99", margin: "4px 0 0" }}>
                      Agent: {task.agentId}
                    </p>
                  </div>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    background: "rgba(168,185,208,0.15)",
                    color: "#a8b9d0",
                    fontSize: 10,
                  }}>
                    {task.status}
                  </span>
                </div>
              ))}
              <div style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: 16,
                fontSize: 11,
                color: "#6b7f99",
              }}>
                <span>⏱️ Thời gian ước tính: {plan.estimatedDuration}s</span>
                <span>💰 Chi phí ước tính: ${plan.estimatedCost.toFixed(4)}</span>
              </div>
            </div>
          )}

          {response && (
            <div style={{
              padding: 16,
              borderRadius: 8,
              background: "rgba(74,222,128,0.05)",
              border: "1px solid rgba(74,222,128,0.15)",
            }}>
              <p style={{ fontSize: 11, color: "#6b7f99", margin: "0 0 8px", textTransform: "uppercase" }}>
                Kết quả
              </p>
              <pre style={{
                fontSize: 12,
                color: "#4ade80",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {response}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#6b7f99",
        }}>
          <span>⌘K để mở</span>
          <span>Được hỗ trợ bởi Task Classifier • Model Router • Agent Orchestrator • Context Engine • Permission Layer</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
