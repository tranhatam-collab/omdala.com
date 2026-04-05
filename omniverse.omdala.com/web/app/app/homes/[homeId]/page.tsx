"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getProperty,
  getRooms,
  getDevices,
  createRoom,
  onboardDevice,
  deleteRoom,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { DeviceControlPanel } from "@/components/devices/DeviceControlPanel";
import type { Device, Room } from "@/lib/api";

export default function HomeDashboardPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = use(params);
  const { token } = useAuthStore();
  const qc = useQueryClient();

  const [selectedRoomId, setSelectedRoomId] = useState<string | "all">("all");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("light");

  const { data: propData } = useQuery({
    queryKey: ["property", homeId],
    queryFn: () => getProperty(token!, homeId),
    enabled: !!token,
  });

  const property = propData?.property;
  const workspaceId = property?.workspaceId;

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms", workspaceId],
    queryFn: () => getRooms(token!, workspaceId!),
    enabled: !!token && !!workspaceId,
  });

  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ["devices", workspaceId, selectedRoomId],
    queryFn: () =>
      getDevices(
        token!,
        workspaceId!,
        selectedRoomId !== "all" ? selectedRoomId : undefined,
      ),
    enabled: !!token && !!workspaceId,
  });

  const createRoomMut = useMutation({
    mutationFn: (name: string) => createRoom(token!, workspaceId!, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", workspaceId] });
      setShowAddRoom(false);
      setRoomName("");
      toast.success("Room created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRoomMut = useMutation({
    mutationFn: (roomId: string) => deleteRoom(token!, workspaceId!, roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", workspaceId] });
      if (selectedRoomId !== "all") setSelectedRoomId("all");
      toast.success("Room deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addDeviceMut = useMutation({
    mutationFn: () =>
      onboardDevice(token!, workspaceId!, {
        name: deviceName,
        type: deviceType,
        roomId: selectedRoomId !== "all" ? selectedRoomId : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["devices", workspaceId] });
      setShowAddDevice(false);
      setDeviceName("");
      toast.success("Device added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rooms: Room[] = roomsData?.rooms ?? [];
  const devices: Device[] = devicesData?.devices ?? [];

  const selectedRoomName =
    selectedRoomId === "all"
      ? "All Devices"
      : (rooms.find((r) => r.id === selectedRoomId)?.name ?? "Room");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Rooms sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-semibold text-white truncate">
            {property?.name ?? "Loading…"}
          </h2>
          {property?.address && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {property.address}
            </p>
          )}
        </div>

        {/* Room list */}
        <div className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setSelectedRoomId("all")}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
              selectedRoomId === "all"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            All Rooms ({devices.length})
          </button>

          {roomsLoading && (
            <div className="space-y-1 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-800 rounded-xl" />
              ))}
            </div>
          )}

          {rooms.map((room) => (
            <div key={room.id} className="group flex items-center gap-1">
              <button
                onClick={() => setSelectedRoomId(room.id)}
                className={`flex-1 text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                  selectedRoomId === room.id
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {room.name}
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete room "${room.name}"?`))
                    deleteRoomMut.mutate(room.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs px-1 transition-all"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add room */}
        <div className="p-3 border-t border-gray-800">
          {showAddRoom ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (roomName.trim()) createRoomMut.mutate(roomName.trim());
              }}
              className="flex gap-2"
            >
              <input
                autoFocus
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={createRoomMut.isPending}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1.5 rounded-lg"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddRoom(false);
                  setRoomName("");
                }}
                className="text-xs text-gray-500 hover:text-white px-1"
              >
                ×
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddRoom(true)}
              className="w-full text-xs text-gray-500 hover:text-indigo-400 transition-colors text-center py-1.5"
            >
              + Add room
            </button>
          )}
        </div>
      </aside>

      {/* Device grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="font-semibold text-white">{selectedRoomName}</h2>
            <p className="text-xs text-gray-500">
              {devices.length} device{devices.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAddDevice(true)}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-colors"
          >
            + Add device
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {devicesLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-900 border border-gray-800 rounded-2xl h-32"
                  />
                ))}
              </div>
            )}

            {!devicesLoading && devices.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-5xl mb-4">🔌</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No devices here
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  {selectedRoomId === "all"
                    ? "Add your first device to get started."
                    : "No devices in this room yet."}
                </p>
                <button
                  onClick={() => setShowAddDevice(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  Add device
                </button>
              </div>
            )}

            {!devicesLoading && devices.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    selected={selectedDevice?.id === device.id}
                    onSelect={(d) =>
                      setSelectedDevice(selectedDevice?.id === d.id ? null : d)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Device control panel */}
          {selectedDevice && workspaceId && (
            <DeviceControlPanel
              device={selectedDevice}
              workspaceId={workspaceId}
              onClose={() => setSelectedDevice(null)}
            />
          )}
        </div>
      </div>

      {/* Add device modal */}
      {showAddDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-white mb-5">
              Add Device
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (deviceName.trim()) addDeviceMut.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Device name *
                </label>
                <input
                  required
                  autoFocus
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Living Room Light"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Type
                </label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="light">Light</option>
                  <option value="thermostat">Thermostat</option>
                  <option value="lock">Lock</option>
                  <option value="plug">Plug</option>
                  <option value="camera">Camera</option>
                  <option value="sensor">Sensor</option>
                  <option value="fan">Fan</option>
                  <option value="speaker">Speaker</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDevice(false);
                    setDeviceName("");
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDeviceMut.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  {addDeviceMut.isPending ? "Adding…" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
