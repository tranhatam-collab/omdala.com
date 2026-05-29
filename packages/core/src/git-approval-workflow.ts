// ─── Git/Diff/Approval Workflow — Quản lý approval cho Git operations ─────────
export interface GitChange {
  filePath: string;
  status: "added" | "modified" | "deleted" | "renamed";
  oldContent?: string;
  newContent?: string;
  diff?: string;
}

export interface GitCommit {
  id: string;
  message: string;
  author: string;
  timestamp: Date;
  changes: GitChange[];
}

export interface BranchProtectionRule {
  id: string;
  branchPattern: string;
  requireApproval: boolean;
  requiredReviewers: number;
  requireTests: boolean;
  requireLint: boolean;
  blockDirectPush: boolean;
}

export interface MergeRequest {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  title: string;
  description: string;
  author: string;
  status: "open" | "merged" | "closed" | "draft";
  changes: GitChange[];
  approvals: string[];
  requiredApprovals: number;
  checks: {
    tests: "pending" | "running" | "passed" | "failed";
    lint: "pending" | "running" | "passed" | "failed";
    review: "pending" | "approved" | "rejected";
  };
  createdAt: Date;
  mergedAt?: Date;
}

export interface GitApprovalConfig {
  autoReviewBeforeCommit: boolean;
  requireApprovalForMerge: boolean;
  defaultBranch: string;
  protectedBranches: string[];
  protectionRules: BranchProtectionRule[];
}

export class GitApprovalWorkflow {
  private config: GitApprovalConfig;
  private mergeRequests: Map<string, MergeRequest> = new Map();
  private pendingCommits: Map<string, GitCommit> = new Map();

  constructor(config: Partial<GitApprovalConfig> = {}) {
    this.config = {
      autoReviewBeforeCommit: true,
      requireApprovalForMerge: true,
      defaultBranch: "main",
      protectedBranches: ["main", "master", "production"],
      protectionRules: [
        {
          id: "main-protection",
          branchPattern: "main|master|production",
          requireApproval: true,
          requiredReviewers: 1,
          requireTests: true,
          requireLint: true,
          blockDirectPush: true,
        },
      ],
      ...config,
    };
  }

  // Review changes before commit
  async reviewChanges(changes: GitChange[]): Promise<{
    approved: boolean;
    issues: Array<{ severity: "error" | "warning" | "info"; message: string; file?: string }>;
    suggestions: string[];
  }> {
    const issues: Array<{ severity: "error" | "warning" | "info"; message: string; file?: string }> = [];
    const suggestions: string[] = [];

    for (const change of changes) {
      // Check for sensitive data
      if (change.newContent) {
        if (this.containsSecrets(change.newContent)) {
          issues.push({
            severity: "error",
            message: "File contains potential secrets (API keys, passwords, tokens)",
            file: change.filePath,
          });
        }

        // Check for console.log in production code
        if (this.hasConsoleLog(change.newContent) && !this.isTestFile(change.filePath)) {
          issues.push({
            severity: "warning",
            message: "File contains console.log statements",
            file: change.filePath,
          });
        }

        // Check for TODO/FIXME comments
        if (this.hasTodos(change.newContent)) {
          issues.push({
            severity: "info",
            message: "File contains TODO/FIXME comments",
            file: change.filePath,
          });
        }

        // Check for large files
        if (change.newContent.length > 100000) {
          issues.push({
            severity: "warning",
            message: "File is very large (>100KB), consider splitting",
            file: change.filePath,
          });
        }
      }

      // Check for deleted important files
      if (change.status === "deleted") {
        if (this.isImportantFile(change.filePath)) {
          issues.push({
            severity: "error",
            message: "Deleting important file may break the application",
            file: change.filePath,
          });
        }
      }
    }

    // Generate suggestions
    if (issues.length === 0) {
      suggestions.push("Changes look good, ready to commit");
    } else {
      suggestions.push("Review and fix the issues before committing");
    }

    const approved = !issues.some((i) => i.severity === "error");

    return { approved, issues, suggestions };
  }

  // Check if branch is protected
  isBranchProtected(branch: string): boolean {
    // Check exact match
    if (this.config.protectedBranches.includes(branch)) {
      return true;
    }

    // Check pattern match
    for (const rule of this.config.protectionRules) {
      if (this.matchPattern(branch, rule.branchPattern)) {
        return true;
      }
    }

    return false;
  }

  // Get protection rule for branch
  getProtectionRule(branch: string): BranchProtectionRule | null {
    for (const rule of this.config.protectionRules) {
      if (this.matchPattern(branch, rule.branchPattern)) {
        return rule;
      }
    }
    return null;
  }

  // Create merge request
  createMergeRequest(
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string,
    author: string,
    changes: GitChange[],
  ): MergeRequest {
    const rule = this.getProtectionRule(targetBranch);
    const requiredApprovals = rule?.requiredReviewers || 1;

    const mr: MergeRequest = {
      id: `mr-${Date.now()}`,
      sourceBranch,
      targetBranch,
      title,
      description,
      author,
      status: "open",
      changes,
      approvals: [],
      requiredApprovals,
      checks: {
        tests: "pending",
        lint: "pending",
        review: "pending",
      },
      createdAt: new Date(),
    };

    this.mergeRequests.set(mr.id, mr);
    return mr;
  }

