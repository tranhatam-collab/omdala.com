// ─── useProjectTracker — Quản lý kế hoạch & audit nhiều dự án ────────────

export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  aiModel?: string;
  startedAt?: number;
  completedAt?: number;
  estimatedHours?: number;
  actualHours?: number;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  deadline?: number;
  completedAt?: number;
  tasks: string[]; // task ids
}

export interface ProjectPlan {
  id: string;
  name: string;
  path: string;
  type: string;
  createdAt: number;
  updatedAt: number;
  status: "planning" | "active" | "completed" | "archived";
  tasks: Task[];
  milestones: Milestone[];
  aiModelUsed: string;
  totalEstimatedHours: number;
  notes?: string;
}

export interface AuditEntry {
  id: string;
  projectId: string;
  timestamp: number;
  action: "task_created" | "task_started" | "task_completed" | "task_blocked" | "milestone_reached" | "model_switched" | "plan_updated" | "audit_full";
  details: string;
  aiModel?: string;
  agentId?: string;
  beforeState?: string;
  afterState?: string;
}

const PLANS_KEY = "omcode:project:plans";
const AUDIT_KEY = "omcode:project:audit";

export function loadAllPlans(): ProjectPlan[] {
  try {
    return JSON.parse(localStorage.getItem(PLANS_KEY) || "[]");
  } catch { return []; }
}

export function savePlans(plans: ProjectPlan[]) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function getOrCreatePlan(projectPath: string, projectName: string, projectType: string, aiModel: string): ProjectPlan {
  const plans = loadAllPlans();
  let plan = plans.find((p) => p.path === projectPath);
  if (!plan) {
    plan = {
      id: `proj-${Date.now()}`,
      name: projectName,
      path: projectPath,
      type: projectType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "active",
      tasks: generateDefaultTasks(projectType),
      milestones: generateDefaultMilestones(),
      aiModelUsed: aiModel,
      totalEstimatedHours: 0,
    };
    plans.push(plan);
    savePlans(plans);
    recordAudit(plan.id, "plan_updated", `Project plan created for ${projectName}`, aiModel);
  }
  return plan;
}

export function updatePlan(plan: ProjectPlan) {
  const plans = loadAllPlans();
  const idx = plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    plan.updatedAt = Date.now();
    plans[idx] = plan;
    savePlans(plans);
  }
}

export function addTask(planId: string, task: Omit<Task, "id">) {
  const plans = loadAllPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return;
  const newTask: Task = { ...task, id: `task-${Date.now()}` };
  plan.tasks.push(newTask);
  plan.updatedAt = Date.now();
  savePlans(plans);
  recordAudit(planId, "task_created", `Task created: ${newTask.title}`, newTask.aiModel);
}

export function updateTaskStatus(planId: string, taskId: string, status: TaskStatus, aiModel?: string) {
  const plans = loadAllPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return;
  const task = plan.tasks.find((t) => t.id === taskId);
  if (!task) return;
  const oldStatus = task.status;
  task.status = status;
  if (status === "in-progress" && !task.startedAt) task.startedAt = Date.now();
  if (status === "done") task.completedAt = Date.now();
  plan.updatedAt = Date.now();
  savePlans(plans);
  const actionMap: Record<TaskStatus, string> = { "todo": "task_created", "in-progress": "task_started", "done": "task_completed", "blocked": "task_blocked" };
  recordAudit(planId, actionMap[status] as any, `Task "${task.title}" moved from ${oldStatus} to ${status}`, aiModel);
}

export function getCompletionPercent(plan: ProjectPlan): number {
  if (!plan.tasks.length) return 0;
  const done = plan.tasks.filter((t) => t.status === "done").length;
  return Math.round((done / plan.tasks.length) * 100);
}

export function getTaskBreakdown(plan: ProjectPlan) {
  return {
    total: plan.tasks.length,
    todo: plan.tasks.filter((t) => t.status === "todo").length,
    inProgress: plan.tasks.filter((t) => t.status === "in-progress").length,
    done: plan.tasks.filter((t) => t.status === "done").length,
    blocked: plan.tasks.filter((t) => t.status === "blocked").length,
  };
}

