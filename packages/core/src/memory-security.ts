// ─── Memory/Security/Rollback — Quản lý memory, security sandbox, rollback ─────
export interface ProjectMemory {
  id: string;
  projectId: string;
  structure: {
    directories: string[];
    keyFiles: string[];
    dependencies: Record<string, string>;
  };
  decisions: Array<{
    timestamp: Date;
    description: string;
    reason: string;
    impact: string;
  }>;
  patterns: Array<{
    pattern: string;
    description: string;
    examples: string[];
  }>;
  lastUpdated: Date;
}

export interface SecuritySandbox {
  id: string;
  allowedPaths: string[];
  deniedPaths: string[];
  allowedCommands: string[];
  deniedCommands: string[];
  networkAccess: boolean;
  fileSystemAccess: boolean;
  environmentVariables: Record<string, string>;
}

export interface RollbackPoint {
  id: string;
  timestamp: Date;
  description: string;
  changes: Array<{
    filePath: string;
    action: "created" | "modified" | "deleted";
    oldContent?: string;
    newContent?: string;
  }>;
  isAutomatic: boolean;
  createdBy: string;
}

export interface RollbackConfig {
  autoCreateBeforeChanges: boolean;
  maxRollbackPoints: number;
  retentionDays: number;
  requireApprovalForRollback: boolean;
}

export class MemorySecurityRollback {
  private memory: Map<string, ProjectMemory> = new Map();
  private sandboxes: Map<string, SecuritySandbox> = new Map();
  private rollbackPoints: Map<string, RollbackPoint> = new Map();
  private config: RollbackConfig;

  constructor(config: Partial<RollbackConfig> = {}) {
    this.config = {
      autoCreateBeforeChanges: true,
      maxRollbackPoints: 50,
      retentionDays: 30,
      requireApprovalForRollback: true,
      ...config,
    };
  }

  // Project Memory Management
  createProjectMemory(projectId: string): ProjectMemory {
    const memory: ProjectMemory = {
      id: `memory-${projectId}-${Date.now()}`,
      projectId,
      structure: {
        directories: [],
        keyFiles: [],
        dependencies: {},
      },
      decisions: [],
      patterns: [],
      lastUpdated: new Date(),
    };
    this.memory.set(memory.id, memory);
    return memory;
  }

  getProjectMemory(projectId: string): ProjectMemory | null {
    for (const memory of this.memory.values()) {
      if (memory.projectId === projectId) {
        return memory;
      }
    }
    return null;
  }

  updateProjectStructure(
    projectId: string,
    structure: Partial<ProjectMemory["structure"]>,
  ): void {
    const memory = this.getProjectMemory(projectId);
    if (memory) {
      memory.structure = { ...memory.structure, ...structure };
      memory.lastUpdated = new Date();
    }
  }

  addDecision(
    projectId: string,
    description: string,
    reason: string,
    impact: string,
  ): void {
    const memory = this.getProjectMemory(projectId);
    if (memory) {
      memory.decisions.push({
        timestamp: new Date(),
        description,
        reason,
        impact,
      });
      memory.lastUpdated = new Date();
    }
  }

  addPattern(
    projectId: string,
    pattern: string,
    description: string,
    examples: string[],
  ): void {
    const memory = this.getProjectMemory(projectId);
    if (memory) {
      memory.patterns.push({
        pattern,
        description,
        examples,
      });
      memory.lastUpdated = new Date();
    }
  }

  // Security Sandbox Management
  createSandbox(config: Partial<SecuritySandbox> = {}): SecuritySandbox {
    const sandbox: SecuritySandbox = {
      id: `sandbox-${Date.now()}`,
      allowedPaths: config.allowedPaths || [],
      deniedPaths: config.deniedPaths || [],
      allowedCommands: config.allowedCommands || [],
      deniedCommands: config.deniedCommands || [],
      networkAccess: config.networkAccess ?? false,
      fileSystemAccess: config.fileSystemAccess ?? true,
      environmentVariables: config.environmentVariables || {},
    };
    this.sandboxes.set(sandbox.id, sandbox);
    return sandbox;
  }

  getSandbox(sandboxId: string): SecuritySandbox | null {
    return this.sandboxes.get(sandboxId) || null;
  }

