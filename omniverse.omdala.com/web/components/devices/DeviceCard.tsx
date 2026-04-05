"use client";

import type { Device, DeviceState } from "@/lib/api";

const DEVICE_ICONS: Record<string, string> = {
  light: "💡",
  thermostat: "🌡️",
  lock: "🔒",
  plug: "🔌",
  camera: "📷",
  sensor: "📡",
  fan: "💨",
  speaker: "🔊",
  blinds: "🪟",
  default: "📦",
};

function getIcon(type: string) {
  return DEVICE_ICONS[type.toLowerCase()] ?? DEVICE_ICONS.default;
}

type Props = {
  device: Device;
  onSelect: (device: Device) => void;
  selected?: boolean;
};

export function DeviceCard({ device, onSelect, selected }: Props) {
  const state = device.state ?? {};
  const isOn = state.power === true;

  return (
    <button
      onClick={() => onSelect(device)}
      className={`text-left w-full bg-gray-900 border rounded-2xl p-5 transition-all ${
        selected
          ? "border-indigo-500 shadow-md shadow-indigo-900/30"
          : "border-gray-800 hover:border-gray-600"
      } ${device.status === "offline" ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{getIcon(device.type)}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            device.status === "offline"
              ? "bg-gray-800 text-gray-500"
              : isOn
                ? "bg-green-900/50 text-green-400"
                : "bg-gray-800 text-gray-400"
          }`}
        >
          {device.status === "offline" ? "offline" : isOn ? "on" : "off"}
        </span>
      </div>
      <p className="font-medium text-sm text-white truncate">{device.name}</p>
      <p className="text-xs text-gray-500 mt-0.5 capitalize">{device.type}</p>
      {state.brightness !== undefined && (
        <div className="mt-2">
          <div className="w-full bg-gray-800 rounded-full h-1">
            <div
              className="bg-yellow-400 h-1 rounded-full"
              style={{ width: `${state.brightness}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{state.brightness}%</p>
        </div>
      )}
      {state.temperature !== undefined && (
        <p className="text-xs text-blue-400 mt-1">{state.temperature}°F</p>
      )}
    </button>
  );
}
