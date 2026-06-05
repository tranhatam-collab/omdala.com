// ─── AccountPanel — Register / Login / Subscription link ──────────────────
"use client";

import * as React from "react";
import { useI18n } from "../hooks/useI18n";
import { loginToGateway, registerOnGateway, verifyGatewayToken } from "../api/gateway";

const ACCOUNT_KEY = "omcode:account";

interface Account {
  email?: string;
  token?: string;
  plan?: "free" | "pro" | "enterprise";
  apiGatewayUrl?: string;
  expiresAt?: number;
}

export function loadAccount(): Account | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveAccount(a: Account) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
}

export function AccountPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [account, setAccount] = React.useState<Account | null>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [apiUrl, setApiUrl] = React.useState("https://aiagent.iai.one/api/v1");
  const [mode, setMode] = React.useState<"login" | "register" | "connected">("login");
  const [status, setStatus] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const a = loadAccount();
    if (a?.token && a?.apiGatewayUrl) {
      setStatus("Verifying session…");
      verifyGatewayToken(a.apiGatewayUrl, a.token).then((res) => {
        if (res.success && res.account) {
          setAccount(res.account);
          setMode("connected");
          setApiUrl(res.account.apiGatewayUrl || apiUrl);
          setStatus("");
        } else {
          localStorage.removeItem(ACCOUNT_KEY);
          setAccount(null);
          setMode("login");
          setStatus("Session expired. Please log in again.");
        }
      });
    }
  }, []);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsLoading(true);
    setStatus(t("connectGateway") + "…");
    const payload = { email, password, apiGatewayUrl: apiUrl };
    const res = mode === "register"
      ? await registerOnGateway(apiUrl, payload)
      : await loginToGateway(apiUrl, payload);
    setIsLoading(false);
    if (res.success && res.account) {
      const a: Account = {
        email: res.account.email,
        token: res.account.token,
        plan: res.account.plan,
        apiGatewayUrl: res.account.apiGatewayUrl,
        expiresAt: res.account.expiresAt,
      };
      saveAccount(a);
      setAccount(a);
      setMode("connected");
      setStatus(t("connected"));
      setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus(res.error || "Connection failed");
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem(ACCOUNT_KEY);
    setAccount(null);
    setMode("login");
  };

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
          width: "min(480px, 90vw)",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#7ef2ff" }}>🔑 {t("accountTitle")}</div>
            <div style={{ fontSize: 11, color: "#6b7f99", marginTop: 2 }}>
              {t("accountSubtitle")}
            </div>
          </div>
          <span style={{ flex: 1 }} />
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#a8b9d0", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>
            {t("close")}
          </button>
        </div>

        <div style={{ overflow: "auto", padding: 18 }}>
          {mode === "connected" && account ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: 12, background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>✓ {t("connected")}</div>
                <div style={{ fontSize: 11, color: "#a8b9d0", marginTop: 4 }}>{t("email")}: {account.email}</div>
                <div style={{ fontSize: 11, color: "#a8b9d0" }}>{t("planLabel")}: <span style={{ color: "#7ef2ff", fontWeight: 700 }}>{account.plan?.toUpperCase()}</span></div>
                <div style={{ fontSize: 11, color: "#a8b9d0" }}>Gateway: {account.apiGatewayUrl}</div>
                <div style={{ fontSize: 10, color: "#6b7f99", marginTop: 4 }}>
                  {t("expires")}: {account.expiresAt ? new Date(account.expiresAt).toLocaleDateString() : "N/A"}
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t("disconnect")}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setMode("login")}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: mode === "login" ? "rgba(126,242,255,0.1)" : "transparent",
                    color: mode === "login" ? "#7ef2ff" : "#6b7f99",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {t("login")}
                </button>
                <button
                  onClick={() => setMode("register")}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: mode === "register" ? "rgba(126,242,255,0.1)" : "transparent",
                    color: mode === "register" ? "#7ef2ff" : "#6b7f99",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {t("register")}
                </button>
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
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
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder={t("gatewayUrl")}
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
              <button
                onClick={handleConnect}
                disabled={isLoading}
                style={{
                  padding: "10px",
                  borderRadius: 6,
                  border: "none",
                  background: "linear-gradient(135deg,#7ef2ff,#5cd9ff)",
                  color: "#04101f",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {mode === "register" ? t("createAccount") : t("connectGateway")}
              </button>
              {status && <div style={{ fontSize: 11, color: "#7ef2ff", textAlign: "center" }}>{status}</div>}
            </div>
          )}

          <div style={{ marginTop: 16, padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f7fbff", marginBottom: 6 }}>📦 Plans</div>
            {[
              { name: "Free", price: "$0", features: ["7 AI providers", "Local-first", "Basic chat"] },
              { name: "Pro", price: "$9/mo", features: ["Unlimited tokens", "Priority routing", "Custom models", "Team sharing"] },
              { name: "Enterprise", price: "Custom", features: ["Dedicated gateway", "SSO", "SLA", "On-premise option"] },
            ].map((plan) => (
              <div
                key={plan.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#7ef2ff", width: 90 }}>{plan.name}</span>
                <span style={{ fontSize: 10, color: "#4ade80", width: 50 }}>{plan.price}</span>
                <span style={{ fontSize: 10, color: "#a8b9d0" }}>{plan.features.join(" · ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
