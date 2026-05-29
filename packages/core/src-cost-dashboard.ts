// ─── Cost/Quota Dashboard — Theo dõi chi phí và quota AI ─────────────────
export interface CostRecord {
  id: string;
  timestamp: Date;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  currency: string;
  taskId?: string;
  agentId?: string;
}

export interface Quota {
  id: string;
  provider: string;
  model?: string;
  limit: number; // in USD
  used: number;
  period: "daily" | "weekly" | "monthly";
  resetAt: Date;
  alerts: Array<{
    threshold: number; // percentage
    sent: boolean;
  }>;
}

export interface CostSummary {
  totalCost: number;
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
  byAgent: Record<string, number>;
  totalTokens: number;
  averageCostPer1kTokens: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface CostDashboardConfig {
  dailyQuota: number;
  monthlyQuota: number;
  alertThresholds: number[]; // e.g., [50, 75, 90, 100]
  currency: string;
  enableCostTracking: boolean;
}

export class CostDashboard {
  private config: CostDashboardConfig;
  private costRecords: CostRecord[] = [];
  private quotas: Map<string, Quota> = new Map();

  constructor(config: Partial<CostDashboardConfig> = {}) {
    this.config = {
      dailyQuota: 10, // $10 per day
      monthlyQuota: 300, // $300 per month
      alertThresholds: [50, 75, 90, 100],
      currency: "USD",
      enableCostTracking: true,
      ...config,
    };

    this.initializeDefaultQuotas();
  }

  private initializeDefaultQuotas(): void {
    // Daily quota
    this.quotas.set("daily", {
      id: "quota-daily",
      provider: "all",
      limit: this.config.dailyQuota,
      used: 0,
      period: "daily",
      resetAt: this.getNextResetDate("daily"),
      alerts: this.config.alertThresholds.map((t) => ({ threshold: t, sent: false })),
    });

    // Monthly quota
    this.quotas.set("monthly", {
      id: "quota-monthly",
      provider: "all",
      limit: this.config.monthlyQuota,
      used: 0,
      period: "monthly",
      resetAt: this.getNextResetDate("monthly"),
      alerts: this.config.alertThresholds.map((t) => ({ threshold: t, sent: false })),
    });
  }

  private getNextResetDate(period: "daily" | "weekly" | "monthly"): Date {
    const now = new Date();
    if (period === "daily") {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    } else if (period === "weekly") {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(0, 0, 0, 0);
      return nextWeek;
    } else {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);
      return nextMonth;
    }
  }

  // Record cost
  recordCost(record: Omit<CostRecord, "id" | "timestamp">): CostRecord {
    if (!this.config.enableCostTracking) {
      throw new Error("Cost tracking is disabled");
    }

    const costRecord: CostRecord = {
      ...record,
      id: `cost-${Date.now()}`,
      timestamp: new Date(),
    };

    this.costRecords.push(costRecord);

    // Update quotas
    this.updateQuotas(record.cost);

    // Check quota alerts
    this.checkQuotaAlerts();

    return costRecord;
  }

  // Update quotas
  private updateQuotas(cost: number): void {
    for (const [id, quota] of this.quotas) {
      // Check if quota needs reset
      if (new Date() >= quota.resetAt) {
        quota.used = 0;
        quota.resetAt = this.getNextResetDate(quota.period);
        quota.alerts = quota.alerts.map((a) => ({ ...a, sent: false }));
      }

      quota.used += cost;
    }
  }

  // Check quota alerts
  private checkQuotaAlerts(): void {
    for (const quota of this.quotas.values()) {
      const percentage = (quota.used / quota.limit) * 100;

      for (const alert of quota.alerts) {
        if (!alert.sent && percentage >= alert.threshold) {
          alert.sent = true;
          // In real implementation, send notification here
          console.warn(`Quota alert: ${percentage.toFixed(0)}% of ${quota.period} quota used`);
        }
      }
    }
  }

  // Get cost summary for a period
  getCostSummary(startDate: Date, endDate: Date): CostSummary {
    const records = this.costRecords.filter(
      (r) => r.timestamp >= startDate && r.timestamp <= endDate,
    );

    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);

