"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { setDeviceState } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Device, DeviceState } from "@/lib/api";

type Props = {
  device: Device;
  workspaceId: string;
  onClose: () => void;
};

export function DeviceControlPanel({ device, workspaceId, onClose }: Props) {
  const { token } = useAuthStore();
  const qc = useQueryClient();
  const [state, setState] = useState<DeviceState>(device.state ?? {});

  const mutation = useMutation({
    mutationFn: (newState: Partial<DeviceState>) =>
      setDeviceState(token!, workspaceId, device.id, newState),
    onSuccess: (data) => {
      setState(data.state);
      qc.invalidateQueries({ queryKey: ["devices", workspaceId] });
      toast.success("Device updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function update(patch: Partial<DeviceState>) {
    const next = { ...state, ...patch };
    setState(next);
    mutation.mutate(patch);
  }

  return (
    <div className="bg-gray-900 border-l border-gray-800 w-80 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-800">
        <div>
          <h3 className="font-semibold text-white">{device.name}</h3>
          <p className="text-xs text-gray-500 capitalize">{device.type}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Power toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Power</span>
          <button
            onClick={() => update({ power: !state.power })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              state.power ? "bg-indigo-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                state.power ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Brightness (lights) */}
        {(device.type === "light" || state.brightness !== undefined) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">
                Brightness
              </span>
              <span className="text-xs text-gray-500">
                {state.brightness ?? 100}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={state.brightness ?? 100}
              onChange={(e) =>
                setState((s) => ({ ...s, brightness: Number(e.target.value) }))
              }
              onMouseUp={(e) =>
                update({
                  brightness: Number((e.target as HTMLInputElement).value),
                })
              }
              onTouchEnd={(e) =>
                update({
                  brightness: Number((e.target as HTMLInputElement).value),
                })
              }
              className="w-full accent-indigo-500"
            />
          </div>
        )}

        {/* Temperature (thermostat) */}
        {(device.type === "thermostat" || state.temperature !== undefined) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">
                Temperature
              </span>
              <span className="text-xs text-gray-500">
                {state.temperature ?? 70}°F
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={90}
              value={state.temperature ?? 70}
              onChange={(e) =>
                setState((s) => ({ ...s, temperature: Number(e.target.value) }))
              }
              onMouseUp={(e) =>
                update({
                  temperature: Number((e.target as HTMLInputElement).value),
                })
              }
              onTouchEnd={(e) =>
                update({
                  temperature: Number((e.target as HTMLInputElement).value),
                })
              }
              className="w-full accent-blue-400"
            />
          </div>
        )}

        {/* Lock (lock type) */}
        {device.type === "lock" && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              {state.locked ? "Locked" : "Unlocked"}
            </span>
            <button
              onClick={() => update({ locked: !state.locked })}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                state.locked
                  ? "bg-green-800 text-green-300 hover:bg-red-800 hover:text-red-300"
                  : "bg-red-900/50 text-red-400 hover:bg-green-800 hover:text-green-300"
              }`}
            >
              {state.locked ? "Unlock" : "Lock"}
            </button>
          </div>
        )}

        {/* Color (if supported) */}
        {state.color !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Color
            </label>
            <input
              type="color"
              value={state.color ?? "#ffffff"}
              onChange={(e) =>
                setState((s) => ({ ...s, color: e.target.value }))
              }
              onBlur={(e) => update({ color: e.target.value })}
              className="w-12 h-8 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Status:{" "}
          <span
            className={
              device.status === "offline" ? "text-red-400" : "text-green-400"
            }
          >
            {device.status ?? "online"}
          </span>
          {mutation.isPending && (
            <span className="ml-2 text-indigo-400">Saving…</span>
          )}
        </p>
      </div>
    </div>
  );
}
