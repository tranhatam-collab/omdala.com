// ─── Test/Build/Deploy Pipeline — CI/CD automation ───────────────────────
export interface PipelineJob {
  id: string;
  name: string;
  type: "test" | "build" | "lint" | "deploy" | "custom";
  status: "pending" | "running" | "passed" | "failed" | "cancelled";
  command: string;
  workingDir?: string;
  env?: Record<string, string>;
  timeout?: number;
  startedAt?: Date;
  completedAt?: Date;
  output?: string;
  error?: string;
  dependencies: string[];
}

export interface PipelineStage {
  id: string;
  name: string;
  jobs: PipelineJob[];
  status: "pending" | "running" | "passed" | "failed" | "cancelled";
  startedAt?: Date;
  completedAt?: Date;
}

export interface PipelineRun {
  id: string;
  name: string;
  branch: string;
  commit: string;
  author: string;
  status: "pending" | "running" | "passed" | "failed" | "cancelled";
  stages: PipelineStage[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
}

export interface PipelineConfig {
  stages: Array<{
    name: string;
    jobs: Array<{
      name: string;
      type: "test" | "build" | "lint" | "deploy" | "custom";
      command: string;
      workingDir?: string;
      env?: Record<string, string>;
      timeout?: number;
    }>;
  }>;
  autoRunOnPush: boolean;
  autoRunOnPR: boolean;
  requiredBranches: string[];
}

export class CIPipeline {
  private config: PipelineConfig;
  private runs: Map<string, PipelineRun> = new Map();
  private currentRun: PipelineRun | null = null;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      stages: [
        {
          name: "lint",
          jobs: [
            {
              name: "ESLint",
              type: "lint",
              command: "npm run lint",
              timeout: 300000,
            },
            {
              name: "TypeScript",
              type: "lint",
              command: "npx tsc --noEmit",
              timeout: 300000,
            },
          ],
        },
        {
          name: "test",
          jobs: [
            {
              name: "Unit Tests",
              type: "test",
              command: "npm test",
              timeout: 600000,
            },
          ],
        },
        {
          name: "build",
          jobs: [
            {
              name: "Build",
              type: "build",
              command: "npm run build",
              timeout: 600000,
            },
          ],
        },
      ],
      autoRunOnPush: true,
      autoRunOnPR: true,
      requiredBranches: ["main", "master", "develop"],
      ...config,
    };
  }

  // Create pipeline run
  createRun(
    name: string,
    branch: string,
    commit: string,
    author: string,
  ): PipelineRun {
    const run: PipelineRun = {
      id: `run-${Date.now()}`,
      name,
      branch,
      commit,
      author,
      status: "pending",
      stages: this.config.stages.map((stage) => ({
        id: `stage-${stage.name}-${Date.now()}`,
        name: stage.name,
        jobs: stage.jobs.map((job) => ({
          id: `job-${job.name}-${Date.now()}`,
          name: job.name,
          type: job.type,
          status: "pending",
          command: job.command,
          workingDir: job.workingDir,
          env: job.env,
          timeout: job.timeout,
          dependencies: [],
        })),
        status: "pending",
      })),
      startedAt: new Date(),
    };

    this.runs.set(run.id, run);
    return run;
  }

  // Start pipeline run
  async startRun(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    this.currentRun = run;
    run.status = "running";

    for (const stage of run.stages) {
      stage.status = "running";
      stage.startedAt = new Date();

      for (const job of stage.jobs) {
        job.status = "running";
        job.startedAt = new Date();

        try {
          const result = await this.executeJob(job);
          job.output = result.output;
          job.status = "passed";
        } catch (error: any) {
          job.error = error.message;
          job.status = "failed";
          job.completedAt = new Date();
          stage.status = "failed";
          run.status = "failed";
          run.completedAt = new Date();
          run.duration = run.completedAt.getTime() - run.startedAt.getTime();
          return;
        }

        job.completedAt = new Date();
      }

      stage.status = "passed";
      stage.completedAt = new Date();
    }

    run.status = "passed";
    run.completedAt = new Date();
    run.duration = run.completedAt.getTime() - run.startedAt.getTime();
  }

  // Execute a single job
  private async executeJob(job: PipelineJob): Promise<{ output: string }> {
    // In a real implementation, this would execute the command in a shell
    // For now, simulate execution
    await this.simulateExecution(job);

    return {
      output: `[Simulated output for ${job.name}]\nCommand: ${job.command}\nStatus: Success`,
    };
  }

  // Simulate job execution
  private async simulateExecution(job: PipelineJob): Promise<void> {
    const duration = Math.random() * 5000 + 2000; // 2-7 seconds
    await new Promise((resolve) => setTimeout(resolve, duration));
  }

  // Cancel pipeline run
  cancelRun(runId: string): void {
    const run = this.runs.get(runId);
    if (run && run.status === "running") {
      run.status = "cancelled";
      run.completedAt = new Date();
      run.duration = run.completedAt.getTime() - run.startedAt.getTime();

      for (const stage of run.stages) {
        if (stage.status === "running") {
          stage.status = "cancelled";
          stage.completedAt = new Date();
          for (const job of stage.jobs) {
            if (job.status === "running") {
              job.status = "cancelled";
              job.completedAt = new Date();
            }
          }
        }
      }
    }
  }

  // Get pipeline run
  getRun(runId: string): PipelineRun | null {
    return this.runs.get(runId) || null;
  }

  // Get all pipeline runs
  getRuns(): PipelineRun[] {
    return Array.from(this.runs.values()).sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
    );
  }

  // Get runs for branch
  getRunsForBranch(branch: string): PipelineRun[] {
    return this.getRuns().filter((run) => run.branch === branch);
  }

  // Get current run
  getCurrentRun(): PipelineRun | null {
    return this.currentRun;
  }

  // Check if pipeline should auto-run
  shouldAutoRun(branch: string, isPR: boolean): boolean {
    if (isPR && this.config.autoRunOnPR) {
      return true;
    }
    if (!isPR && this.config.autoRunOnPush) {
      return this.config.requiredBranches.includes(branch);
    }
    return false;
  }

  // Update config
  updateConfig(updates: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Get config
  getConfig(): PipelineConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  // Get pipeline statistics
  getStats(): {
    total: number;
    passed: number;
    failed: number;
    cancelled: number;
    running: number;
    pending: number;
    successRate: number;
  } {
    const runs = this.getRuns();
    const total = runs.length;
    const passed = runs.filter((r) => r.status === "passed").length;
    const failed = runs.filter((r) => r.status === "failed").length;
    const cancelled = runs.filter((r) => r.status === "cancelled").length;
    const running = runs.filter((r) => r.status === "running").length;
    const pending = runs.filter((r) => r.status === "pending").length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      total,
      passed,
      failed,
      cancelled,
      running,
      pending,
      successRate,
    };
  }
}

// Singleton instance
export const ciPipeline = new CIPipeline();
