// ─── ModelPicker — Chọn model AI cho mọi panel ───────────────────────────
"use client";

import * as React from "react";
import { AI_PROVIDERS, type AIModel } from "@omdala/core";
import { loadSettings } from "./SettingsPanel";

export function getAllChatModels(): AIModel[] {
  const models: AIModel[] = [];
  for (const provider of Object.values(AI_PROVIDERS)) {
    for (const model of provider.models) {
      if (model.type === "chat") models.push(model);
    }
  }
  return models;
}

export function getAvailableModels(): AIModel[] {
  // Filter to only models whose provider has API key configured (or local)
  const settings = loadSettings();
  return getAllChatModels().filter((m) => {
    if (m.provider === "local") return true;
    return Boolean(settings.keys[m.provider]?.apiKey);
  });
}

interface ModelPickerProps {
  value: string;
  onChange: (modelId: string) => void;
  showOnlyAvailable?: boolean;
  size?: "sm" | "md";
  label?: string;
}

interface CustomModel {
  id: string;
  name: string;
  provider: string;
}

export function ModelPickerWithAuto({
  value,
  onChange,
  customModels = [],
  size = "sm",
}: {
  value: string;
  onChange: (v: string) => void;
  customModels?: CustomModel[];
  size?: "sm" | "md";
}) {
  const [models, setModels] = React.useState<AIModel[]>([]);
  React.useEffect(() => {
    setModels(getAllChatModels());
  }, []);

  const grouped = React.useMemo(() => {
    const map: Record<string, AIModel[]> = {};
    for (const m of models) (map[m.provider] ||= []).push(m);
    return map;
  }, [models]);

  const fontSize = size === "sm" ? 11 : 12;
  const padding = size === "sm" ? "5px 8px" : "7px 10px";

  return (
    <select
      aria-label="Chọn AI model"
      title="Chọn AI model"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(126,242,255,0.18)",
        borderRadius: 6,
        padding,
        color: "#dbe7f5",
        fontSize,
        fontFamily: "inherit",
        outline: "none",
        cursor: "pointer",
        width: "100%",
      }}
    >
      <option value="auto">⚡ Auto (Task Classifier chọn)</option>
      {Object.entries(grouped).map(([providerId, list]) => (
        <optgroup key={providerId} label={AI_PROVIDERS[providerId]?.name || providerId}>
          {list.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · ${m.costPer1kInput}/1k in · ${m.costPer1kOutput}/1k out
            </option>
          ))}
        </optgroup>
      ))}
      {customModels.length > 0 && (
        <optgroup label="Custom">
          {customModels.map((cm) => (
            <option key={cm.id} value={cm.id}>
              {cm.name} ({cm.provider})
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

export function ModelPicker({
  value,
  onChange,
  showOnlyAvailable = false,
  size = "sm",
  label,
}: ModelPickerProps) {
  const [models, setModels] = React.useState<AIModel[]>([]);

  React.useEffect(() => {
    setModels(showOnlyAvailable ? getAvailableModels() : getAllChatModels());
  }, [showOnlyAvailable]);

  const grouped = React.useMemo(() => {
    const map: Record<string, AIModel[]> = {};
    for (const m of models) {
      (map[m.provider] ||= []).push(m);
    }
    return map;
  }, [models]);

  const fontSize = size === "sm" ? 11 : 12;
  const padding = size === "sm" ? "5px 8px" : "7px 10px";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {label && (
        <span style={{ fontSize: fontSize - 1, color: "#6b7f99", whiteSpace: "nowrap" }}>
          {label}
        </span>
      )}
      <select
        aria-label={label || "Chọn AI model"}
        title={label || "Chọn AI model"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(126,242,255,0.18)",
          borderRadius: 6,
          padding,
          color: "#dbe7f5",
          fontSize,
          fontFamily: "inherit",
          outline: "none",
          cursor: "pointer",
          minWidth: 180,
        }}
      >
        {Object.keys(grouped).length === 0 && (
          <option value="">(chưa có model — config API key)</option>
        )}
        {Object.entries(grouped).map(([providerId, list]) => (
          <optgroup key={providerId} label={AI_PROVIDERS[providerId]?.name || providerId}>
            {list.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · ${m.costPer1kInput}/1k in
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
