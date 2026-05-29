// ─── Multi-Agent Orchestrator — Chia việc cho nhiều agent chuyên biệt ─────
import { AIRequest, AIResponse } from "./ai-gateway";
import { TaskClassification } from "./task-classifier";
import { ModelRouter, RouterResult } from "./model-router";

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: AgentCapability[];
  description: string;
}

export type AgentRole =
  | "planner"
  | "coder"
  | "reviewer"
  | "tester"
  | "deployer"
  | "architect"
  | "debugger"
  | "documenter";

export type AgentCapability =
  | "code_generation"
  | "code_review"
  | "test_generation"
  | "debugging"
  | "architecture"
  | "deployment"
  | "documentation"
  | "security_audit";

export interface AgentTask {
  id: string;
  agentId: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  input: any;
  output?: any;
  error?: string;
  dependencies: string[];
  startedAt?: Date;
  completedAt?: Date;
  classification?: TaskClassification;
}

export interface OrchestratorPlan {
  id: string;
  tasks: AgentTask[];
  estimatedDuration: number;
  estimatedCost: number;
  requiresApproval: boolean;
}

export class AgentOrchestrator {
  private agents: Map<string, Agent>;
  private router: ModelRouter;
  private executionHistory: Map<string, OrchestratorPlan>;

  constructor(router: ModelRouter) {
    this.router = router;
    this.agents = new Map();
    this.executionHistory = new Map();
    this.initializeAgents();
  }

  private initializeAgents() {
    // Planner Agent — Phân tích yêu cầu và tạo kế hoạch
    this.agents.set("planner", {
      id: "planner",
      name: "Planner",
      role: "planner",
      capabilities: ["architecture", "code_generation"],
      description: "Phân tích yêu cầu, chia nhỏ task, tạo kế hoạch thực thi",
    });

    // Coder Agent — Viết và sửa code
    this.agents.set("coder", {
      id: "coder",
      name: "Coder",
      role: "coder",
      capabilities: ["code_generation", "debugging"],
      description: "Viết code mới, sửa lỗi, refactor",
    });

    // Reviewer Agent — Review code
    this.agents.set("reviewer", {
      id: "reviewer",
      name: "Reviewer",
      role: "reviewer",
      capabilities: ["code_review", "security_audit"],
      description: "Review code, kiểm tra best practices, security",
    });

    // Tester Agent — Viết test
    this.agents.set("tester", {
      id: "tester",
      name: "Tester",
      role: "tester",
      capabilities: ["test_generation", "debugging"],
      description: "Viết unit test, integration test, e2e test",
    });

    // Architect Agent — Thiết kế kiến trúc
    this.agents.set("architect", {
      id: "architect",
      name: "Architect",
      role: "architect",
      capabilities: ["architecture", "code_review"],
      description: "Thiết kế kiến trúc hệ thống, design patterns",
    });

    // Deployer Agent — Deploy
    this.agents.set("deployer", {
      id: "deployer",
      name: "Deployer",
      role: "deployer",
      capabilities: ["deployment"],
      description: "Triển khai, CI/CD, environment setup",
    });

    // Debugger Agent — Debug chuyên sâu
    this.agents.set("debugger", {
      id: "debugger",
      name: "Debugger",
      role: "debugger",
      capabilities: ["debugging", "code_review"],
      description: "Debug chuyên sâu, trace error, log analysis",
    });

    // Documenter Agent — Viết tài liệu
    this.agents.set("documenter", {
      id: "documenter",
      name: "Documenter",
      role: "documenter",
      capabilities: ["documentation"],
      description: "Viết README, API docs, comments",
    });
  }

  async plan(
    userPrompt: string,
    classification: TaskClassification,
    context: { files: string[]; language: string },
  ): Promise<OrchestratorPlan> {
    const tasks: AgentTask[] = [];
    let taskId = 0;

    // Task 1: Planner phân tích
    tasks.push({
      id: `task-${taskId++}`,
      agentId: "planner",
      description: "Phân tích yêu cầu và tạo kế hoạch chi tiết",
      status: "pending",
      input: { prompt: userPrompt, classification, context },
      dependencies: [],
    });

    // Task 2: Coder viết code (nếu cần)
    if (classification.requiresCode) {
      tasks.push({
        id: `task-${taskId++}`,
        agentId: "coder",
        description: "Viết/sửa code theo yêu cầu",
        status: "pending",
        input: {},
        dependencies: [tasks[0].id],
        classification,
      });
    }

    // Task 3: Reviewer review code (nếu có code)
    if (classification.requiresCode && classification.complexity !== "simple") {
      tasks.push({
        id: `task-${taskId++}`,
        agentId: "reviewer",
        description: "Review code và kiểm tra best practices",
        status: "pending",
        input: {},
        dependencies: [tasks[tasks.length - 1].id],
        classification,
      });
    }

    // Task 4: Tester viết test (nếu cần)
    if (classification.type === "test_generation" || classification.complexity === "complex") {
      tasks.push({
        id: `task-${taskId++}`,
        agentId: "tester",
        description: "Viết test cho code mới/sửa",
        status: "pending",
        input: {},
        dependencies: tasks.length > 1 ? [tasks[tasks.length - 1].id] : [tasks[0].id],
        classification,
      });
    }

    // Task 5: Architect thiết kế (nếu task phức tạp)
    if (classification.type === "architecture_design" || classification.complexity === "complex") {
      tasks.push({
        id: `task-${taskId++}`,
        agentId: "architect",
        description: "Thiết kế kiến trúc và design patterns",
        status: "pending",
        input: {},
        dependencies: [tasks[0].id],
        classification,
      });
    }

    // Task 6: Debugger debug (nếu là task debug)
    if (classification.type === "debug") {
      tasks.push({
        id: `task-${taskId++}`,
        agentId: "debugger",
        description: "Phân tích và fix lỗi",
        status: "pending",
        input: {},
        dependencies: [tasks[0].id],
        classification,
      });
    }

    // Task 7: Deployer deploy (nếu là task deploy)
    if (classification.type === "deploy") {
      tasks.push({
        id: `task-${taskId++}`,
        agentId: "deployer",
        description: "Triển khai và setup environment",
        status: "pending",
        input: {},
        dependencies: tasks.length > 1 ? [tasks[tasks.length - 1].id] : [tasks[0].id],
        classification,
      });
    }

    // Task 8: Documenter viết tài liệu (nếu cần)
    if (classification.type === "documentation" || classification.complexity === "complex") {
      tasks.push({
        id: `task-${taskId++}`,
        agentId: "documenter",
        description: "Viết tài liệu và comments",
        status: "pending",
        input: {},
        dependencies: tasks.length > 1 ? [tasks[tasks.length - 1].id] : [tasks[0].id],
        classification,
      });
    }

    const plan: OrchestratorPlan = {
      id: `plan-${Date.now()}`,
      tasks,
      estimatedDuration: this.estimateDuration(tasks, classification),
      estimatedCost: this.estimateCost(tasks, classification),
      requiresApproval: classification.priority === "high" || classification.complexity === "complex",
    };

    this.executionHistory.set(plan.id, plan);
    return plan;
  }

