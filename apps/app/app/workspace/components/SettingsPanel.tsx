"use client";

import * as React from "react";
import {
  clearLegacyAiBrowserState,
  getVerifiedAiagentCatalog,
  isAiagentModelId,
  type AiagentModel,
} from "../api/gateway";
import { ModelPickerWithAuto, resolveAiagentModel } from "./ModelPicker";
import {
  loadWorkspacePolicy,
  saveWorkspacePolicy,
  type WorkspacePolicy,
} from "@/lib/policy-engine";

const STORAGE_KEY = "omcode:settings";

export interface Settings {
  defaultModel: string;
}

const DEFAULT_SETTINGS: Settings = { defaultModel: "" };

function sanitizeDefaultModel(value: unknown): string {
  return typeof value === "string" && isAiagentModelId(value)
    ? value
    : "";
}

export function loadSettings(): Settings {
  clearLegacyAiBrowserState();
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const safe = {
      defaultModel: sanitizeDefaultModel(
        parsed && typeof parsed === "object" ? parsed.defaultModel : undefined,
      ),
    };
    // Rewrite the record so credentials and obsolete provider configuration
    // from earlier releases are removed from persistent browser storage.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return safe;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  const safe = { defaultModel: sanitizeDefaultModel(settings.defaultModel) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  clearLegacyAiBrowserState();
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  t?: (key: string) => string;
}

const POLICY_OPTIONS: Array<{
  key: keyof WorkspacePolicy;
  label: string;
}> = [
  { key: "allowRenameSession", label: "Cho phép đổi tên phiên" },
  { key: "allowRenameSpace", label: "Cho phép đổi tên workspace" },
  { key: "allowRenameProject", label: "Cho phép đổi tên dự án" },
  { key: "allowRenameFolder", label: "Cho phép đổi tên thư mục" },
  { key: "allowRenameRepository", label: "Cho phép đổi tên repository" },
  { key: "allowCreateWorkspace", label: "Cho phép tạo workspace" },
  { key: "allowDeleteWorkspace", label: "Cho phép xóa workspace" },
];

export function SettingsPanel({ isOpen, onClose, t: translate }: SettingsPanelProps) {
  const t = translate ?? ((key: string) => key);
  const [settings, setSettings] = React.useState<Settings>(DEFAULT_SETTINGS);
  const [models, setModels] = React.useState<AiagentModel[]>([]);
  const [catalogStatus, setCatalogStatus] = React.useState("");
  const [policy, setPolicy] = React.useState<WorkspacePolicy>(() => loadWorkspacePolicy());
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setSettings(loadSettings());
      setPolicy(loadWorkspacePolicy());
      setSaved(false);
      setCatalogStatus("Đang xác minh catalog AIAGENT…");
    });
    getVerifiedAiagentCatalog()
      .then((catalog) => {
        setModels(catalog.models);
        setSettings((current) => ({
          defaultModel: resolveAiagentModel(current.defaultModel, catalog.models),
        }));
        setCatalogStatus(`Đã xác minh ${catalog.models.length} model khả dụng.`);
      })
      .catch(() => {
        setModels([]);
        setCatalogStatus("Catalog AIAGENT chưa khả dụng; không thể chọn model.");
      });
  }, [isOpen]);

  const save = () => {
    saveSettings(settings);
    saveWorkspacePolicy(policy);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
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
        onClick={(event) => event.stopPropagation()}
        style={{
          background: "#0a1424",
          border: "1px solid rgba(126,242,255,0.2)",
          borderRadius: 10,
          width: "min(560px, 92vw)",
          maxHeight: "85vh",
          overflow: "auto",
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
            <div style={{ fontSize: 14, fontWeight: 700, color: "#7ef2ff" }}>
              {t("settingsTitle")}
            </div>
            <div style={{ fontSize: 11, color: "#6b7f99", marginTop: 3 }}>
              AI chỉ đi qua OMDALA API proxy và AIAGENT contract 1.0.0. Trình duyệt không nhận provider credential.
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
              cursor: "pointer",
            }}
          >
            {t("close")}
          </button>
        </div>

        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
          <section>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f7fbff", marginBottom: 8 }}>
              Model mặc định
            </div>
            <ModelPickerWithAuto
              value={settings.defaultModel}
              models={models}
              onChange={(defaultModel) => setSettings({ defaultModel })}
              size="md"
            />
            <p style={{ margin: "8px 0 0", color: "#6b7f99", fontSize: 11 }}>
              {catalogStatus}
            </p>
          </section>

          <section>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f7fbff", marginBottom: 8 }}>
              Workspace policy
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {POLICY_OPTIONS.map((option) => (
                <label
                  key={option.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#a8b9d0",
                    fontSize: 12,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={policy[option.key]}
                    onChange={(event) =>
                      setPolicy((current) => ({
                        ...current,
                        [option.key]: event.target.checked,
                      }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </section>

          <button
            onClick={save}
            style={{
              padding: "10px 16px",
              borderRadius: 7,
              border: "none",
              background: "linear-gradient(135deg,#7ef2ff,#5cd9ff)",
              color: "#04101f",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {saved ? t("saved") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
