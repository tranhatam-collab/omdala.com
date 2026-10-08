"use client";

import * as React from "react";
import type { AiagentModel } from "../api/gateway";

export function resolveAiagentModel(
  value: string | undefined,
  models: AiagentModel[],
): string {
  const chatModels = models.filter((model) => model.capabilities.includes("chat"));
  if (value && chatModels.some((model) => model.id === value)) return value;
  return chatModels[0]?.id ?? "";
}

interface ModelPickerProps {
  value: string;
  models: AiagentModel[];
  onChange: (modelId: string) => void;
  size?: "sm" | "md";
  label?: string;
}

function modelLabel(modelId: string): string {
  return modelId.replace("iai-one/", "").replaceAll("-", " ");
}

export function ModelPicker({
  value,
  models,
  onChange,
  size = "sm",
  label,
}: ModelPickerProps) {
  const available = React.useMemo(
    () => models.filter((model) => model.capabilities.includes("chat")),
    [models],
  );
  const selected = resolveAiagentModel(value, available);
  const fontSize = size === "sm" ? 11 : 12;
  const padding = size === "sm" ? "5px 8px" : "7px 10px";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
      {label && (
        <span style={{ fontSize: fontSize - 1, color: "#6b7f99", whiteSpace: "nowrap" }}>
          {label}
        </span>
      )}
      <select
        aria-label={label || "Chọn model từ catalog AIAGENT đã xác minh"}
        title={label || "Chọn model từ catalog AIAGENT đã xác minh"}
        value={selected}
        disabled={available.length === 0}
        onChange={(event) => onChange(event.target.value)}
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
          cursor: available.length ? "pointer" : "not-allowed",
          minWidth: 180,
        }}
      >
        {available.length === 0 ? (
          <option value="">Catalog AIAGENT chưa được xác minh</option>
        ) : (
          <optgroup label="AIAGENT verified catalog">
            {available.map((model) => (
              <option key={model.id} value={model.id}>
                {modelLabel(model.id)}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}

export const ModelPickerWithAuto = ModelPicker;
