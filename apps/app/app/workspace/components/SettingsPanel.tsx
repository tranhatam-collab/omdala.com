// ─── SettingsPanel — Cấu hình AI providers, API keys ─────────────────────
"use client";

import * as React from "react";
import { modelRouter } from "@omdala/core";
import { ModelPickerWithAuto } from "./ModelPicker";
import { loadWorkspacePolicy, saveWorkspacePolicy, type WorkspacePolicy } from "@/lib/policy-engine";

interface ProviderKey {
  id: string;
  label: string;
  envHint: string;
  baseUrlPlaceholder?: string;
}

const PROVIDERS: ProviderKey[] = [
  { id: "openai", label: "OpenAI", envHint: "sk-..." },
  { id: "anthropic", label: "Anthropic", envHint: "sk-ant-..." },
  { id: "google", label: "Google Gemini", envHint: "AIza..." },
  { id: "groq", label: "Groq", envHint: "gsk_..." },
  { id: "deepseek", label: "DeepSeek", envHint: "sk-..." },
  { id: "cloudflare", label: "Cloudflare AI", envHint: "Account ID:Token" },
  { id: "local", label: "Local (Ollama)", envHint: "no key", baseUrlPlaceholder: "http://localhost:11434" },
];

const STORAGE_KEY = "omcode:settings";

interface CustomModel {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
}

interface Settings {
  keys: Record<string, { apiKey?: string; baseUrl?: string }>;
  preferLocal: boolean;
  costThreshold: number;
  defaultModel?: string;
  customModels?: CustomModel[];
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        keys: parsed.keys ?? {},
        preferLocal: parsed.preferLocal ?? false,
        costThreshold: parsed.costThreshold ?? 1.0,
        defaultModel: parsed.defaultModel,
        customModels: parsed.customModels ?? [],
      };
    }
  } catch {}
  return { keys: {}, preferLocal: false, costThreshold: 1.0, customModels: [] };
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    applySettingsToRouter(s);
  } catch {}
}

export function applySettingsToRouter(s: Settings) {
  for (const [providerId, cfg] of Object.entries(s.keys)) {
    if (cfg.apiKey || cfg.baseUrl) {
      modelRouter.setProviderConfig(providerId, cfg);
    }
  }
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  t?: (key: string) => string;
}

