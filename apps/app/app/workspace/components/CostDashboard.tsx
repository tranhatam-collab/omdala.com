// ─── CostDashboard — Real-time API cost & token tracking ──────────────────
"use client";

import * as React from "react";

interface UsageEntry {
  timestamp: number;
  model: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

const USAGE_KEY = "omcode:usage";

export function recordUsage(model: string, provider: string, tokensIn: number, tokensOut: number, cost: number) {
  try {
    const entries: UsageEntry[] = JSON.parse(localStorage.getItem(USAGE_KEY) || "[]");
    entries.push({ timestamp: Date.now(), model, provider, tokensIn, tokensOut, cost });
    localStorage.setItem(USAGE_KEY, JSON.stringify(entries.slice(-500)));
  } catch {}
}

export function getUsage(): UsageEntry[] {
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY) || "[]");
  } catch { return []; }
}

function formatCost(n: number) {
  return n < 0.01 ? "$" + (n * 100).toFixed(2) + "¢" : "$" + n.toFixed(4);
}

function groupByDay(entries: UsageEntry[]) {
  const map: Record<string, { cost: number; tokens: number; requests: number }> = {};
  for (const e of entries) {
    const d = new Date(e.timestamp).toISOString().slice(0, 10);
    map[d] ||= { cost: 0, tokens: 0, requests: 0 };
    map[d].cost += e.cost;
    map[d].tokens += e.tokensIn + e.tokensOut;
    map[d].requests += 1;
  }
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
}

function groupByModel(entries: UsageEntry[]) {
  const map: Record<string, { cost: number; tokens: number; requests: number }> = {};
  for (const e of entries) {
    map[e.model] ||= { cost: 0, tokens: 0, requests: 0 };
    map[e.model].cost += e.cost;
    map[e.model].tokens += e.tokensIn + e.tokensOut;
    map[e.model].requests += 1;
  }
  return Object.entries(map).sort((a, b) => b[1].cost - a[1].cost);
}

export function CostDashboard() {
  const [entries, setEntries] = React.useState<UsageEntry[]>([]);
  const [range, setRange] = React.useState<"all" | "today" | "week">("all");

  React.useEffect(() => {
    setEntries(getUsage());
    const iv = setInterval(() => setEntries(getUsage()), 3000);
    return () => clearInterval(iv);
  }, []);

  const filtered = React.useMemo(() => {
    const now = Date.now();
    if (range === "today") return entries.filter((e) => now - e.timestamp < 86400000);
    if (range === "week") return entries.filter((e) => now - e.timestamp < 7 * 86400000);
    return entries;
  }, [entries, range]);

  const totalCost = filtered.reduce((s, e) => s + e.cost, 0);
  const totalTokens = filtered.reduce((s, e) => s + e.tokensIn + e.tokensOut, 0);
  const totalRequests = filtered.length;
  const daily = groupByDay(filtered);
  const byModel = groupByModel(filtered);
  const maxCost = Math.max(...daily.map((d) => d[1].cost), 0.0001);

  return (
    <div style={{ padding: 16, color: "#dbe7f5", fontSize: 12, overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#7ef2ff" }}>📊 Cost Dashboard</span>
        <span style={{ flex: 1 }} />
        {(["all", "today", "week"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              padding: "3px 8px",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.1)",
              background: range === r ? "rgba(126,242,255,0.15)" : "transparent",
              color: range === r ? "#7ef2ff" : "#6b7f99",
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            {r === "all" ? "All time" : r === "today" ? "24h" : "7 days"}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total Cost", value: formatCost(totalCost), color: "#7ef2ff" },
          { label: "Total Tokens", value: totalTokens.toLocaleString(), color: "#4ade80" },
          { label: "Requests", value: totalRequests.toString(), color: "#f59e0b" },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: 12,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 10, color: "#6b7f99", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      {daily.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f7fbff", marginBottom: 8 }}>Daily Cost</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, padding: "4px 0" }}>
            {daily.map(([date, data]) => (
              <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div
                  style={{
                    width: "100%",
                    height: `${Math.min((data.cost / maxCost) * 100, 100)}%`,
                    background: "rgba(126,242,255,0.4)",
                    borderRadius: "3px 3px 0 0",
                    minHeight: 2,
                  }}
                  title={`${date}: ${formatCost(data.cost)}`}
                />
                <span style={{ fontSize: 8, color: "#6b7f99", transform: "rotate(-45deg)", transformOrigin: "top left" }}>
                  {date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model breakdown */}
      {byModel.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f7fbff", marginBottom: 8 }}>By Model</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {byModel.map(([model, data]) => (
              <div
                key={model}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 10, color: "#a8b9d0", width: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {model}
                </span>
                <div style={{ flex: 1, height: 6, background: "rgba(0,0,0,0.3)", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min((data.cost / (byModel[0][1].cost || 1)) * 100, 100)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #7ef2ff, #5cd9ff)",
                      borderRadius: 3,
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: "#7ef2ff", width: 50, textAlign: "right" }}>
                  {formatCost(data.cost)}
                </span>
                <span style={{ fontSize: 9, color: "#6b7f99", width: 40, textAlign: "right" }}>
                  {data.requests} req
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7f99", fontSize: 12 }}>
          No API usage yet. Start chatting with AI to see stats.
        </div>
      )}
    </div>
  );
}
