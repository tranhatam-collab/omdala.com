// ─── ProjectTrackerPanel — Multi-project dashboard & audit ─────────────────
"use client";

import * as React from "react";
import {
  loadAllPlans,
  getOrCreatePlan,
  updateTaskStatus,
  addTask,
  getCompletionPercent,
  getTaskBreakdown,
  getAuditLog,
  generateAutoReport,
  type ProjectPlan,
  type Task,
  type TaskStatus,
} from "../hooks/useProjectTracker";

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "#6b7f99",
  "in-progress": "#f59e0b",
  done: "#4ade80",
  blocked: "#ef4444",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "📋 Todo",
  "in-progress": "🔄 In Progress",
  done: "✅ Done",
  blocked: "🚫 Blocked",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "#6b7f99",
  medium: "#7ef2ff",
  high: "#f59e0b",
  critical: "#ef4444",
};

export function ProjectTrackerPanel({ currentProjectKey, currentProjectName, currentProjectType, currentModel }: {
  currentProjectKey: string | null;
  currentProjectName: string;
  currentProjectType: string;
  currentModel: string;
}) {
  const [plans, setPlans] = React.useState<ProjectPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<TaskStatus | "all">("all");
  const [view, setView] = React.useState<"dashboard" | "tasks" | "audit" | "report">("dashboard");
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskCategory, setNewTaskCategory] = React.useState("Development");
  const [reportCopied, setReportCopied] = React.useState(false);

  React.useEffect(() => {
    setPlans(loadAllPlans());
    const iv = setInterval(() => setPlans(loadAllPlans()), 2000);
    return () => clearInterval(iv);
  }, []);

  // Auto-select current project
  React.useEffect(() => {
    if (currentProjectKey) {
      const plan = getOrCreatePlan(currentProjectKey, currentProjectName, currentProjectType, currentModel);
      if (plan) setSelectedPlanId(plan.id);
    }
  }, [currentProjectKey, currentProjectName, currentProjectType, currentModel]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  function refresh() {
    setPlans(loadAllPlans());
  }

  const filteredTasks = selectedPlan
    ? filterStatus === "all"
      ? selectedPlan.tasks
      : selectedPlan.tasks.filter((t) => t.status === filterStatus)
    : [];

  const totalPct = plans.length
    ? Math.round(plans.reduce((s, p) => s + getCompletionPercent(p), 0) / plans.length)
    : 0;

  return (
    <div style={{ padding: 16, color: "#dbe7f5", fontSize: 12, overflow: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#7ef2ff" }}>📊 Project Tracker</span>
        <span style={{ fontSize: 10, color: "#6b7f99" }}>
          {plans.length} projects · Avg {totalPct}% complete
        </span>
        <span style={{ flex: 1 }} />
        {(["dashboard", "tasks", "audit", "report"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "3px 8px",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.1)",
              background: view === v ? "rgba(126,242,255,0.15)" : "transparent",
              color: view === v ? "#7ef2ff" : "#6b7f99",
              fontSize: 10,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Project selector */}
      <select
        aria-label="Select project"
        value={selectedPlanId || ""}
        onChange={(e) => setSelectedPlanId(e.target.value || null)}
        style={{
          width: "100%",
          marginBottom: 12,
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          padding: "6px 10px",
          color: "#dbe7f5",
          fontSize: 11,
          outline: "none",
        }}
      >
        <option value="">Select a project...</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({getCompletionPercent(p)}%) — {p.status}
          </option>
        ))}
      </select>

      {!selectedPlan && (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7f99" }}>
          Open a project folder to see its plan.
        </div>
      )}

      {selectedPlan && view === "dashboard" && (
        <ProjectDashboard plan={selectedPlan} />
      )}

      {selectedPlan && view === "tasks" && (
        <TasksView
          plan={selectedPlan}
          filteredTasks={filteredTasks}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          newTaskCategory={newTaskCategory}
          setNewTaskCategory={setNewTaskCategory}
          onAddTask={() => {
            if (!newTaskTitle.trim()) return;
            addTask(selectedPlan.id, {
              title: newTaskTitle.trim(),
              status: "todo",
              category: newTaskCategory,
              priority: "medium",
              aiModel: currentModel,
            });
            setNewTaskTitle("");
            refresh();
          }}
          onStatusChange={(taskId, status) => {
            updateTaskStatus(selectedPlan.id, taskId, status, currentModel);
            refresh();
          }}
        />
      )}

      {selectedPlan && view === "audit" && (
        <AuditView planId={selectedPlan.id} />
      )}

      {selectedPlan && view === "report" && (
        <ReportView
          plan={selectedPlan}
          reportCopied={reportCopied}
          onCopy={() => {
            const report = generateAutoReport(selectedPlan.id);
            navigator.clipboard.writeText(report).then(() => {
              setReportCopied(true);
              setTimeout(() => setReportCopied(false), 2000);
            });
          }}
        />
      )}
    </div>
  );
}

