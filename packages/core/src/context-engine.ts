// ─── Context/Memory Engine — Quản lý context thông minh cho AI ───────────
export interface RepoStructure {
  rootPath: string;
  files: RepoFile[];
  directories: RepoDirectory[];
  dependencies: ProjectDependencies;
  framework: string;
  language: string;
}

export interface RepoFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  lastModified: Date;
  language: string;
  isTest: boolean;
  isConfig: boolean;
  isDocumentation: boolean;
}

export interface RepoDirectory {
  path: string;
  name: string;
  depth: number;
  fileCount: number;
}

export interface ProjectDependencies {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
}

export interface CodeRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  severity: "error" | "warning" | "info";
  category: "style" | "best-practice" | "security" | "performance";
  language: string;
}

export interface ErrorRecord {
  id: string;
  timestamp: Date;
  file: string;
  line: number;
  message: string;
  stackTrace?: string;
  fix?: string;
  resolved: boolean;
}

export interface ContextQuery {
  task: string;
  filesInvolved: string[];
  maxTokens: number;
  includeTests: boolean;
  includeDocs: boolean;
  preferRecent: boolean;
}

export interface ContextResult {
  files: Array<{ path: string; content: string; relevance: number }>;
  rules: CodeRule[];
  errors: ErrorRecord[];
  dependencies: ProjectDependencies;
  totalTokens: number;
}

export class ContextEngine {
  private repoStructure: RepoStructure | null = null;
  private codeRules: Map<string, CodeRule[]> = new Map();
  private errorHistory: ErrorRecord[] = [];
  private fileCache: Map<string, string> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // TypeScript/JavaScript rules
    this.codeRules.set("typescript", [
      {
        id: "ts-no-any",
        name: "Avoid 'any' type",
        description: "Avoid using 'any' type, use specific types instead",
        pattern: "\\bany\\b",
        severity: "warning",
        category: "best-practice",
        language: "typescript",
      },
      {
        id: "ts-no-console",
        name: "No console.log in production",
        description: "Remove console.log statements before committing",
        pattern: "console\\.log",
        severity: "warning",
        category: "best-practice",
        language: "typescript",
      },
      {
        id: "ts-no-var",
        name: "Use const/let instead of var",
        description: "Use const or let instead of var",
        pattern: "\\bvar\\b",
        severity: "error",
        category: "style",
        language: "typescript",
      },
    ]);

    // React rules
    this.codeRules.set("react", [
      {
        id: "react-hooks-deps",
        name: "React hooks dependencies",
        description: "Include all dependencies in useEffect/useCallback/useMemo",
        pattern: "useEffect\\(\\(\\)\\s*=>",
        severity: "error",
        category: "best-practice",
        language: "typescript",
      },
      {
        id: "react-key-prop",
        name: "React key prop",
        description: "Always provide key prop when rendering lists",
        pattern: "\\.map\\(",
        severity: "error",
        category: "best-practice",
        language: "typescript",
      },
    ]);

