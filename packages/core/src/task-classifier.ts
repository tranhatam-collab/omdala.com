// ─── Task Classifier — Phân loại nhiệm vụ để chọn model phù hợp ───────────
export type TaskType =
  | "quick_question"
  | "code_fix"
  | "code_refactor"
  | "code_generation"
  | "architecture_design"
  | "ui_ux_design"
  | "debug"
  | "test_generation"
  | "deploy"
  | "audit"
  | "documentation"
  | "general";

export interface TaskClassification {
  type: TaskType;
  priority: "low" | "medium" | "high";
  complexity: "simple" | "moderate" | "complex";
  requiresCode: boolean;
  requiresReasoning: boolean;
  requiresVision: boolean;
  requiresTools: boolean;
  estimatedTokens: number;
  capabilities: Array<"chat" | "code" | "reasoning" | "vision" | "tools">;
  risk: "standard" | "sensitive" | "deployment";
}

export interface TaskContext {
  filesInvolved: string[];
  language: string;
  framework?: string;
  hasTests: boolean;
  isDeployment: boolean;
  isSecuritySensitive: boolean;
}

export function classifyTask(
  userPrompt: string,
  context: TaskContext = {
    filesInvolved: [],
    language: "typescript",
    hasTests: false,
    isDeployment: false,
    isSecuritySensitive: false,
  },
): TaskClassification {
  const prompt = userPrompt.toLowerCase();

  // Detect task type
  let type: TaskType = "general";

  if (prompt.includes("fix") || prompt.includes("sửa lỗi") || prompt.includes("bug") || prompt.includes("lỗi")) {
    type = "code_fix";
  } else if (prompt.includes("refactor") || prompt.includes("tái cấu trúc") || prompt.includes("clean up") || prompt.includes("tối ưu")) {
    type = "code_refactor";
  } else if (prompt.includes("generate") || prompt.includes("tạo") || prompt.includes("write") || prompt.includes("viết")) {
    type = "code_generation";
  } else if (prompt.includes("architecture") || prompt.includes("kiến trúc") || prompt.includes("design system") || prompt.includes("hệ thống")) {
    type = "architecture_design";
  } else if (prompt.includes("ui") || prompt.includes("ux") || prompt.includes("giao diện") || prompt.includes("component")) {
    type = "ui_ux_design";
  } else if (prompt.includes("debug") || prompt.includes("debugging") || prompt.includes("trace")) {
    type = "debug";
  } else if (prompt.includes("test") || prompt.includes("kiểm thử") || prompt.includes("unit test") || prompt.includes("e2e")) {
    type = "test_generation";
  } else if (prompt.includes("deploy") || prompt.includes("triển khai") || prompt.includes("ci/cd") || prompt.includes("vercel") || prompt.includes("cloudflare")) {
    type = "deploy";
  } else if (prompt.includes("audit") || prompt.includes("review") || prompt.includes("security") || prompt.includes("bảo mật")) {
    type = "audit";
  } else if (prompt.includes("doc") || prompt.includes("tài liệu") || prompt.includes("readme") || prompt.includes("comment")) {
    type = "documentation";
  } else if (prompt.length < 100 && !prompt.includes("code") && !prompt.includes("file")) {
    type = "quick_question";
  }

  // Determine complexity
  let complexity: TaskClassification["complexity"] = "simple";
  if (context.filesInvolved.length > 5 || prompt.length > 500) {
    complexity = "complex";
  } else if (context.filesInvolved.length > 2 || prompt.length > 200) {
    complexity = "moderate";
  }

  // Determine priority
  let priority: TaskClassification["priority"] = "medium";
  if (context.isSecuritySensitive || context.isDeployment) {
    priority = "high";
  } else if (type === "code_fix" || type === "debug") {
    priority = "high";
  } else if (type === "quick_question" || type === "documentation") {
    priority = "low";
  }

  // Determine requirements
  const requiresCode = [
    "code_fix",
    "code_refactor",
    "code_generation",
    "architecture_design",
    "debug",
    "test_generation",
  ].includes(type);

  const requiresReasoning = [
    "architecture_design",
    "debug",
    "audit",
    "deploy",
  ].includes(type);

  const requiresVision = type === "ui_ux_design" || prompt.includes("image") || prompt.includes("screenshot");

  const requiresTools = [
    "code_fix",
    "code_refactor",
    "code_generation",
    "test_generation",
    "deploy",
  ].includes(type);

  // Estimate tokens
  let estimatedTokens = 1000;
  if (complexity === "complex") {
    estimatedTokens = 4000 + context.filesInvolved.length * 500;
  } else if (complexity === "moderate") {
    estimatedTokens = 2000 + context.filesInvolved.length * 300;
  }

  const capabilities: TaskClassification["capabilities"] = ["chat"];
  if (requiresCode) capabilities.push("code");
  if (requiresReasoning) capabilities.push("reasoning");
  if (requiresVision) capabilities.push("vision");
  if (requiresTools) capabilities.push("tools");
  const risk: TaskClassification["risk"] = context.isSecuritySensitive
    ? "sensitive"
    : context.isDeployment
      ? "deployment"
      : "standard";

  return {
    type,
    priority,
    complexity,
    requiresCode,
    requiresReasoning,
    requiresVision,
    requiresTools,
    estimatedTokens,
    capabilities,
    risk,
  };
}

export function getTaskTypeLabel(type: TaskType): string {
  const labels: Record<TaskType, string> = {
    quick_question: "Câu hỏi nhanh",
    code_fix: "Sửa lỗi code",
    code_refactor: "Tái cấu trúc",
    code_generation: "Tạo code",
    architecture_design: "Thiết kế kiến trúc",
    ui_ux_design: "Thiết kế UI/UX",
    debug: "Debug",
    test_generation: "Viết test",
    deploy: "Triển khai",
    audit: "Audit/Review",
    documentation: "Tài liệu",
    general: "Tổng quát",
  };
  return labels[type];
}
