"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getProperty,
  getAutomations,
  createAutomation,
  runAutomation,
  deleteAutomation,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Automation } from "@/lib/api";

export default function AutomationsPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = use(params);
  const { token } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<"time" | "sensor" | "manual">(
    "time",
  );
  const [triggerValue, setTriggerValue] = useState("07:00");
  const [running, setRunning] = useState<string | null>(null);

  const { data: propData } = useQuery({
    queryKey: ["property", homeId],
    queryFn: () => getProperty(token!, homeId),
    enabled: !!token,
  });
  const workspaceId = propData?.property?.workspaceId;

  const { data, isLoading } = useQuery({
    queryKey: ["automations", workspaceId],
    queryFn: () => getAutomations(token!, workspaceId!),
    enabled: !!token && !!workspaceId,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createAutomation(token!, workspaceId!, {
        name,
        trigger: { type: triggerType, value: triggerValue },
        actions: [],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations", workspaceId] });
      setShowCreate(false);
      setName("");
      toast.success("Automation created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAutomation(token!, workspaceId!, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["automations", workspaceId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleRun(automation: Automation) {
    if (!workspaceId) return;
    setRunning(automation.id);
    try {
      await runAutomation(token!, workspaceId, automation.id);
      toast.success(`"${automation.name}" ran successfully`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setRunning(null);
    }
  }

  const automations: Automation[] = data?.automations ?? [];

  function triggerLabel(a: Automation) {
    if (!a.trigger) return "Manual";
    if (a.trigger.type === "time") return `Daily at ${a.trigger.value ?? "--"}`;
    if (a.trigger.type === "sensor")
      return `Sensor: ${a.trigger.value ?? "--"}`;
    return "Manual trigger";
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Automations</h1>
          <p className="text-gray-400 text-sm mt-1">
            Automate your space based on time, sensors, or custom triggers.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Create automation
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-5">
              Create Automation
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMut.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Name *
                </label>
                <input
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Wake up lights"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Trigger type
                </label>
                <select
                  value={triggerType}
                  onChange={(e) =>
                    setTriggerType(e.target.value as typeof triggerType)
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="time">Time (schedule)</option>
                  <option value="sensor">Sensor</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              {triggerType === "time" && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
              {triggerType === "sensor" && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">
                    Sensor event
                  </label>
                  <input
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                    placeholder="motion_detected"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setName("");
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl"
                >
                  {createMut.isPending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-2xl h-20"
            />
          ))}
        </div>
      )}

      {!isLoading && automations.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No automations yet
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Set up automations to make your space run itself.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Create Automation
          </button>
        </div>
      )}

      {automations.length > 0 && (
        <div className="space-y-3">
          {automations.map((a) => (
            <div
              key={a.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 flex items-center gap-4 hover:border-gray-600 transition-colors group"
            >
              <div className="text-2xl">
                {a.trigger?.type === "time"
                  ? "⏰"
                  : a.trigger?.type === "sensor"
                    ? "📡"
                    : "▶️"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white">{a.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {triggerLabel(a)}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => handleRun(a)}
                  disabled={running === a.id}
                  className="text-xs bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  {running === a.id ? "Running…" : "Run now"}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${a.name}"?`)) deleteMut.mutate(a.id);
                  }}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
