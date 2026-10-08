"use client";

import * as React from "react";
import { useI18n } from "../hooks/useI18n";
import {
  AIAGENT_CONTRACT_VERSION,
  clearLegacyAiBrowserState,
  getVerifiedAiagentCatalog,
  type AiagentCatalog,
} from "../api/gateway";

export function AccountPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [catalog, setCatalog] = React.useState<AiagentCatalog | null>(null);
  const [status, setStatus] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const verify = React.useCallback(async () => {
    setIsLoading(true);
    setStatus("Đang xác minh OMDALA session và AIAGENT catalog…");
    try {
      clearLegacyAiBrowserState();
      const verified = await getVerifiedAiagentCatalog();
      setCatalog(verified);
      setStatus("Catalog đã được OMDALA API xác minh; không phát sinh model call.");
    } catch (error) {
      setCatalog(null);
      setStatus(error instanceof Error ? error.message : "AIAGENT_CATALOG_UNAVAILABLE");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => void verify());
  }, [isOpen, verify]);

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
          width: "min(520px, 92vw)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
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
              🔑 {t("accountTitle")}
            </div>
            <div style={{ fontSize: 11, color: "#6b7f99", marginTop: 2 }}>
              OMDALA session → AIAGENT contract {AIAGENT_CONTRACT_VERSION}
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

        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(126,242,255,0.04)",
              border: "1px solid rgba(126,242,255,0.15)",
              fontSize: 11,
              color: "#a8b9d0",
              lineHeight: 1.6,
            }}
          >
            Browser chỉ gọi API OMDALA đã khóa theo môi trường. Provider credential nằm trong Cloudflare Worker secret; không được gửi tới hoặc lưu trong browser.
          </div>

          {catalog && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                color: "#4ade80",
                background: "rgba(74,222,128,0.06)",
                border: "1px solid rgba(74,222,128,0.2)",
                fontSize: 12,
              }}
            >
              ✓ {catalog.total} model khả dụng · tenant {catalog.authority.tenant} · workspace {catalog.authority.workspace}
            </div>
          )}

          <button
            onClick={() => void verify()}
            disabled={isLoading}
            style={{
              padding: "10px",
              borderRadius: 6,
              border: "none",
              background: "linear-gradient(135deg,#7ef2ff,#5cd9ff)",
              color: "#04101f",
              fontSize: 12,
              fontWeight: 700,
              cursor: isLoading ? "wait" : "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Đang xác minh…" : "Kiểm tra lại kết nối"}
          </button>

          {status && (
            <div style={{ fontSize: 11, color: "#7ef2ff", textAlign: "center", lineHeight: 1.5 }}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
