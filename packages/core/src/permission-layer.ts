// ─── Permission + Approval Layer — Quản lý quyền và phê duyệt ───────────
export type PermissionAction =
  | "read_file"
  | "write_file"
  | "delete_file"
  | "create_file"
  | "run_command"
  | "deploy"
  | "install_dependency"
  | "modify_git"
  | "access_api"
  | "access_sensitive_data";

export type PermissionLevel = "allow" | "deny" | "ask" | "allow_once";

export interface PermissionRule {
  id: string;
  action: PermissionAction;
  pattern: string; // glob pattern for file paths
  level: PermissionLevel;
  reason?: string;
  expiresAt?: Date;
}

export interface ApprovalRequest {
  id: string;
  action: PermissionAction;
  target: string; // file path, command, etc.
  description: string;
  risk: "low" | "medium" | "high" | "critical";
  requestedBy: "agent" | "user";
  agentId?: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  requestedAt: Date;
  decidedAt?: Date;
  decidedBy?: "user" | "auto" | "agent";
  metadata?: Record<string, unknown>;
}

export interface PermissionConfig {
  autoApproveLowRisk: boolean;
  autoApproveMediumRisk: boolean;
  requireApprovalForDeploy: boolean;
  requireApprovalForDelete: boolean;
  requireApprovalForGit: boolean;
  requireApprovalForAPI: boolean;
  allowedPaths: string[];
  deniedPaths: string[];
}

export class PermissionLayer {
  private rules: Map<string, PermissionRule> = new Map();
  private approvalHistory: ApprovalRequest[] = [];
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private config: PermissionConfig;

  constructor(config: Partial<PermissionConfig> = {}) {
    this.config = {
      autoApproveLowRisk: true,
      autoApproveMediumRisk: false,
      requireApprovalForDeploy: true,
      requireApprovalForDelete: true,
      requireApprovalForGit: true,
      requireApprovalForAPI: true,
      allowedPaths: [],
      deniedPaths: [],
      ...config,
    };
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Always allow reading files
    this.addRule({
      id: "default-read",
      action: "read_file",
      pattern: "**/*",
      level: "allow",
      reason: "Default: allow reading files",
    });

    // Ask before writing files
    this.addRule({
      id: "default-write",
      action: "write_file",
      pattern: "**/*",
      level: "ask",
      reason: "Default: ask before writing files",
    });

    // Deny deleting node_modules
    this.addRule({
      id: "deny-node-modules",
      action: "delete_file",
      pattern: "**/node_modules/**",
      level: "deny",
      reason: "Never delete node_modules",
    });

    // Deny deleting .git
    this.addRule({
      id: "deny-git",
      action: "delete_file",
      pattern: "**/.git/**",
      level: "deny",
      reason: "Never delete .git directory",
    });

    // Ask before running commands
    this.addRule({
      id: "default-command",
      action: "run_command",
      pattern: "**",
      level: "ask",
      reason: "Default: ask before running commands",
    });

    // Allow safe commands automatically
    this.addRule({
      id: "allow-safe-commands",
      action: "run_command",
      pattern: "git status|git diff|git log|ls|pwd|cat",
      level: "allow",
      reason: "Safe read-only commands",
    });

    // Always require approval for deploy
    this.addRule({
      id: "require-deploy",
      action: "deploy",
      pattern: "**",
      level: "ask",
      reason: "Deploy requires approval",
    });

    // Deny accessing sensitive files
    this.addRule({
      id: "deny-secrets",
      action: "access_sensitive_data",
      pattern: "**/.env*|**/secrets/**|**/*secret*",
      level: "ask",
      reason: "Sensitive data requires approval",
    });
  }

  addRule(rule: PermissionRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<PermissionRule>): void {
    const existing = this.rules.get(ruleId);
    if (existing) {
      this.rules.set(ruleId, { ...existing, ...updates });
    }
  }

  async checkPermission(
    action: PermissionAction,
    target: string,
    agentId?: string,
  ): Promise<{ allowed: boolean; level: PermissionLevel; reason?: string }> {
    // Check denied paths first
    for (const deniedPath of this.config.deniedPaths) {
      if (this.matchPattern(target, deniedPath)) {
        return { allowed: false, level: "deny", reason: "Path is in denied list" };
      }
    }

    // Check allowed paths
    if (this.config.allowedPaths.length > 0) {
      const allowed = this.config.allowedPaths.some((p) => this.matchPattern(target, p));
      if (!allowed) {
        return { allowed: false, level: "deny", reason: "Path not in allowed list" };
      }
    }

    // Check specific rules
    for (const rule of this.rules.values()) {
      if (rule.action === action && this.matchPattern(target, rule.pattern)) {
        // Check if rule expired
        if (rule.expiresAt && rule.expiresAt < new Date()) {
          continue;
        }

        return {
          allowed: rule.level === "allow" || rule.level === "allow_once",
          level: rule.level,
          reason: rule.reason,
        };
      }
    }

    // Default: ask for unknown actions
    return { allowed: false, level: "ask", reason: "No matching rule, asking user" };
  }

