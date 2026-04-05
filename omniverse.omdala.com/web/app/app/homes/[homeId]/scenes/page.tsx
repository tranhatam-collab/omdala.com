"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getProperty,
  getScenes,
  createScene,
  activateScene,
  deleteScene,
  getDevices,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Scene, SceneAction, Device } from "@/lib/api";

export default function ScenesPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = use(params);
  const { token } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [sceneName, setSceneName] = useState("");
  const [activating, setActivating] = useState<string | null>(null);

  const { data: propData } = useQuery({
    queryKey: ["property", homeId],
    queryFn: () => getProperty(token!, homeId),
    enabled: !!token,
  });
  const workspaceId = propData?.property?.workspaceId;

  const { data: scenesData, isLoading } = useQuery({
    queryKey: ["scenes", workspaceId],
    queryFn: () => getScenes(token!, workspaceId!),
    enabled: !!token && !!workspaceId,
  });

  const { data: devicesData } = useQuery({
    queryKey: ["devices", workspaceId],
    queryFn: () => getDevices(token!, workspaceId!),
    enabled: !!token && !!workspaceId,
  });

  const createMut = useMutation({
    mutationFn: (data: Parameters<typeof createScene>[2]) =>
      createScene(token!, workspaceId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scenes", workspaceId] });
      setShowCreate(false);
      setSceneName("");
      toast.success("Scene created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteScene(token!, workspaceId!, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["scenes", workspaceId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleActivate(scene: Scene) {
    if (!workspaceId) return;
    setActivating(scene.id);
    try {
      await activateScene(token!, workspaceId, scene.id);
      toast.success(`"${scene.name}" activated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setActivating(null);
    }
  }

  const scenes: Scene[] = scenesData?.scenes ?? [];
  const devices: Device[] = devicesData?.devices ?? [];

  const PRESET_SCENES = [
    { name: "Good Morning", actions: [] },
    { name: "Movie Time", actions: [] },
    { name: "Goodnight", actions: [] },
    { name: "Away Mode", actions: [] },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Scenes</h1>
          <p className="text-gray-400 text-sm mt-1">
            One-tap control for common device configurations.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Create scene
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-5">
              Create Scene
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMut.mutate({ name: sceneName, actions: [] });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Scene name *
                </label>
                <input
                  required
                  autoFocus
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  placeholder="Movie Time"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setSceneName("");
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-2xl h-28"
            />
          ))}
        </div>
      )}

      {/* Preset suggestions (shown if no scenes yet) */}
      {!isLoading && scenes.length === 0 && (
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-4">
            Quick start with preset scenes:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESET_SCENES.map((ps) => (
              <button
                key={ps.name}
                onClick={() =>
                  createMut.mutate({ name: ps.name, actions: ps.actions })
                }
                className="bg-gray-900 border border-gray-700 border-dashed rounded-2xl p-4 text-sm text-gray-400 hover:border-indigo-600 hover:text-white transition-colors text-center"
              >
                <div className="text-2xl mb-2">
                  {ps.name === "Good Morning"
                    ? "🌅"
                    : ps.name === "Movie Time"
                      ? "🎬"
                      : ps.name === "Goodnight"
                        ? "🌙"
                        : "🚪"}
                </div>
                {ps.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scenes grid */}
      {scenes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">
                  {scene.name.toLowerCase().includes("morning")
                    ? "🌅"
                    : scene.name.toLowerCase().includes("movie")
                      ? "🎬"
                      : scene.name.toLowerCase().includes("night") ||
                          scene.name.toLowerCase().includes("sleep")
                        ? "🌙"
                        : scene.name.toLowerCase().includes("away")
                          ? "🚪"
                          : "✨"}
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete scene "${scene.name}"?`))
                      deleteMut.mutate(scene.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition-all"
                >
                  Delete
                </button>
              </div>
              <h3 className="font-semibold text-white mb-1">{scene.name}</h3>
              <p className="text-xs text-gray-500 mb-4">
                {scene.actions?.length
                  ? `${scene.actions.length} device${scene.actions.length !== 1 ? "s" : ""}`
                  : "No actions configured"}
              </p>
              <button
                onClick={() => handleActivate(scene)}
                disabled={activating === scene.id}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
              >
                {activating === scene.id ? "Activating…" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