    const byProvider: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    const byAgent: Record<string, number> = {};

    for (const record of records) {
      byProvider[record.provider] = (byProvider[record.provider] || 0) + record.cost;
      byModel[record.model] = (byModel[record.model] || 0) + record.cost;
      if (record.agentId) {
        byAgent[record.agentId] = (byAgent[record.agentId] || 0) + record.cost;
      }
    }

    const averageCostPer1kTokens = totalTokens > 0 ? (totalCost / totalTokens) * 1000 : 0;

    return {
      totalCost,
      byProvider,
      byModel,
      byAgent,
      totalTokens,
      averageCostPer1kTokens,
      period: { start: startDate, end: endDate },
    };
  }

  // Get today's summary
  getTodaySummary(): CostSummary {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return this.getCostSummary(startOfDay, endOfDay);
  }

  // Get this month's summary
  getMonthSummary(): CostSummary {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return this.getCostSummary(startOfMonth, endOfMonth);
  }

  // Get quota status
  getQuotaStatus(): Array<{
    id: string;
    period: string;
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
    resetAt: Date;
  }> {
    const status: Array<{
      id: string;
      period: string;
      limit: number;
      used: number;
      remaining: number;
      percentage: number;
      resetAt: Date;
    }> = [];

    for (const quota of this.quotas.values()) {
      status.push({
        id: quota.id,
        period: quota.period,
        limit: quota.limit,
        used: quota.used,
        remaining: quota.limit - quota.used,
        percentage: (quota.used / quota.limit) * 100,
        resetAt: quota.resetAt,
      });
    }

    return status;
  }

  // Get cost records
  getCostRecords(limit = 100): CostRecord[] {
    return this.costRecords
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get cost records by provider
  getCostRecordsByProvider(provider: string, limit = 100): CostRecord[] {
    return this.costRecords
      .filter((r) => r.provider === provider)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get cost records by agent
  getCostRecordsByAgent(agentId: string, limit = 100): CostRecord[] {
    return this.costRecords
      .filter((r) => r.agentId === agentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Check if within quota
  isWithinQuota(cost: number): boolean {
    for (const quota of this.quotas.values()) {
      if (quota.used + cost > quota.limit) {
        return false;
      }
    }
    return true;
  }

  // Get cost optimization suggestions
  getOptimizationSuggestions(): Array<{
    type: "model" | "provider" | "usage";
    description: string;
    potentialSavings: number;
  }> {
    const suggestions: Array<{
      type: "model" | "provider" | "usage";
      description: string;
      potentialSavings: number;
    }> = [];

    const summary = this.getMonthSummary();

    // Check for expensive models
    for (const [model, cost] of Object.entries(summary.byModel)) {
      if (cost > summary.totalCost * 0.3) {
        suggestions.push({
          type: "model",
          description: `Consider using a cheaper alternative to ${model}`,
          potentialSavings: cost * 0.5,
        });
      }
    }

    // Check for expensive providers
    for (const [provider, cost] of Object.entries(summary.byProvider)) {
      if (cost > summary.totalCost * 0.5) {
        suggestions.push({
          type: "provider",
          description: `Consider using alternative providers to ${provider}`,
          potentialSavings: cost * 0.3,
        });
      }
    }

    // Check for high average cost
    if (summary.averageCostPer1kTokens > 0.01) {
      suggestions.push({
        type: "usage",
        description: "Average cost per 1k tokens is high, consider optimizing prompts",
        potentialSavings: summary.totalCost * 0.2,
      });
    }

    return suggestions;
  }

  // Update config
  updateConfig(updates: Partial<CostDashboardConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Get config
  getConfig(): CostDashboardConfig {
    return { ...this.config };
  }

  // Clear old records
  clearOldRecords(daysToKeep = 30): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    this.costRecords = this.costRecords.filter((r) => r.timestamp >= cutoff);
  }
}

// Singleton instance
export const costDashboard = new CostDashboard();