  async requestApproval(
    action: PermissionAction,
    target: string,
    description: string,
    agentId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<ApprovalRequest> {
    const risk = this.assessRisk(action, target);
    const request: ApprovalRequest = {
      id: `approval-${Date.now()}`,
      action,
      target,
      description,
      risk,
      requestedBy: agentId ? "agent" : "user",
      agentId,
      status: "pending",
      requestedAt: new Date(),
      metadata,
    };

    // Auto-approve low risk if configured
    if (risk === "low" && this.config.autoApproveLowRisk) {
      request.status = "approved";
      request.decidedAt = new Date();
      request.decidedBy = "auto";
    }
    // Auto-approve medium risk if configured
    else if (risk === "medium" && this.config.autoApproveMediumRisk) {
      request.status = "approved";
      request.decidedAt = new Date();
      request.decidedBy = "auto";
    }
    // Always require approval for certain actions
    else if (
      (action === "deploy" && this.config.requireApprovalForDeploy) ||
      (action === "delete_file" && this.config.requireApprovalForDelete) ||
      (action === "modify_git" && this.config.requireApprovalForGit) ||
      (action === "access_api" && this.config.requireApprovalForAPI)
    ) {
      request.status = "pending";
      this.pendingApprovals.set(request.id, request);
    }
    // Otherwise pending
    else {
      this.pendingApprovals.set(request.id, request);
    }

    this.approvalHistory.push(request);
    return request;
  }

  approveRequest(requestId: string): void {
    const request = this.pendingApprovals.get(requestId);
    if (request && request.status === "pending") {
      request.status = "approved";
      request.decidedAt = new Date();
      request.decidedBy = "user";
      this.pendingApprovals.delete(requestId);
    }
  }

  denyRequest(requestId: string, reason?: string): void {
    const request = this.pendingApprovals.get(requestId);
    if (request && request.status === "pending") {
      request.status = "denied";
      request.decidedAt = new Date();
      request.decidedBy = "user";
      request.metadata = { ...request.metadata, denialReason: reason };
      this.pendingApprovals.delete(requestId);
    }
  }

  cancelRequest(requestId: string): void {
    const request = this.pendingApprovals.get(requestId);
    if (request && request.status === "pending") {
      request.status = "cancelled";
      request.decidedAt = new Date();
      request.decidedBy = "agent";
      this.pendingApprovals.delete(requestId);
    }
  }

  getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values());
  }

  getApprovalHistory(limit: number = 50): ApprovalRequest[] {
    return this.approvalHistory
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
      .slice(0, limit);
  }

  private assessRisk(action: PermissionAction, target: string): ApprovalRequest["risk"] {
    // Critical actions
    if (action === "deploy") return "critical";
    if (action === "delete_file") return "high";
    if (action === "modify_git") return "high";
    if (action === "access_api") return "high";

    // High risk targets
    if (target.includes(".env") || target.includes("secret") || target.includes("password")) {
      return "critical";
    }
    if (target.includes("node_modules") || target.includes(".git")) {
      return "high";
    }

    // Medium risk actions
    if (action === "run_command") return "medium";
    if (action === "install_dependency") return "medium";

    // Low risk
    if (action === "read_file") return "low";
    if (action === "write_file") return "medium";

    return "low";
  }

  private matchPattern(target: string, pattern: string): boolean {
    // Convert glob pattern to regex with proper ** support
    let regexPattern = pattern
      // Escape special regex characters except * and ?
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      // Convert ** to match any path segments
      .replace(/\*\*/g, ".*")
      // Convert * to match any characters except path separator
      .replace(/(?<!\.)\*/g, "[^/]*")
      // Convert ? to single character
      .replace(/\?/g, ".");
    
    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(target);
  }

  updateConfig(updates: Partial<PermissionConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): PermissionConfig {
    return { ...this.config };
  }

  getRules(): PermissionRule[] {
    return Array.from(this.rules.values());
  }
}

// Singleton instance
export const permissionLayer = new PermissionLayer();
