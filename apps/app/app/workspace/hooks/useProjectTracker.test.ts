import { describe, it, expect, beforeEach } from "vitest";
import {
  loadAllPlans,
  savePlans,
  getOrCreatePlan,
  updatePlan,
  addTask,
  updateTaskStatus,
  getCompletionPercent,
  getTaskBreakdown,
  getAuditLog,
  recordAudit,
  generateAutoReport,
  type ProjectPlan,
} from "./useProjectTracker";

describe("useProjectTracker", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("loadAllPlans / savePlans", () => {
    it("returns empty array when nothing saved", () => {
      expect(loadAllPlans()).toEqual([]);
    });

    it("round-trips plans through localStorage", () => {
      const plan: ProjectPlan = {
        id: "p1",
        name: "Test",
        path: "test",
        type: "react",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "active",
        tasks: [],
        milestones: [],
        aiModelUsed: "gpt-4",
        totalEstimatedHours: 0,
      };
      savePlans([plan]);
      const loaded = loadAllPlans();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe("Test");
    });
  });

  describe("getOrCreatePlan", () => {
    it("returns null when projectKey is null", () => {
      expect(getOrCreatePlan(null, "X", "react", "gpt-4")).toBeNull();
    });

    it("creates a new plan with default tasks", () => {
      const plan = getOrCreatePlan("pk-1", "MyApp", "react", "gpt-4");
      expect(plan).not.toBeNull();
      expect(plan!.name).toBe("MyApp");
      expect(plan!.type).toBe("react");
      expect(plan!.tasks.length).toBeGreaterThan(0);
      expect(plan!.milestones.length).toBe(3);
    });

    it("reuses existing plan for same projectKey", () => {
      const first = getOrCreatePlan("pk-2", "App", "node", "claude-3");
      const second = getOrCreatePlan("pk-2", "App", "node", "claude-3");
      expect(first!.id).toBe(second!.id);
      expect(loadAllPlans()).toHaveLength(1);
    });

    it("generates react-specific tasks for react type", () => {
      const plan = getOrCreatePlan("pk-react", "R", "react", "gpt-4");
      const titles = plan!.tasks.map((t) => t.title);
      expect(titles.some((t) => t.includes("Component"))).toBe(true);
      expect(titles.some((t) => t.includes("State management"))).toBe(true);
    });

    it("generates node-specific tasks for node type", () => {
      const plan = getOrCreatePlan("pk-node", "N", "node", "gpt-4");
      const titles = plan!.tasks.map((t) => t.title);
      expect(titles.some((t) => t.includes("API endpoints"))).toBe(true);
      expect(titles.some((t) => t.includes("Database schema"))).toBe(true);
    });
  });

  describe("updatePlan", () => {
    it("updates an existing plan", () => {
      getOrCreatePlan("pk-3", "App", "react", "gpt-4");
      const plans = loadAllPlans();
      const plan = plans[0];
      plan.status = "completed";
      updatePlan(plan);
      const updated = loadAllPlans()[0];
      expect(updated.status).toBe("completed");
      expect(updated.updatedAt).toBeGreaterThanOrEqual(plan.createdAt);
    });
  });

  describe("addTask", () => {
    it("adds a task to an existing plan", () => {
      getOrCreatePlan("pk-4", "App", "react", "gpt-4");
      addTask("pk-4", { title: "New task", status: "todo", category: "Test", priority: "medium" });
      const plan = loadAllPlans().find((p) => p.id === "pk-4")!;
      expect(plan.tasks.some((t) => t.title === "New task")).toBe(true);
    });

    it("silently ignores missing plan", () => {
      expect(() =>
        addTask("missing", { title: "X", status: "todo", category: "X", priority: "low" })
      ).not.toThrow();
    });
  });

  describe("updateTaskStatus", () => {
    it("updates task status and timestamps", () => {
      getOrCreatePlan("pk-5", "App", "react", "gpt-4");
      const plan = loadAllPlans().find((p) => p.id === "pk-5")!;
      const taskId = plan.tasks[0].id;

      updateTaskStatus("pk-5", taskId, "in-progress", "gpt-4");
      let updated = loadAllPlans().find((p) => p.id === "pk-5")!;
      expect(updated.tasks[0].status).toBe("in-progress");
      expect(updated.tasks[0].startedAt).toBeDefined();

      updateTaskStatus("pk-5", taskId, "done", "gpt-4");
      updated = loadAllPlans().find((p) => p.id === "pk-5")!;
      expect(updated.tasks[0].status).toBe("done");
      expect(updated.tasks[0].completedAt).toBeDefined();
    });
  });

  describe("getCompletionPercent", () => {
    it("returns 0 for empty tasks", () => {
      const plan: ProjectPlan = {
        id: "p", name: "P", path: "p", type: "react",
        createdAt: 0, updatedAt: 0, status: "active",
        tasks: [], milestones: [], aiModelUsed: "gpt-4", totalEstimatedHours: 0,
      };
      expect(getCompletionPercent(plan)).toBe(0);
    });

    it("calculates correct percentage", () => {
      const plan: ProjectPlan = {
        id: "p", name: "P", path: "p", type: "react",
        createdAt: 0, updatedAt: 0, status: "active",
        tasks: [
          { id: "a", title: "A", status: "done", category: "X", priority: "low" },
          { id: "b", title: "B", status: "todo", category: "X", priority: "low" },
          { id: "c", title: "C", status: "in-progress", category: "X", priority: "low" },
        ],
        milestones: [], aiModelUsed: "gpt-4", totalEstimatedHours: 0,
      };
      expect(getCompletionPercent(plan)).toBe(33);
    });
  });

  describe("getTaskBreakdown", () => {
    it("counts statuses correctly", () => {
      const plan: ProjectPlan = {
        id: "p", name: "P", path: "p", type: "react",
        createdAt: 0, updatedAt: 0, status: "active",
        tasks: [
          { id: "a", title: "A", status: "done", category: "X", priority: "low" },
          { id: "b", title: "B", status: "todo", category: "X", priority: "low" },
          { id: "c", title: "C", status: "blocked", category: "X", priority: "low" },
          { id: "d", title: "D", status: "in-progress", category: "X", priority: "low" },
        ],
        milestones: [], aiModelUsed: "gpt-4", totalEstimatedHours: 0,
      };
      const b = getTaskBreakdown(plan);
      expect(b.total).toBe(4);
      expect(b.done).toBe(1);
      expect(b.todo).toBe(1);
      expect(b.blocked).toBe(1);
      expect(b.inProgress).toBe(1);
    });
  });

  describe("recordAudit / getAuditLog", () => {
    it("records and retrieves audit entries", () => {
      recordAudit("p1", "task_created", "Created task X", "gpt-4");
      const logs = getAuditLog("p1");
      expect(logs).toHaveLength(1);
      expect(logs[0].projectId).toBe("p1");
      expect(logs[0].action).toBe("task_created");
    });

    it("filters by projectId", () => {
      recordAudit("p1", "task_created", "X", "gpt-4");
      recordAudit("p2", "task_completed", "Y", "claude-3");
      expect(getAuditLog("p1")).toHaveLength(1);
      expect(getAuditLog("p2")).toHaveLength(1);
      expect(getAuditLog()).toHaveLength(2);
    });

    it("keeps only last 2000 entries", () => {
      // O(N²) due to recordAudit re-serializing the full array each call;
      // raise timeout from default 5s to 15s rather than touch production code.
      for (let i = 0; i < 2100; i++) {
        recordAudit("p1", "plan_updated", `entry ${i}`, "gpt-4");
      }
      expect(getAuditLog("p1")).toHaveLength(2000);
    }, 15000);
  });

  describe("generateAutoReport", () => {
    it("generates report for existing project", () => {
      getOrCreatePlan("pk-report", "ReportApp", "react", "gpt-4");
      const report = generateAutoReport("pk-report");
      expect(report).toContain("ReportApp");
      expect(report).toContain("Completion:");
      expect(report).toContain("Milestones:");
      expect(report).toContain("Recent Activity:");
    });

    it("returns not-found message for missing project", () => {
      expect(generateAutoReport("missing")).toBe("Project not found");
    });
  });
});
