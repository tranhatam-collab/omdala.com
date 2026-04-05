"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProperty, getEvents } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { OmniverseEvent } from "@/lib/api";

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function eventIcon(type: string) {
  if (type.includes("device")) return "🔌";
  if (type.includes("scene")) return "🎬";
  if (type.includes("automation")) return "⚡";
  if (type.includes("room")) return "🏠";
  if (type.includes("login") || type.includes("auth")) return "🔐";
  return "📋";
}

function eventColor(type: string) {
  if (type.includes("error") || type.includes("fail")) return "text-red-400";
  if (type.includes("scene") || type.includes("activation"))
    return "text-yellow-400";
  if (type.includes("automation")) return "text-indigo-400";
  return "text-gray-300";
}

export default function ActivityPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = use(params);
  const { token } = useAuthStore();

  const { data: propData } = useQuery({
    queryKey: ["property", homeId],
    queryFn: () => getProperty(token!, homeId),
    enabled: !!token,
  });
  const workspaceId = propData?.property?.workspaceId;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["events", workspaceId],
    queryFn: () => getEvents(token!, workspaceId!),
    enabled: !!token && !!workspaceId,
    refetchInterval: 15_000,
  });

  const events: OmniverseEvent[] = data?.events ?? [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Log</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time events for this home. Auto-refreshes every 15 seconds.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-2xl h-16"
            />
          ))}
        </div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No activity yet
          </h2>
          <p className="text-gray-400 text-sm">
            Events will appear here as you control devices, activate scenes, and
            run automations.
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 flex items-start gap-4 hover:border-gray-700 transition-colors"
            >
              <div className="text-xl mt-0.5 shrink-0">
                {eventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${eventColor(event.type)}`}>
                  {event.type.replace(/_/g, " ")}
                </p>
                {event.payload && Object.keys(event.payload).length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">
                    {JSON.stringify(event.payload)}
                  </p>
                )}
              </div>
              <time className="text-xs text-gray-600 shrink-0 mt-0.5">
                {formatTime(event.createdAt)}
              </time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
