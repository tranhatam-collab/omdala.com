// ─── Eval/Test/Auto-Fix Loop — Tự động đánh giá, test và fix lỗi ───────────────
export interface TestResult {
  id: string;
  name: string;
  status: "passed" | "failed" | "skipped" | "error";
  duration: number;
  error?: string;
  filePath?: string;
  line?: number;
}

export interface LintResult {
  id: string;
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  filePath: string;
  line: number;
  column: number;
  fixable: boolean;
}

export interface EvalResult {
  id: string;
  timestamp: Date;
  changes: Array<{
    filePath: string;
    action: "created" | "modified" | "deleted";
  }>;
  testResults: TestResult[];
  lintResults: LintResult[];
  overallStatus: "passed" | "failed";
  issues: number;
  autoFixed: number;
}

export interface AutoFixConfig {
  autoRunTests: boolean;
  autoRunLint: boolean;
  autoFixLint: boolean;
  autoFixTests: boolean;
  maxFixAttempts: number;
  requireApprovalForFixes: boolean;
}

export class EvalAutoFixLoop {
  private config: AutoFixConfig;
  private evalHistory: EvalResult[] = [];

  constructor(config: Partial<AutoFixConfig> = {}) {
    this.config = {
      autoRunTests: true,
      autoRunLint: true,
      autoFixLint: true,
      autoFixTests: false,
      maxFixAttempts: 3,
      requireApprovalForFixes: true,
      ...config,
    };
  }

  // Run evaluation after changes
  async evaluate(
    changes: Array<{ filePath: string; action: "created" | "modified" | "deleted" }>,
  ): Promise<EvalResult> {
    const evalId = `eval-${Date.now()}`;
    const testResults: TestResult[] = [];
    const lintResults: LintResult[] = [];

    // Run lint if enabled
    if (this.config.autoRunLint) {
      const lint = await this.runLint(changes);
      lintResults.push(...lint);
    }

    // Run tests if enabled
    if (this.config.autoRunTests) {
      const tests = await this.runTests(changes);
      testResults.push(...tests);
    }

    // Auto-fix if enabled
    let autoFixed = 0;
    if (this.config.autoFixLint && lintResults.length > 0) {
      const fixed = await this.autoFixLintIssues(lintResults);
      autoFixed += fixed;
    }

    const overallStatus = this.determineOverallStatus(testResults, lintResults);
    const issues = lintResults.filter((r) => r.severity === "error").length +
                   testResults.filter((r) => r.status === "failed").length;

    const result: EvalResult = {
      id: evalId,
      timestamp: new Date(),
      changes,
      testResults,
      lintResults,
      overallStatus,
      issues,
      autoFixed,
    };

    this.evalHistory.push(result);
    return result;
  }

  // Run lint
  private async runLint(
    changes: Array<{ filePath: string; action: "created" | "modified" | "deleted" }>,
  ): Promise<LintResult[]> {
    const results: LintResult[] = [];

    // In a real implementation, this would run ESLint, TSLint, etc.
    // For now, simulate lint results
    for (const change of changes) {
      if (change.action === "deleted") continue;

      // Simulate finding some lint issues
      if (Math.random() > 0.7) {
        results.push({
          id: `lint-${Date.now()}`,
          rule: "no-console",
          severity: "warning",
          message: "Unexpected console statement",
          filePath: change.filePath,
          line: Math.floor(Math.random() * 50) + 1,
          column: Math.floor(Math.random() * 20) + 1,
          fixable: true,
        });
      }

      if (Math.random() > 0.8) {
        results.push({
          id: `lint-${Date.now()}`,
          rule: "no-unused-vars",
          severity: "error",
          message: "Unused variable",
          filePath: change.filePath,
          line: Math.floor(Math.random() * 50) + 1,
          column: Math.floor(Math.random() * 20) + 1,
          fixable: true,
        });
      }
    }

    return results;
  }

