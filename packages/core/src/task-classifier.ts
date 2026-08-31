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
  recommendedModel: string;
  fallbackModels: string[];
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

  // Recommend model based on task
  const recommendedModel = getRecommendedModel(type, complexity, context);
  const fallbackModels = getFallbackModels(recommendedModel, type);

  return {
    type,
    priority,
    complexity,
    requiresCode,
    requiresReasoning,
    requiresVision,
    requiresTools,
    estimatedTokens,
    recommendedModel,
    fallbackModels,
  };
}

function getRecommendedModel(
  type: TaskType,
  complexity: TaskClassification["complexity"],
  context: TaskContext,
): string {
  // For security-sensitive tasks, prefer local or private models
  if (context.isSecuritySensitive) {
    return "llama3.2"; // Local model
  }

  // For quick questions, use cheapest fast model
  if (type === "quick_question") {
    return "gpt-4o-mini";
  }

  // For code tasks, prefer code-optimized models
  if (type === "code_fix" || type === "code_generation" || type === "test_generation") {
    if (complexity === "simple") {
      return "gpt-4o-mini";
    } else if (complexity === "moderate") {
      return "claude-3-5-sonnet-20241022";
    } else {
      return "gpt-4o";
    }
  }

  // For architecture and reasoning-heavy tasks
  if (type === "architecture_design" || type === "debug" || type === "audit") {
    if (complexity === "complex") {
      return "o1-preview";
    }
    return "claude-3-opus-20240229";
  }

  // For UI/UX creative tasks
  if (type === "ui_ux_design") {
    return "gemini-2.0-flash-exp";
  }

  // For deployment (needs careful reasoning)
  if (type === "deploy") {
    return "claude-3-5-sonnet-20241022";
  }

  // Default
  return "gpt-4o-mini";
}

function getFallbackModels(recommendedModel: string, type: TaskType): string[] {
  const fallbacks: string[] = [];

  // If recommended is OpenAI, add Anthropic and Google as fallbacks
  if (recommendedModel.startsWith("gpt-")) {
    fallbacks.push("claude-3-5-sonnet-20241022", "gemini-2.0-flash-exp");
  }
  // If recommended is Anthropic, add OpenAI and Groq
  else if (recommendedModel.startsWith("claude-")) {
    fallbacks.push("gpt-4o", "llama-3.3-70b-versatile");
  }
  // If recommended is Google, add OpenAI
  else if (recommendedModel.startsWith("gemini-")) {
    fallbacks.push("gpt-4o", "claude-3-5-sonnet-20241022");
  }
  // If recommended is Groq/DeepSeek/Cloudflare, add OpenAI as fallback
  else {
    fallbacks.push("gpt-4o-mini", "claude-3-5-haiku-20241022");
  }

  // For code tasks, add code-specific fallbacks
  if (type === "code_fix" || type === "code_generation") {
    fallbacks.push("deepseek-coder", "codellama");
  }

  return fallbacks.slice(0, 3);
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
