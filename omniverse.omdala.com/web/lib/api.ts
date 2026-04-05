/**
 * Omniverse API client
 * All requests go to /v2/omniverse/* on the backend Worker.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";
const API_PREFIX = `${BASE_URL}/v2/omniverse`;

type RequestOptions = {
  token?: string | null;
  body?: unknown;
  method?: string;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { token, body, method } = opts;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_PREFIX}${path}`, {
    method: method ?? (body ? "POST" : "GET"),
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function login(email: string, password: string) {
  return request<{ accessToken: string; user: User }>("/auth/login", {
    body: { email, password },
  });
}

export function signup(email: string, password: string, name: string) {
  return request<{ accessToken: string; user: User }>("/auth/signup", {
    body: { email, password, name },
  });
}

// ── Properties (Homes) ────────────────────────────────────────────────────────

export function getProperties(token: string, ownerUserId?: string) {
  const qs = ownerUserId ? `?ownerUserId=${ownerUserId}` : "";
  return request<{ properties: Property[] }>(`/properties${qs}`, { token });
}

export function getProperty(token: string, propertyId: string) {
  return request<{ property: Property }>(`/properties/${propertyId}`, {
    token,
  });
}

export function createProperty(token: string, data: CreatePropertyInput) {
  return request<{ property: Property }>("/properties", { token, body: data });
}

export function deleteProperty(token: string, propertyId: string) {
  return request<{ success: boolean }>(`/properties/${propertyId}`, {
    token,
    method: "DELETE",
  });
}

// ── Workspaces ────────────────────────────────────────────────────────────────

export function getWorkspace(token: string, workspaceId: string) {
  return request<{ workspace: Workspace }>(`/workspaces/${workspaceId}`, {
    token,
  });
}

export function getWorkspaceState(token: string, workspaceId: string) {
  return request<{ state: RoomStateMap }>(`/workspaces/${workspaceId}/state`, {
    token,
  });
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

export function getRooms(token: string, workspaceId: string) {
  return request<{ rooms: Room[] }>(`/workspaces/${workspaceId}/rooms`, {
    token,
  });
}

export function createRoom(
  token: string,
  workspaceId: string,
  data: CreateRoomInput,
) {
  return request<{ room: Room }>(`/workspaces/${workspaceId}/rooms`, {
    token,
    body: data,
  });
}

export function deleteRoom(token: string, workspaceId: string, roomId: string) {
  return request<{ success: boolean }>(
    `/workspaces/${workspaceId}/rooms/${roomId}`,
    {
      token,
      method: "DELETE",
    },
  );
}

// ── Devices ───────────────────────────────────────────────────────────────────

export function getDevices(
  token: string,
  workspaceId: string,
  roomId?: string,
) {
  const qs = roomId ? `?roomId=${roomId}` : "";
  return request<{ devices: Device[] }>(
    `/workspaces/${workspaceId}/devices${qs}`,
    { token },
  );
}

export function getDevice(
  token: string,
  workspaceId: string,
  deviceId: string,
) {
  return request<{ device: Device }>(
    `/workspaces/${workspaceId}/devices/${deviceId}`,
    { token },
  );
}

export function getDeviceState(
  token: string,
  workspaceId: string,
  deviceId: string,
) {
  return request<{ state: DeviceState }>(
    `/workspaces/${workspaceId}/devices/${deviceId}/state`,
    {
      token,
    },
  );
}

export function setDeviceState(
  token: string,
  workspaceId: string,
  deviceId: string,
  state: Partial<DeviceState>,
) {
  return request<{ state: DeviceState }>(
    `/workspaces/${workspaceId}/devices/${deviceId}/state`,
    {
      token,
      method: "PUT",
      body: state,
    },
  );
}

export function onboardDevice(
  token: string,
  workspaceId: string,
  data: OnboardDeviceInput,
) {
  return request<{ device: Device }>(`/workspaces/${workspaceId}/devices`, {
    token,
    body: data,
  });
}

export function deleteDevice(
  token: string,
  workspaceId: string,
  deviceId: string,
) {
  return request<{ success: boolean }>(
    `/workspaces/${workspaceId}/devices/${deviceId}`,
    {
      token,
      method: "DELETE",
    },
  );
}

// ── Scenes ────────────────────────────────────────────────────────────────────

export function getScenes(token: string, workspaceId: string) {
  return request<{ scenes: Scene[] }>(`/workspaces/${workspaceId}/scenes`, {
    token,
  });
}

export function createScene(
  token: string,
  workspaceId: string,
  data: CreateSceneInput,
) {
  return request<{ scene: Scene }>(`/workspaces/${workspaceId}/scenes`, {
    token,
    body: data,
  });
}

export function activateScene(
  token: string,
  workspaceId: string,
  sceneId: string,
) {
  return request<{ success: boolean }>(
    `/workspaces/${workspaceId}/scenes/${sceneId}/activate`,
    {
      token,
      method: "POST",
    },
  );
}

export function deleteScene(
  token: string,
  workspaceId: string,
  sceneId: string,
) {
  return request<{ success: boolean }>(
    `/workspaces/${workspaceId}/scenes/${sceneId}`,
    {
      token,
      method: "DELETE",
    },
  );
}

// ── Automations ───────────────────────────────────────────────────────────────

export function getAutomations(token: string, workspaceId: string) {
  return request<{ automations: Automation[] }>(
    `/workspaces/${workspaceId}/automations`,
    { token },
  );
}

export function createAutomation(
  token: string,
  workspaceId: string,
  data: CreateAutomationInput,
) {
  return request<{ automation: Automation }>(
    `/workspaces/${workspaceId}/automations`,
    {
      token,
      body: data,
    },
  );
}

export function runAutomation(
  token: string,
  workspaceId: string,
  automationId: string,
) {
  return request<{ success: boolean }>(
    `/workspaces/${workspaceId}/automations/${automationId}/run`,
    { token, method: "POST" },
  );
}

export function deleteAutomation(
  token: string,
  workspaceId: string,
  automationId: string,
) {
  return request<{ success: boolean }>(
    `/workspaces/${workspaceId}/automations/${automationId}`,
    { token, method: "DELETE" },
  );
}

// ── Events / Activity ─────────────────────────────────────────────────────────

export function getEvents(token: string, workspaceId: string) {
  return request<{ events: OmniverseEvent[] }>(
    `/workspaces/${workspaceId}/events`,
    { token },
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  name?: string;
};

export type Property = {
  id: string;
  name: string;
  address?: string;
  type?: string;
  workspaceId: string;
  ownerUserId: string;
  createdAt?: string;
};

export type Workspace = {
  id: string;
  name: string;
  propertyId: string;
};

export type Room = {
  id: string;
  name: string;
  workspaceId: string;
  deviceCount?: number;
};

export type Device = {
  id: string;
  name: string;
  type: string;
  roomId?: string;
  workspaceId: string;
  status?: "online" | "offline";
  state?: DeviceState;
};

export type DeviceState = {
  power?: boolean;
  brightness?: number;
  color?: string;
  temperature?: number;
  locked?: boolean;
  [key: string]: unknown;
};

export type RoomStateMap = Record<string, DeviceState>;

export type Scene = {
  id: string;
  name: string;
  workspaceId: string;
  actions?: SceneAction[];
};

export type SceneAction = {
  deviceId: string;
  state: Partial<DeviceState>;
};

export type Automation = {
  id: string;
  name: string;
  workspaceId: string;
  trigger?: AutomationTrigger;
  actions?: SceneAction[];
  enabled?: boolean;
};

export type AutomationTrigger = {
  type: "time" | "sensor" | "manual";
  value?: string;
};

export type OmniverseEvent = {
  id: string;
  workspaceId: string;
  type: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type CreatePropertyInput = {
  name: string;
  address?: string;
  type?: string;
  ownerUserId: string;
};

export type CreateRoomInput = {
  name: string;
};

export type OnboardDeviceInput = {
  name: string;
  type: string;
  roomId?: string;
  externalId?: string;
};

export type CreateSceneInput = {
  name: string;
  actions: SceneAction[];
};

export type CreateAutomationInput = {
  name: string;
  trigger: AutomationTrigger;
  actions: SceneAction[];
};