  // Approve merge request
  approveMergeRequest(mrId: string, reviewer: string): void {
    const mr = this.mergeRequests.get(mrId);
    if (mr && mr.status === "open") {
      if (!mr.approvals.includes(reviewer)) {
        mr.approvals.push(reviewer);
      }
      mr.checks.review = mr.approvals.length >= mr.requiredApprovals ? "approved" : "pending";
    }
  }

  // Reject merge request
  rejectMergeRequest(mrId: string, reviewer: string, reason?: string): void {
    const mr = this.mergeRequests.get(mrId);
    if (mr && mr.status === "open") {
      mr.status = "closed";
      mr.checks.review = "rejected";
    }
  }

  // Update check status
  updateCheckStatus(mrId: string, check: "tests" | "lint", status: "passed" | "failed"): void {
    const mr = this.mergeRequests.get(mrId);
    if (mr) {
      mr.checks[check] = status;
    }
  }

  // Check if merge request can be merged
  canMerge(mrId: string): { canMerge: boolean; reason?: string } {
    const mr = this.mergeRequests.get(mrId);
    if (!mr) {
      return { canMerge: false, reason: "Merge request not found" };
    }

    if (mr.status !== "open") {
      return { canMerge: false, reason: `Merge request is ${mr.status}` };
    }

    if (mr.approvals.length < mr.requiredApprovals) {
      return { canMerge: false, reason: `Need ${mr.requiredApprovals} approvals, got ${mr.approvals.length}` };
    }

    if (mr.checks.tests !== "passed") {
      return { canMerge: false, reason: "Tests must pass" };
    }

    if (mr.checks.lint !== "passed") {
      return { canMerge: false, reason: "Lint must pass" };
    }

    if (mr.checks.review !== "approved") {
      return { canMerge: false, reason: "Review must be approved" };
    }

    return { canMerge: true };
  }

  // Merge merge request
  merge(mrId: string): { success: boolean; reason?: string } {
    const canMergeResult = this.canMerge(mrId);
    if (!canMergeResult.canMerge) {
      return { success: false, reason: canMergeResult.reason };
    }

    const mr = this.mergeRequests.get(mrId);
    if (mr) {
      mr.status = "merged";
      mr.mergedAt = new Date();
      return { success: true };
    }

    return { success: false, reason: "Merge request not found" };
  }

  // Get all merge requests
  getMergeRequests(): MergeRequest[] {
    return Array.from(this.mergeRequests.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  // Get merge request by ID
  getMergeRequest(mrId: string): MergeRequest | null {
    return this.mergeRequests.get(mrId) || null;
  }

  // Get merge requests for branch
  getMergeRequestsForBranch(branch: string): MergeRequest[] {
    return this.getMergeRequests().filter(
      (mr) => mr.sourceBranch === branch || mr.targetBranch === branch,
    );
  }

  // Stage commit for approval
  stageCommit(commit: GitCommit): void {
    this.pendingCommits.set(commit.id, commit);
  }

  // Get pending commits
  getPendingCommits(): GitCommit[] {
    return Array.from(this.pendingCommits.values());
  }

  // Approve commit
  approveCommit(commitId: string): void {
    const commit = this.pendingCommits.get(commitId);
    if (commit) {
      this.pendingCommits.delete(commitId);
      // Commit would be executed here in real implementation
    }
  }

  // Reject commit
  rejectCommit(commitId: string, reason?: string): void {
    this.pendingCommits.delete(commitId);
  }

  // Update config
  updateConfig(updates: Partial<GitApprovalConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Get config
  getConfig(): GitApprovalConfig {
    return { ...this.config };
  }

  // Helper: Check for secrets
  private containsSecrets(content: string): boolean {
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"][\w-]+['"]/i,
      /password\s*[:=]\s*['"][\w-]+['"]/i,
      /secret\s*[:=]\s*['"][\w-]+['"]/i,
      /token\s*[:=]\s*['"][\w-]+['"]/i,
      /aws[_-]?access[_-]?key/i,
      /private[_-]?key/i,
    ];
    return secretPatterns.some((pattern) => pattern.test(content));
  }

  // Helper: Check for console.log
  private hasConsoleLog(content: string): boolean {
    return /console\.(log|debug|info|warn|error)/.test(content);
  }

  // Helper: Check for TODO/FIXME
  private hasTodos(content: string): boolean {
    return /(TODO|FIXME|HACK|XXX)/.test(content);
  }

  // Helper: Check if file is test file
  private isTestFile(filePath: string): boolean {
    return /test|spec/.test(filePath) || filePath.includes("/test/") || filePath.includes("/__tests__/");
  }

  // Helper: Check if file is important
  private isImportantFile(filePath: string): boolean {
    const importantPatterns = [
      /package\.json$/,
      /tsconfig\.json$/,
      /\.config\.(js|ts)$/,
      /src\/index\.(js|ts)$/,
      /src\/app\/layout\.(tsx|jsx)$/,
    ];
    return importantPatterns.some((pattern) => pattern.test(filePath));
  }

  // Helper: Pattern matching
  private matchPattern(target: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, ".*")
      .replace(/(?<!\.)\*/g, "[^/]*")
      .replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(target);
  }
}

// Singleton instance
export const gitApprovalWorkflow = new GitApprovalWorkflow();