export function SettingsPanel({ isOpen, onClose, t: _t }: SettingsPanelProps) {
  const t = _t ?? ((k: string) => k);
  const [settings, setSettings] = React.useState<Settings>(() => loadSettings());
  const [policy, setPolicy] = React.useState<WorkspacePolicy>(() => loadWorkspacePolicy());
  const [saved, setSaved] = React.useState(false);
  const [customName, setCustomName] = React.useState("");
  const [customProvider, setCustomProvider] = React.useState("");
  const [customKey, setCustomKey] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setSettings(loadSettings());
        setPolicy(loadWorkspacePolicy());
        setSaved(false);
      });
    }
  }, [isOpen]);

  const updateKey = (providerId: string, field: "apiKey" | "baseUrl", value: string) => {
    setSettings((s) => ({
      ...s,
      keys: {
        ...s.keys,
        [providerId]: { ...s.keys[providerId], [field]: value },
      },
    }));
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      applySettingsToRouter(settings);
      saveWorkspacePolicy(policy);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      alert("Không lưu được settings: " + (e as Error).message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,15,0.7)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a1424",
          border: "1px solid rgba(126,242,255,0.2)",
          borderRadius: 10,
          width: "min(640px, 90vw)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#7ef2ff" }}>{t("settingsTitle")}</div>
            <div style={{ fontSize: 11, color: "#6b7f99", marginTop: 2 }}>
              {t("settingsHint")}
            </div>
          </div>
          <span style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#a8b9d0",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {t("close")}
          </button>
        </div>

        <div style={{ overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {PROVIDERS.map((p) => {
            const cfg = settings.keys[p.id] || {};
            return (
              <div
                key={p.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: 12,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        p.id === "local"
                          ? "#7ef2ff"
                          : cfg.apiKey
                          ? "#4ade80"
                          : "rgba(255,255,255,0.15)",
                      boxShadow: cfg.apiKey ? "0 0 6px rgba(74,222,128,0.5)" : "none",
                    }}
                    title={cfg.apiKey ? "Đã cấu hình" : "Chưa có API key"}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#f7fbff" }}>{p.label}</span>
                  <span style={{ fontSize: 10, color: "#6b7f99" }}>({p.id})</span>
                  {cfg.apiKey && (
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#4ade80" }}>● {t("active")}</span>
                  )}
                </div>
                <input
                  type="password"
                  value={cfg.apiKey ?? ""}
                  onChange={(e) => updateKey(p.id, "apiKey", e.target.value)}
                  placeholder={`${t("apiKeyPlaceholder")} (${p.envHint})`}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    padding: "7px 10px",
                    color: "#dbe7f5",
                    fontSize: 11,
                    fontFamily: "ui-monospace, monospace",
                    outline: "none",
                  }}
                />
                {p.baseUrlPlaceholder && (
                  <input
                    type="text"
                    value={cfg.baseUrl ?? ""}
                    onChange={(e) => updateKey(p.id, "baseUrl", e.target.value)}
                    placeholder={`Base URL (${p.baseUrlPlaceholder})`}
                    style={{
                      width: "100%",
                      marginTop: 6,
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6,
                      padding: "7px 10px",
                      color: "#dbe7f5",
                      fontSize: 11,
                      fontFamily: "ui-monospace, monospace",
                      outline: "none",
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Custom Models */}
          <div
            style={{
              border: "1px solid rgba(126,242,255,0.15)",
              borderRadius: 8,
              padding: 12,
              background: "rgba(126,242,255,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7ef2ff" }}>{t("customModel")}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#a8b9d0" }}>{t("customModelName")}</span>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="gpt-4-turbo, claude-3-sonnet, ..."
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  padding: "7px 10px",
                  color: "#dbe7f5",
                  fontSize: 11,
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 11, color: "#a8b9d0" }}>{t("customProvider")}</span>
              <input
                type="text"
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                placeholder="openai, anthropic, google, groq, ..."
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  padding: "7px 10px",
                  color: "#dbe7f5",
                  fontSize: 11,
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 11, color: "#a8b9d0" }}>{t("customApiKey")}</span>
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="sk-..."
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  padding: "7px 10px",
                  color: "#dbe7f5",
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                  outline: "none",
                }}
              />
              <button
                onClick={() => {
                  if (!customName.trim() || !customProvider.trim() || !customKey.trim()) return;
                  const newModel: CustomModel = {
                    id: `custom-${Date.now()}`,
                    name: customName.trim(),
                    provider: customProvider.trim(),
                    apiKey: customKey.trim(),
                  };
                  setSettings((s) => ({
                    ...s,
                    customModels: [...(s.customModels ?? []), newModel],
                  }));
                  setCustomName("");
                  setCustomProvider("");
                  setCustomKey("");
                }}
                style={{
                  alignSelf: "flex-start",
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(126,242,255,0.25)",
                  background: "rgba(126,242,255,0.1)",
                  color: "#7ef2ff",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: 4,
                }}
              >
                + {t("addCustom")}
              </button>
            </div>
            {settings.customModels && settings.customModels.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                {settings.customModels.map((cm) => (
                  <div key={cm.id} style={{ fontSize: 11, color: "#a8b9d0", display: "flex", gap: 8 }}>
                    <span style={{ color: "#f7fbff", fontWeight: 600 }}>{cm.name}</span>
                    <span>({cm.provider})</span>
                    <button
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          customModels: (s.customModels ?? []).filter((m) => m.id !== cm.id),
                        }))
                      }
                      style={{
                        marginLeft: "auto",
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        fontSize: 10,
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: 12,
              background: "rgba(255,255,255,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#f7fbff" }}>Routing & Model</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#a8b9d0" }}>{t("defaultModel")}</span>
              <ModelPickerWithAuto
                value={settings.defaultModel ?? "auto"}
                onChange={(v) => setSettings((s) => ({ ...s, defaultModel: v }))}
                customModels={settings.customModels ?? []}
                size="md"
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#dbe7f5" }}>
              <input
                type="checkbox"
                checked={settings.preferLocal}
                onChange={(e) => setSettings((s) => ({ ...s, preferLocal: e.target.checked }))}
              />
              {t("preferLocal")}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#dbe7f5" }}>
              {t("costThreshold")}
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.costThreshold}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, costThreshold: Number(e.target.value) || 0 }))
                }
                style={{
                  width: 80,
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  padding: "4px 8px",
                  color: "#dbe7f5",
                  fontSize: 11,
                }}
              />
            </label>
          </div>

          {/* Workspace Policy */}
          <div
            style={{
              border: "1px solid rgba(126,242,255,0.15)",
              borderRadius: 8,
              padding: 12,
              background: "rgba(126,242,255,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7ef2ff" }}>Workspace Policy</span>
            <span style={{ fontSize: 10, color: "#6b7f99" }}>
              Kiểm soát AI agent — ngăn đổi tên session/space/project
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#dbe7f5" }}>
                <input
                  type="checkbox"
                  checked={policy.allowRenameSession}
                  onChange={(e) => setPolicy((p) => ({ ...p, allowRenameSession: e.target.checked }))}
                />
                Cho phép AI đổi tên session
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#dbe7f5" }}>
                <input
                  type="checkbox"
                  checked={policy.allowRenameSpace}
                  onChange={(e) => setPolicy((p) => ({ ...p, allowRenameSpace: e.target.checked }))}
                />
                Cho phép AI đổi tên space
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#dbe7f5" }}>
                <input
                  type="checkbox"
                  checked={policy.allowRenameProject}
                  onChange={(e) => setPolicy((p) => ({ ...p, allowRenameProject: e.target.checked }))}
                />
                Cho phép AI đổi tên project
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#dbe7f5" }}>
                <input
                  type="checkbox"
                  checked={policy.allowRenameFolder}
                  onChange={(e) => setPolicy((p) => ({ ...p, allowRenameFolder: e.target.checked }))}
                />
                Cho phép AI đổi tên folder
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#dbe7f5" }}>
                <input
                  type="checkbox"
                  checked={policy.allowRenameRepository}
                  onChange={(e) => setPolicy((p) => ({ ...p, allowRenameRepository: e.target.checked }))}
                />
                Cho phép AI đổi tên repository
              </label>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 14,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {saved && <span style={{ fontSize: 11, color: "#7ef2ff" }}>✓ {t("saved")}</span>}
          <span style={{ flex: 1 }} />
          <button
            onClick={save}
            style={{
              background: "linear-gradient(135deg,#7ef2ff,#5cd9ff)",
              color: "#04101f",
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