function generateDefaultTasks(type: string): Task[] {
  const base: Task[] = [
    { id: "t-1", title: "Project setup & initialization", description: "Create repo, configure tooling", status: "done", category: "Setup", priority: "high" },
    { id: "t-2", title: "Architecture design", description: "Define system architecture & data flow", status: "todo", category: "Design", priority: "critical" },
    { id: "t-3", title: "Core implementation", description: "Build main features & business logic", status: "todo", category: "Development", priority: "critical" },
    { id: "t-4", title: "Testing & QA", description: "Unit tests, integration tests, E2E", status: "todo", category: "Testing", priority: "high" },
    { id: "t-5", title: "Documentation", description: "API docs, user guide, README", status: "todo", category: "Docs", priority: "medium" },
    { id: "t-6", title: "Deployment & release", description: "CI/CD, staging, production", status: "todo", category: "DevOps", priority: "high" },
  ];
  if (type === "react" || type === "nextjs") {
    base.push({ id: "t-7", title: "Component library", description: "Build reusable UI components", status: "todo", category: "Frontend", priority: "medium" });
    base.push({ id: "t-8", title: "State management", description: "Redux/Zustand/Context setup", status: "todo", category: "Frontend", priority: "high" });
  }
  if (type === "node") {
    base.push({ id: "t-7", title: "API endpoints", description: "REST/GraphQL endpoints", status: "todo", category: "Backend", priority: "critical" });
    base.push({ id: "t-8", title: "Database schema", description: "Migrations, models, seeds", status: "todo", category: "Backend", priority: "critical" });
  }
  return base;
}

function generateDefaultMilestones(): Milestone[] {
  return [
    { id: "ms-1", title: "MVP Complete", description: "Core features working", tasks: ["t-1", "t-2", "t-3"] },
    { id: "ms-2", title: "Beta Ready", description: "Tested and documented", tasks: ["t-4", "t-5"] },
    { id: "ms-3", title: "Production Launch", description: "Deployed and stable", tasks: ["t-6"] },
  ];
}

// ─── Audit Log ────────────────────────────────────────────────────────────

export function getAuditLog(projectId?: string): AuditEntry[] {
  try {
    const all: AuditEntry[] = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
    return projectId ? all.filter((a) => a.projectId === projectId) : all;
  } catch { return []; }
}

export function recordAudit(
  projectId: string,
  action: AuditEntry["action"],
  details: string,
  aiModel?: string,
  beforeState?: string,
  afterState?: string
) {
  try {
    const all: AuditEntry[] = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
    all.push({
      id: `audit-${Date.now()}`,
      projectId,
      timestamp: Date.now(),
      action,
      details,
      aiModel,
      beforeState,
      afterState,
    });
    localStorage.setItem(AUDIT_KEY, JSON.stringify(all.slice(-2000)));
  } catch {}
}

export function generateAutoReport(projectId: string): string {
  const plan = loadAllPlans().find((p) => p.id === projectId);
  if (!plan) return "Project not found";
  const audit = getAuditLog(projectId);
  const breakdown = getTaskBreakdown(plan);
  const pct = getCompletionPercent(plan);

  const lines: string[] = [];
  lines.push(`# 📊 Auto Report: ${plan.name}`);
  lines.push(`**Status:** ${plan.status} | **Completion:** ${pct}% | **Model:** ${plan.aiModelUsed}`);
  lines.push(`**Tasks:** ${breakdown.total} total | ✅ ${breakdown.done} done | 🔄 ${breakdown.inProgress} in-progress | 📋 ${breakdown.todo} todo | 🚫 ${breakdown.blocked} blocked`);
  lines.push(`**Milestones:**`);
  for (const ms of plan.milestones) {
    const msTasks = plan.tasks.filter((t) => ms.tasks.includes(t.id));
    const msDone = msTasks.filter((t) => t.status === "done").length;
    lines.push(`  - ${ms.title}: ${msDone}/${msTasks.length} tasks`);
  }
  lines.push(`**Recent Activity:**`);
  for (const entry of audit.slice(-10).reverse()) {
    lines.push(`  - ${new Date(entry.timestamp).toLocaleString()}: ${entry.action} — ${entry.details}${entry.aiModel ? ` [${entry.aiModel}]` : ""}`);
  }
  return lines.join("\n");
}