    // Security rules
    this.codeRules.set("security", [
      {
        id: "sec-no-hardcoded-secrets",
        name: "No hardcoded secrets",
        description: "Never hardcode API keys, passwords, or secrets",
        pattern: "(api_key|secret|password|token)\\s*=\\s*['\"]",
        severity: "error",
        category: "security",
        language: "typescript",
      },
      {
        id: "sec-no-eval",
        name: "No eval()",
        description: "Never use eval() as it's a security risk",
        pattern: "\\beval\\(",
        severity: "error",
        category: "security",
        language: "typescript",
      },
    ]);
  }

  async analyzeRepo(rootPath: string, files: Array<{ path: string; content: string }>): Promise<RepoStructure> {
    const repoFiles: RepoFile[] = files.map((f) => this.parseFile(f.path, f.content));
    const directories = this.buildDirectoryStructure(repoFiles);
    const dependencies = this.extractDependencies(files);
    const framework = this.detectFramework(dependencies);
    const language = this.detectLanguage(repoFiles);

    this.repoStructure = {
      rootPath,
      files: repoFiles,
      directories,
      dependencies,
      framework,
      language,
    };

    // Cache file contents
    files.forEach((f) => this.fileCache.set(f.path, f.content));

    return this.repoStructure;
  }

  private parseFile(path: string, content: string): RepoFile {
    const name = path.split("/").pop() || "";
    const extension = name.split(".").pop() || "";
    const size = content.length;
    const language = this.detectFileLanguage(extension);
    const isTest = /test|spec/.test(name) || path.includes("/test/") || path.includes("/__tests__/");
    const isConfig = /config|rc|json|yaml|yml/.test(name) || path.includes("/config/");
    const isDocumentation = /readme|doc|md/.test(name) || path.includes("/docs/");

    return {
      path,
      name,
      extension,
      size,
      lastModified: new Date(),
      language,
      isTest,
      isConfig,
      isDocumentation,
    };
  }

  private buildDirectoryStructure(files: RepoFile[]): RepoDirectory[] {
    const dirMap = new Map<string, RepoDirectory>();

    files.forEach((file) => {
      const parts = file.path.split("/");
      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join("/");
        const dirName = parts[i];
        const existing = dirMap.get(dirPath);
        if (existing) {
          existing.fileCount++;
        } else {
          dirMap.set(dirPath, {
            path: dirPath,
            name: dirName,
            depth: i,
            fileCount: 1,
          });
        }
      }
    });

    return Array.from(dirMap.values());
  }

  private extractDependencies(files: Array<{ path: string; content: string }>): ProjectDependencies {
    const packageFile = files.find((f) => f.path === "package.json");
    if (!packageFile) {
      return { dependencies: {}, devDependencies: {}, packageManager: "npm" };
    }

    try {
      const pkg = JSON.parse(packageFile.content) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        packageManager?: string;
      };
      return {
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {},
        packageManager: this.detectPackageManager(pkg),
      };
    } catch {
      return { dependencies: {}, devDependencies: {}, packageManager: "npm" };
    }
  }

  private detectPackageManager(pkg: { packageManager?: string }): "npm" | "yarn" | "pnpm" | "bun" {
    if (pkg.packageManager) {
      const [name] = pkg.packageManager.split("@");
      if (name === "npm" || name === "yarn" || name === "pnpm" || name === "bun") {
        return name;
      }
    }
    // Check for lock files
    if (this.fileCache.has("yarn.lock")) return "yarn";
    if (this.fileCache.has("pnpm-lock.yaml")) return "pnpm";
    if (this.fileCache.has("bun.lockb")) return "bun";
    return "npm";
  }

  private detectFramework(deps: ProjectDependencies): string {
    const allDeps = { ...deps.dependencies, ...deps.devDependencies };
    const depsLower = Object.keys(allDeps).map((d) => d.toLowerCase());

    if (depsLower.includes("next")) return "Next.js";
    if (depsLower.includes("react")) return "React";
    if (depsLower.includes("vue")) return "Vue";
    if (depsLower.includes("angular")) return "Angular";
    if (depsLower.includes("svelte")) return "Svelte";
    if (depsLower.includes("express")) return "Express";
    if (depsLower.includes("fastify")) return "Fastify";
    if (depsLower.includes("nest")) return "NestJS";

    return "Unknown";
  }

  private detectLanguage(files: RepoFile[]): string {
    const langCount = new Map<string, number>();
    files.forEach((f) => {
      langCount.set(f.language, (langCount.get(f.language) || 0) + 1);
    });

    let maxCount = 0;
    let mainLang = "typescript";
    for (const [lang, count] of langCount) {
      if (count > maxCount) {
        maxCount = count;
        mainLang = lang;
      }
    }
    return mainLang;
  }

  private detectFileLanguage(extension: string): string {
    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      py: "python",
      rb: "ruby",
      go: "go",
      rs: "rust",
      java: "java",
      kt: "kotlin",
      swift: "swift",
      cpp: "cpp",
      c: "c",
      h: "c",
      cs: "csharp",
      php: "php",
      scala: "scala",
      sh: "shell",
      bash: "shell",
      zsh: "shell",
      sql: "sql",
      html: "html",
      css: "css",
      scss: "scss",
      sass: "sass",
      less: "less",
      json: "json",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
      md: "markdown",
      txt: "text",
    };
    return langMap[extension] || "text";
  }

  async queryContext(query: ContextQuery): Promise<ContextResult> {
    if (!this.repoStructure) {
      throw new Error("Repo not analyzed. Call analyzeRepo first.");
    }

    const relevantFiles = this.selectRelevantFiles(query);
    const rules = this.getRelevantRules(query);
    const errors = this.getRelevantErrors(query);
    const totalTokens = this.estimateTokens(relevantFiles);

    return {
      files: relevantFiles,
      rules,
      errors,
      dependencies: this.repoStructure.dependencies,
      totalTokens,
    };
  }

  private selectRelevantFiles(query: ContextQuery): Array<{ path: string; content: string; relevance: number }> {
    const selected: Array<{ path: string; content: string; relevance: number }> = [];

    // Direct file matches
    for (const filePath of query.filesInvolved) {
      const content = this.fileCache.get(filePath);
      if (content) {
        selected.push({ path: filePath, content, relevance: 1.0 });
      }
    }

    // Semantic search based on task (simplified)
    const taskLower = query.task.toLowerCase();
    const keywords = this.extractKeywords(taskLower);

    for (const [path, content] of this.fileCache) {
      if (query.filesInvolved.includes(path)) continue;

      const file = this.repoStructure?.files.find((f) => f.path === path);
      if (!file) continue;

      // Skip tests/docs if not requested
      if (!query.includeTests && file.isTest) continue;
      if (!query.includeDocs && file.isDocumentation) continue;

      // Calculate relevance based on keyword matching
      let relevance = 0;
      const contentLower = content.toLowerCase();
      for (const keyword of keywords) {
        if (contentLower.includes(keyword)) {
          relevance += 0.2;
        }
      }

      // Boost relevance for files in same directory
      for (const involvedPath of query.filesInvolved) {
        const involvedDir = involvedPath.split("/").slice(0, -1).join("/");
        const fileDir = path.split("/").slice(0, -1).join("/");
        if (involvedDir === fileDir) {
          relevance += 0.3;
        }
      }

      if (relevance > 0.3) {
        selected.push({ path, content, relevance: Math.min(relevance, 1.0) });
      }
    }

    // Sort by relevance and limit by token budget
    selected.sort((a, b) => b.relevance - a.relevance);
    return this.limitByTokens(selected, query.maxTokens);
  }

  private extractKeywords(task: string): string[] {
    const stopWords = ["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can", "need", "dare", "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "under", "again", "further", "then", "once"];
    const words = task.split(/\s+/).filter((w) => w.length > 2 && !stopWords.includes(w));
    return words;
  }

  private limitByTokens(files: Array<{ path: string; content: string; relevance: number }>, maxTokens: number): Array<{ path: string; content: string; relevance: number }> {
    const result: Array<{ path: string; content: string; relevance: number }> = [];
    let usedTokens = 0;

    for (const file of files) {
      const fileTokens = this.estimateTokens([{ path: file.path, content: file.content, relevance: file.relevance }]);
      
      if (usedTokens + fileTokens > maxTokens) {
        // Truncate content if needed
        const remainingTokens = maxTokens - usedTokens;
        const charsToKeep = remainingTokens * 4;
        const truncatedContent = file.content.substring(0, charsToKeep) + "\n... [truncated]";
        const truncatedTokens = this.estimateTokens([{ path: file.path, content: truncatedContent, relevance: file.relevance }]);
        
        result.push({ path: file.path, content: truncatedContent, relevance: file.relevance });
        usedTokens += truncatedTokens;
      } else {
        result.push(file);
        usedTokens += fileTokens;
      }
      
      if (usedTokens >= maxTokens) break;
    }

    return result;
  }

  private estimateTokens(files: Array<{ path: string; content: string; relevance: number }>): number {
    return files.reduce((sum, f) => sum + Math.ceil(f.content.length / 4), 0);
  }

  private getRelevantRules(_query: ContextQuery): CodeRule[] {
    const allRules: CodeRule[] = [];
    for (const rules of this.codeRules.values()) {
      allRules.push(...rules);
    }
    return allRules;
  }

  private getRelevantErrors(query: ContextQuery): ErrorRecord[] {
    // Return errors from files involved in the task
    return this.errorHistory.filter((e) =>
      query.filesInvolved.some((f) => f === e.file || f.startsWith(e.file)),
    );
  }

  addError(error: Omit<ErrorRecord, "id" | "timestamp">): ErrorRecord {
    const record: ErrorRecord = {
      ...error,
      id: `error-${Date.now()}`,
      timestamp: new Date(),
    };
    this.errorHistory.push(record);
    return record;
  }

  resolveError(errorId: string, fix: string): void {
    const error = this.errorHistory.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.fix = fix;
    }
  }

  getRecentErrors(limit: number = 10): ErrorRecord[] {
    return this.errorHistory
      .filter((e) => !e.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  addCustomRule(rule: CodeRule): void {
    const langRules = this.codeRules.get(rule.language) || [];
    langRules.push(rule);
    this.codeRules.set(rule.language, langRules);
  }

  getRepoStructure(): RepoStructure | null {
    return this.repoStructure;
  }

  clearCache(): void {
    this.fileCache.clear();
    this.embeddings.clear();
  }
}

// Singleton instance
export const contextEngine = new ContextEngine();