  // Run tests
  private async runTests(
    _changes: Array<{ filePath: string; action: "created" | "modified" | "deleted" }>,
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // In a real implementation, this would run Jest, Vitest, etc.
    // For now, simulate test results
    const testCount = Math.floor(Math.random() * 10) + 5;

    for (let i = 0; i < testCount; i++) {
      const status = Math.random() > 0.1 ? "passed" : "failed";
      const duration = Math.random() * 1000 + 100;

      results.push({
        id: `test-${Date.now()}-${i}`,
        name: `Test ${i + 1}`,
        status,
        duration,
        error: status === "failed" ? "Assertion failed" : undefined,
      });
    }

    return results;
  }

  // Auto-fix lint issues
  private async autoFixLintIssues(issues: LintResult[]): Promise<number> {
    let fixed = 0;

    for (const issue of issues) {
      if (!issue.fixable) continue;

      // In a real implementation, this would use ESLint --fix or similar
      // For now, simulate fixing
      if (Math.random() > 0.3) {
        fixed++;
      }
    }

    return fixed;
  }

  // Auto-fix test failures
  private async autoFixTestFailures(failures: TestResult[]): Promise<number> {
    let fixed = 0;

    for (const _failure of failures) {
      // In a real implementation, this would analyze the failure and attempt to fix
      // For now, simulate fixing
      if (Math.random() > 0.5) {
        fixed++;
      }
    }

    return fixed;
  }

  // Determine overall status
  private determineOverallStatus(
    testResults: TestResult[],
    lintResults: LintResult[],
  ): "passed" | "failed" {
    const hasTestFailures = testResults.some((r) => r.status === "failed");
    const hasLintErrors = lintResults.some((r) => r.severity === "error");

    return hasTestFailures || hasLintErrors ? "failed" : "passed";
  }

  // Run auto-fix loop
  async runAutoFixLoop(
    changes: Array<{ filePath: string; action: "created" | "modified" | "deleted" }>,
  ): Promise<{
    success: boolean;
    attempts: number;
    finalStatus: "passed" | "failed";
    history: EvalResult[];
  }> {
    const history: EvalResult[] = [];
    let attempts = 0;
    let finalStatus: "passed" | "failed" = "failed";

    while (attempts < this.config.maxFixAttempts) {
      attempts++;

      const result = await this.evaluate(changes);
      history.push(result);

      if (result.overallStatus === "passed") {
        finalStatus = "passed";
        break;
      }

      // Auto-fix test failures if enabled
      if (this.config.autoFixTests) {
        const failures = result.testResults.filter((r) => r.status === "failed");
        if (failures.length > 0) {
          await this.autoFixTestFailures(failures);
        }
      }

      // Small delay between attempts
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {
      success: finalStatus === "passed",
      attempts,
      finalStatus,
      history,
    };
  }

  // Get eval history
  getEvalHistory(limit = 50): EvalResult[] {
    return this.evalHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get eval statistics
  getStats(): {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    avgIssues: number;
    avgAutoFixed: number;
  } {
    const total = this.evalHistory.length;
    const passed = this.evalHistory.filter((r) => r.overallStatus === "passed").length;
    const failed = this.evalHistory.filter((r) => r.overallStatus === "failed").length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    const avgIssues = total > 0
      ? this.evalHistory.reduce((sum, r) => sum + r.issues, 0) / total
      : 0;
    const avgAutoFixed = total > 0
      ? this.evalHistory.reduce((sum, r) => sum + r.autoFixed, 0) / total
      : 0;

    return {
      total,
      passed,
      failed,
      passRate,
      avgIssues,
      avgAutoFixed,
    };
  }

  // Update config
  updateConfig(updates: Partial<AutoFixConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Get config
  getConfig(): AutoFixConfig {
    return { ...this.config };
  }

  // Clear old history
  clearOldHistory(daysToKeep = 7): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    this.evalHistory = this.evalHistory.filter((r) => r.timestamp >= cutoff);
  }
}

// Singleton instance
export const evalAutoFixLoop = new EvalAutoFixLoop();