  async executePlan(
    plan: OrchestratorPlan,
    onProgress?: (task: AgentTask) => void,
  ): Promise<{ completed: AgentTask[]; failed: AgentTask[] }> {
    const completed: AgentTask[] = [];
    const failed: AgentTask[] = [];
    const taskMap = new Map(plan.tasks.map((t) => [t.id, t]));

    // Execute tasks in dependency order
    for (const task of plan.tasks) {
      // Check if dependencies are completed
      const dependencies = task.dependencies.map((depId) => taskMap.get(depId));
      const allDepsCompleted = dependencies.every(
        (dep) => dep && dep.status === "completed",
      );

      if (!allDepsCompleted) {
        task.status = "failed";
        task.error = "Dependencies not completed";
        failed.push(task);
        continue;
      }

      // Execute task
      task.status = "in_progress";
      task.startedAt = new Date();
      onProgress?.(task);

      try {
        const result = await this.executeTask(task);
        task.output = result;
        task.status = "completed";
        task.completedAt = new Date();
        completed.push(task);
        onProgress?.(task);
      } catch (error: any) {
        task.status = "failed";
        task.error = error.message;
        failed.push(task);
        onProgress?.(task);
      }
    }

    return { completed, failed };
  }

  private async executeTask(task: AgentTask): Promise<any> {
    const agent = this.agents.get(task.agentId);
    if (!agent) {
      throw new Error(`Agent ${task.agentId} not found`);
    }

    // Build AI request for the agent
    const request: AIRequest = {
      model: "gpt-4o-mini", // Default, will be routed by ModelRouter
      messages: [
        {
          role: "system",
          content: `Bạn là ${agent.name} (${agent.role}). ${agent.description}.`,
        },
        {
          role: "user",
          content: this.buildTaskPrompt(task, agent),
        },
      ],
      temperature: 0.7,
    };

    // Use classification from task, or fallback to default
    const classification: TaskClassification = task.classification || {
      type: "code_generation",
      priority: "medium",
      complexity: "moderate",
      requiresCode: true,
      requiresReasoning: true,
      requiresVision: false,
      requiresTools: true,
      estimatedTokens: 2000,
      recommendedModel: "gpt-4o-mini",
      fallbackModels: ["claude-3-5-sonnet-20241022"],
    };

    const result: RouterResult = await this.router.route(request, classification);
    return {
      response: result.response,
      modelUsed: result.modelUsed,
      cost: result.totalCost,
    };
  }

  private buildTaskPrompt(task: AgentTask, agent: Agent): string {
    return `Task: ${task.description}

Input: ${JSON.stringify(task.input, null, 2)}

Vui lòng thực hiện task này với vai trò ${agent.name}. 
Trả về kết quả dưới dạng JSON với các field cần thiết.`;
  }

  private estimateDuration(tasks: AgentTask[], classification: TaskClassification): number {
    // Base estimate: 30 seconds per task
    let total = tasks.length * 30;

    // Adjust by complexity
    if (classification.complexity === "complex") total *= 2;
    else if (classification.complexity === "moderate") total *= 1.5;

    return total;
  }

  private estimateCost(tasks: AgentTask[], classification: TaskClassification): number {
    // Base estimate: $0.01 per task
    let total = tasks.length * 0.01;

    // Adjust by complexity
    if (classification.complexity === "complex") total *= 3;
    else if (classification.complexity === "moderate") total *= 1.5;

    return total;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getExecutionHistory(): OrchestratorPlan[] {
    return Array.from(this.executionHistory.values());
  }
}

// Factory function for singleton initialization
let agentOrchestratorInstance: AgentOrchestrator | null = null;

export function initAgentOrchestrator(router: ModelRouter): AgentOrchestrator {
  if (!agentOrchestratorInstance) {
    agentOrchestratorInstance = new AgentOrchestrator(router);
  }
  return agentOrchestratorInstance;
}

export function getAgentOrchestrator(): AgentOrchestrator | null {
  return agentOrchestratorInstance;
}
