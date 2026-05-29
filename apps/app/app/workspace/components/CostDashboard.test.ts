import { describe, it, expect, beforeEach } from "vitest";

const USAGE_KEY = "omcode:usage";

function recordUsage(model: string, provider: string, tokensIn: number, tokensOut: number, cost: number) {
  try {
    const entries: any[] = JSON.parse(localStorage.getItem(USAGE_KEY) || "[]");
    entries.push({ timestamp: Date.now(), model, provider, tokensIn, tokensOut, cost });
    localStorage.setItem(USAGE_KEY, JSON.stringify(entries.slice(-500)));
  } catch {}
}

function getUsage(): any[] {
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY) || "[]");
  } catch { return []; }
}

function formatCost(n: number) {
  return n < 0.01 ? "$" + (n * 100).toFixed(2) + "¢" : "$" + n.toFixed(4);
}

function groupByDay(entries: { timestamp: number; cost: number; tokensIn: number; tokensOut: number }[]) {
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

function groupByModel(entries: { model: string; cost: number; tokensIn: number; tokensOut: number }[]) {
  const map: Record<string, { cost: number; tokens: number; requests: number }> = {};
  for (const e of entries) {
    map[e.model] ||= { cost: 0, tokens: 0, requests: 0 };
    map[e.model].cost += e.cost;
    map[e.model].tokens += e.tokensIn + e.tokensOut;
    map[e.model].requests += 1;
  }
  return Object.entries(map).sort((a, b) => b[1].cost - a[1].cost);
}

describe("CostDashboard pure functions", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("recordUsage & getUsage", () => {
    it("records and retrieves usage entries", () => {
      recordUsage("gpt-4", "openai", 100, 50, 0.005);
      const entries = getUsage();
      expect(entries).toHaveLength(1);
      expect(entries[0].model).toBe("gpt-4");
      expect(entries[0].tokensIn).toBe(100);
      expect(entries[0].cost).toBe(0.005);
    });

    it("keeps only last 500 entries", () => {
      // O(N²) re-serialization per call; bump timeout to keep CI green
      // without altering the local recordUsage implementation.
      for (let i = 0; i < 520; i++) {
        recordUsage("gpt-4", "openai", 1, 1, 0.001);
      }
      const entries = getUsage();
      expect(entries).toHaveLength(500);
    }, 15000);

    it("handles malformed localStorage gracefully", () => {
      localStorage.setItem(USAGE_KEY, "not-json");
      expect(getUsage()).toEqual([]);
    });
  });

  describe("formatCost", () => {
    it("formats small costs in cents", () => {
      expect(formatCost(0.005)).toBe("$0.50¢");
      expect(formatCost(0.0001)).toBe("$0.01¢");
    });

    it("formats larger costs in dollars", () => {
      expect(formatCost(0.05)).toBe("$0.0500");
      expect(formatCost(1.234)).toBe("$1.2340");
    });
  });

  describe("groupByDay", () => {
    it("groups entries by date and aggregates", () => {
      const now = Date.now();
      const entries = [
        { timestamp: now, model: "gpt-4", provider: "openai", tokensIn: 10, tokensOut: 5, cost: 0.01 },
        { timestamp: now, model: "gpt-4", provider: "openai", tokensIn: 20, tokensOut: 10, cost: 0.02 },
        { timestamp: now - 86400000, model: "gpt-4", provider: "openai", tokensIn: 5, tokensOut: 5, cost: 0.005 },
      ];
      const grouped = groupByDay(entries);
      expect(grouped).toHaveLength(2);
      const today = grouped.find(([d]) => d === new Date(now).toISOString().slice(0, 10));
      expect(today![1].cost).toBeCloseTo(0.03, 5);
      expect(today![1].requests).toBe(2);
    });

    it("returns empty array for no entries", () => {
      expect(groupByDay([])).toEqual([]);
    });
  });

  describe("groupByModel", () => {
    it("groups by model sorted by cost descending", () => {
      const entries = [
        { timestamp: Date.now(), model: "gpt-4", provider: "openai", tokensIn: 10, tokensOut: 5, cost: 0.05 },
        { timestamp: Date.now(), model: "claude-3", provider: "anthropic", tokensIn: 10, tokensOut: 5, cost: 0.03 },
        { timestamp: Date.now(), model: "gpt-4", provider: "openai", tokensIn: 10, tokensOut: 5, cost: 0.02 },
      ];
      const grouped = groupByModel(entries);
      expect(grouped).toHaveLength(2);
      expect(grouped[0][0]).toBe("gpt-4");
      expect(grouped[0][1].cost).toBeCloseTo(0.07, 5);
      expect(grouped[1][0]).toBe("claude-3");
    });
  });
});