function ProjectDashboard({ plan }: { plan: ProjectPlan }) {
  const pct = getCompletionPercent(plan);
  const bd = getTaskBreakdown(plan);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Progress bar */}
      <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#f7fbff" }}>{plan.name}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#7ef2ff" }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: "rgba(0,0,0,0.3)", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: pct === 100 ? "#4ade80" : "linear-gradient(90deg, #7ef2ff, #5cd9ff)",
              borderRadius: 4,
              transition: "width 0.5s",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10, color: "#6b7f99" }}>
          <span>📋 {bd.todo}</span>
          <span>🔄 {bd.inProgress}</span>
          <span>✅ {bd.done}</span>
          <span>🚫 {bd.blocked}</span>
          <span style={{ marginLeft: "auto" }}>Model: {plan.aiModelUsed}</span>
        </div>
      </div>

      {/* Milestones */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#f7fbff" }}>Milestones</span>
        {plan.milestones.map((ms) => {
          const msTasks = plan.tasks.filter((t) => ms.tasks.includes(t.id));
          const msDone = msTasks.filter((t) => t.status === "done").length;
          const msPct = msTasks.length ? Math.round((msDone / msTasks.length) * 100) : 0;
          return (
            <div key={ms.id} style={{ padding: 8, background: "rgba(255,255,255,0.02)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12 }}>{msPct === 100 ? "🏁" : "🎯"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#dbe7f5" }}>{ms.title}</div>
                <div style={{ fontSize: 9, color: "#6b7f99" }}>{ms.description}</div>
              </div>
              <div style={{ width: 60, height: 4, background: "rgba(0,0,0,0.3)", borderRadius: 2 }}>
                <div style={{ width: `${msPct}%`, height: "100%", background: "#7ef2ff", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 10, color: "#7ef2ff", width: 30, textAlign: "right" }}>{msPct}%</span>
            </div>
          );
        })}
      </div>

      {/* Category breakdown */}
      <CategoryBreakdown plan={plan} />
    </div>
  );
}