  checkSandboxPermission(
    sandboxId: string,
    action: "read" | "write" | "execute" | "network",
    target: string,
  ): { allowed: boolean; reason?: string } {
    const sandbox = this.getSandbox(sandboxId);
    if (!sandbox) {
      return { allowed: false, reason: "Sandbox not found" };
    }

    // Check network access
    if (action === "network" && !sandbox.networkAccess) {
      return { allowed: false, reason: "Network access denied" };
    }

    // Check file system access
    if ((action === "read" || action === "write") && !sandbox.fileSystemAccess) {
      return { allowed: false, reason: "File system access denied" };
    }

    // Check denied paths
    for (const deniedPath of sandbox.deniedPaths) {
      if (this.matchPattern(target, deniedPath)) {
        return { allowed: false, reason: `Path denied by sandbox rule: ${deniedPath}` };
      }
    }

    // Check allowed paths (if specified)
    if (sandbox.allowedPaths.length > 0) {
      const allowed = sandbox.allowedPaths.some((p) => this.matchPattern(target, p));
      if (!allowed) {
        return { allowed: false, reason: "Path not in allowed list" };
      }
    }

    // Check denied commands
    if (action === "execute") {
      for (const deniedCmd of sandbox.deniedCommands) {
        if (target.includes(deniedCmd)) {
          return { allowed: false, reason: `Command denied by sandbox rule: ${deniedCmd}` };
        }
      }

      // Check allowed commands (if specified)
      if (sandbox.allowedCommands.length > 0) {
        const allowed = sandbox.allowedCommands.some((cmd) => target.includes(cmd));
        if (!allowed) {
          return { allowed: false, reason: "Command not in allowed list" };
        }
      }
    }

    return { allowed: true };
  }

  // Rollback Management
  createRollbackPoint(
    description: string,
    changes: Array<{
      filePath: string;
      action: "created" | "modified" | "deleted";
      oldContent?: string;
      newContent?: string;
    }>,
    createdBy: string,
    isAutomatic = false,
  ): RollbackPoint {
    const point: RollbackPoint = {
      id: `rollback-${Date.now()}`,
      timestamp: new Date(),
      description,
      changes,
      isAutomatic,
      createdBy,
    };

    this.rollbackPoints.set(point.id, point);

    // Cleanup old rollback points
    this.cleanupOldRollbackPoints();

    return point;
  }

  getRollbackPoint(pointId: string): RollbackPoint | null {
    return this.rollbackPoints.get(pointId) || null;
  }

  getRollbackPoints(limit = 20): RollbackPoint[] {
    return Array.from(this.rollbackPoints.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async rollback(pointId: string, approvedBy?: string): Promise<{
    success: boolean;
    reason?: string;
    appliedChanges: Array<{ filePath: string; action: string }>;
  }> {
    if (this.config.requireApprovalForRollback && !approvedBy) {
      return { success: false, reason: "Rollback requires approval", appliedChanges: [] };
    }

    const point = this.getRollbackPoint(pointId);
    if (!point) {
      return { success: false, reason: "Rollback point not found", appliedChanges: [] };
    }

    const appliedChanges: Array<{ filePath: string; action: string }> = [];

    // In a real implementation, this would actually revert the files
    // For now, simulate the rollback
    for (const change of point.changes) {
      const action = change.action === "created" ? "delete" :
                    change.action === "deleted" ? "create" : "revert";
      appliedChanges.push({ filePath: change.filePath, action });
    }

    return { success: true, appliedChanges };
  }

  // Auto-create rollback point before changes
  async autoCreateRollback(
    changes: Array<{
      filePath: string;
      action: "created" | "modified" | "deleted";
      oldContent?: string;
      newContent?: string;
    }>,
    createdBy: string,
  ): Promise<RollbackPoint | null> {
    if (!this.config.autoCreateBeforeChanges) {
      return null;
    }

    return this.createRollbackPoint(
      `Auto-rollback before ${changes.length} changes`,
      changes,
      createdBy,
      true,
    );
  }

  // Cleanup old rollback points
  private cleanupOldRollbackPoints(): void {
    const now = Date.now();
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

    // Remove expired points
    for (const [id, point] of this.rollbackPoints) {
      if (now - point.timestamp.getTime() > retentionMs) {
        this.rollbackPoints.delete(id);
      }
    }

    // Remove oldest if over limit
    const points = Array.from(this.rollbackPoints.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    while (points.length > this.config.maxRollbackPoints) {
      const oldest = points.shift();
      if (oldest) {
        this.rollbackPoints.delete(oldest.id);
      }
    }
  }

  // Update config
  updateConfig(updates: Partial<RollbackConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Get config
  getConfig(): RollbackConfig {
    return { ...this.config };
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
export const memorySecurityRollback = new MemorySecurityRollback();