function CategoryBreakdown({ plan }: { plan: ProjectPlan }) {
  const cats = React.useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const t of plan.tasks) {
      map[t.category] ||= { total: 0, done: 0 };
      map[t.category].total++;
      if (t.status === "done") map[t.category].done++;
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [plan]);

  if (!cats.length) return null;
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#f7fbff", marginBottom: 6, display: "block" }}>By Category</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {cats.map(([cat, data]) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <span style={{ fontSize: 10, color: "#a8b9d0", width: 80 }}>{cat}</span>
            <div style={{ flex: 1, height: 4, background: "rgba(0,0,0,0.3)", borderRadius: 2 }}>
              <div style={{ width: `${data.total ? (data.done / data.total) * 100 : 0}%`, height: "100%", background: "#7ef2ff", borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, color: "#7ef2ff", width: 40, textAlign: "right" }}>
              {data.done}/{data.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksView({
  plan,
  filteredTasks,
  filterStatus,
  setFilterStatus,
  newTaskTitle,
  setNewTaskTitle,
  newTaskCategory,
  setNewTaskCategory,
  onAddTask,
  onStatusChange,
}: {
  plan: ProjectPlan;
  filteredTasks: Task[];
  filterStatus: TaskStatus | "all";
  setFilterStatus: (s: TaskStatus | "all") => void;
  newTaskTitle: string;
  setNewTaskTitle: (v: string) => void;
  newTaskCategory: string;
  setNewTaskCategory: (v: string) => void;
  onAddTask: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const categories = React.useMemo(() => {
    const set = new Set(plan.tasks.map((t) => t.category));
    return ["Setup", "Design", "Development", "Frontend", "Backend", "Testing", "Docs", "DevOps", ...Array.from(set)];
  }, [plan]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Add task */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onAddTask(); }}
          placeholder="New task..."
          style={{
            flex: 1,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            padding: "6px 10px",
            color: "#dbe7f5",
            fontSize: 11,
            outline: "none",
          }}
        />
        <select
          aria-label="Task category"
          value={newTaskCategory}
          onChange={(e) => setNewTaskCategory(e.target.value)}
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            padding: "5px 8px",
            color: "#dbe7f5",
            fontSize: 10,
            outline: "none",
          }}
        >
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={onAddTask}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "none",
            background: "rgba(126,242,255,0.15)",
            color: "#7ef2ff",
            fontSize: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Add
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {(["all", "todo", "in-progress", "done", "blocked"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.06)",
              background: filterStatus === s ? "rgba(126,242,255,0.1)" : "transparent",
              color: filterStatus === s ? "#7ef2ff" : "#6b7f99",
              fontSize: 9,
              cursor: "pointer",
            }}
          >
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {filteredTasks.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              background: t.status === "done" ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${t.status === "done" ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)"}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <select
              aria-label="Task status"
              value={t.status}
              onChange={(e) => onStatusChange(t.id, e.target.value as TaskStatus)}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                padding: "2px 4px",
                color: STATUS_COLOR[t.status],
                fontSize: 9,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="todo">📋</option>
              <option value="in-progress">🔄</option>
              <option value="done">✅</option>
              <option value="blocked">🚫</option>
            </select>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: t.status === "done" ? "#6b7f99" : "#dbe7f5", textDecoration: t.status === "done" ? "line-through" : "none" }}>
                {t.title}
              </div>
              <div style={{ fontSize: 9, color: "#6b7f99", marginTop: 2 }}>
                {t.category} · {t.aiModel && `[${t.aiModel}]`} · {t.priority}
              </div>
            </div>
            <span style={{ fontSize: 9, color: PRIORITY_COLOR[t.priority], padding: "1px 4px", borderRadius: 3, background: `${PRIORITY_COLOR[t.priority]}15` }}>
              {t.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditView({ planId }: { planId: string }) {
  const [audit, setAudit] = React.useState(getAuditLog(planId));
  React.useEffect(() => {
    const iv = setInterval(() => setAudit(getAuditLog(planId)), 3000);
    return () => clearInterval(iv);
  }, [planId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#f7fbff" }}>Audit Log ({audit.length} entries)</span>
      {audit.slice().reverse().map((entry) => (
        <div
          key={entry.id}
          style={{
            padding: "6px 8px",
            borderRadius: 4,
            background: "rgba(255,255,255,0.02)",
            borderLeft: "2px solid rgba(126,242,255,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: "#6b7f99" }}>{new Date(entry.timestamp).toLocaleString()}</span>
            <span style={{ fontSize: 9, color: "#7ef2ff", fontWeight: 600 }}>{entry.action}</span>
            {entry.aiModel && <span style={{ fontSize: 8, color: "#a8b9d0" }}>[{entry.aiModel}]</span>}
          </div>
          <div style={{ fontSize: 10, color: "#dbe7f5" }}>{entry.details}</div>
        </div>
      ))}
      {audit.length === 0 && <div style={{ color: "#6b7f99", textAlign: "center", padding: 20 }}>No audit entries yet.</div>}
    </div>
  );
}

function ReportView({ plan, reportCopied, onCopy }: { plan: ProjectPlan; reportCopied: boolean; onCopy: () => void }) {
  const report = generateAutoReport(plan.id);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#f7fbff" }}>Auto-Generated Report</span>
        <span style={{ flex: 1 }} />
        <button
          onClick={onCopy}
          style={{
            padding: "4px 10px",
            borderRadius: 4,
            border: "1px solid rgba(126,242,255,0.25)",
            background: "rgba(126,242,255,0.1)",
            color: "#7ef2ff",
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          {reportCopied ? "✓ Copied!" : "📋 Copy"}
        </button>
      </div>
      <pre
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          padding: 12,
          fontSize: 10,
          color: "#a8b9d0",
          whiteSpace: "pre-wrap",
          lineHeight: 1.5,
          overflow: "auto",
          maxHeight: 400,
        }}
      >
        {report}
      </pre>
    </div>
  );
}
