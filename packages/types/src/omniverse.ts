// OMDALA — AI Omniverse Type Definitions
// Domain: Device + Environment + Physical Action Control
// Used by: omniverse.omdala.com (backend, web, mobile)

import type { EntityId, ISODateTimeString, JsonObject } from './index.js';

// ─── App Identity ────────────────────────────────────────────────────────

export type OmniverseAppId = 'omniverse';

export type OmniverseTier = 'free' | 'home_pro' | 'business_space';

export interface OmniverseSubscription {
  userId: EntityId;
  tier: OmniverseTier;
  /** Free: 1 home, HomePro: unlimited, Business: per-user */
  maxHomes: number | null;
  priceMonthly: number;
  stripeSubscriptionId?: string;
  startedAt: ISODateTimeString;
  expiresAt?: ISODateTimeString;
  cancelledAt?: ISODateTimeString;
}

// ─── Home ────────────────────────────────────────────────────────────────

export type HomeType = 'house' | 'apartment' | 'office' | 'venue' | 'hotel' | 'other';

export interface HomeRecord {
  id: EntityId;
  ownerId: EntityId;
  name: string;
  address?: string;
  homeType: HomeType;
  timezone: string;
  floorplanUrl?: string;
  /** Aggregate counts */
  roomCount: number;
  deviceCount: number;
  memberCount: number;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface HomeFormInput {
  name: string;
  address?: string;
  homeType: HomeType;
  timezone?: string;
  floorplanUrl?: string;
}

// ─── Room ────────────────────────────────────────────────────────────────

export type RoomType =
  | 'living_room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'office'
  | 'garage'
  | 'hallway'
  | 'outdoor'
  | 'meeting_room'
  | 'lobby'
  | 'other';

export interface RoomRecord {
  id: EntityId;
  homeId: EntityId;
  name: string;
  roomType: RoomType;
  floor?: number;
  deviceCount: number;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface RoomFormInput {
  homeId: EntityId;
  name: string;
  roomType: RoomType;
  floor?: number;
}

// ─── Device ──────────────────────────────────────────────────────────────

export type DeviceType =
  | 'light'
  | 'thermostat'
  | 'plug'
  | 'lock'
  | 'camera'
  | 'sensor'
  | 'blind'
  | 'speaker'
  | 'switch'
  | 'other';

export type DeviceProtocol = 'wifi' | 'bluetooth' | 'zigbee' | 'zwave' | 'matter' | 'local_api';

export type DeviceStatus = 'online' | 'offline' | 'pairing' | 'error';

export interface DeviceRecord {
  id: EntityId;
  homeId: EntityId;
  roomId?: EntityId;
  name: string;
  deviceType: DeviceType;
  manufacturer: string;
  model?: string;
  protocol: DeviceProtocol;
  status: DeviceStatus;
  /** Whether the device is currently powered on */
  isOn: boolean;
  /** Current device properties (brightness, temperature, color, etc.) */
  properties: DeviceProperties;
  /** Battery level 0-100, null if wired */
  batteryLevel?: number;
  firmwareVersion?: string;
  ipAddress?: string;
  macAddress?: string;
  lastSeenAt?: ISODateTimeString;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface DeviceProperties {
  /** Light: 0-100 */
  brightness?: number;
  /** Light: hex color code */
  color?: string;
  /** Light: color temperature in Kelvin (2700-6500) */
  colorTemp?: number;
  /** Thermostat: target temperature */
  targetTemp?: number;
  /** Thermostat: current temperature */
  currentTemp?: number;
  /** Thermostat: mode */
  thermostatMode?: 'heat' | 'cool' | 'auto' | 'off';
  /** Lock: locked state */
  isLocked?: boolean;
  /** Blind: position 0 (closed) - 100 (open) */
  position?: number;
  /** Speaker: volume 0-100 */
  volume?: number;
  /** Sensor: detected value */
  sensorValue?: number;
  sensorUnit?: string;
  /** Generic key-value for custom properties */
  [key: string]: unknown;
}

export interface DeviceFormInput {
  homeId: EntityId;
  roomId?: EntityId;
  name: string;
  deviceType: DeviceType;
  manufacturer: string;
  model?: string;
  protocol: DeviceProtocol;
}

export interface DeviceControlInput {
  deviceId: EntityId;
  action: 'toggle' | 'set' | 'lock' | 'unlock';
  params?: Partial<DeviceProperties>;
}

export interface DeviceControlResult {
  deviceId: EntityId;
  success: boolean;
  previousState: Partial<DeviceProperties>;
  newState: Partial<DeviceProperties>;
  latencyMs: number;
  error?: string;
}

// ─── Scene ───────────────────────────────────────────────────────────────

export type SceneTriggerType = 'manual' | 'time' | 'presence' | 'sensor';

export type SceneStatus = 'active' | 'disabled' | 'draft';

export interface SceneDeviceAction {
  deviceId: EntityId;
  /** Desired state for this device when scene is executed */
  desiredState: Partial<DeviceProperties> & { isOn?: boolean };
  /** Delay in milliseconds before executing this action */
  delayMs?: number;
}

export interface SceneRecord {
  id: EntityId;
  homeId: EntityId;
  name: string;
  description?: string;
  icon?: string;
  triggerType: SceneTriggerType;
  /** For time triggers: cron expression or time string */
  triggerConfig?: JsonObject;
  actions: SceneDeviceAction[];
  status: SceneStatus;
  /** Execution stats */
  executionCount: number;
  lastExecutedAt?: ISODateTimeString;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface SceneFormInput {
  homeId: EntityId;
  name: string;
  description?: string;
  icon?: string;
  triggerType: SceneTriggerType;
  triggerConfig?: JsonObject;
  actions: SceneDeviceAction[];
}

export interface SceneExecutionResult {
  sceneId: EntityId;
  success: boolean;
  /** Per-device results */
  deviceResults: DeviceControlResult[];
  totalDevices: number;
  successCount: number;
  failCount: number;
  totalLatencyMs: number;
  executedAt: ISODateTimeString;
}

// ─── Automation ──────────────────────────────────────────────────────────

export type AutomationTriggerType = 'time' | 'presence' | 'sensor' | 'device_state';

export type AutomationStatus = 'active' | 'disabled' | 'draft';

export interface AutomationTrigger {
  type: AutomationTriggerType;
  /** Time: cron expression, e.g., "0 7 * * 1-5" (7am weekdays) */
  schedule?: string;
  /** Presence: arrive/leave */
  presenceEvent?: 'arrive' | 'leave';
  /** Sensor: device ID + threshold */
  sensorDeviceId?: EntityId;
  sensorCondition?: 'above' | 'below' | 'equals';
  sensorThreshold?: number;
  /** Device state: trigger when specific device changes */
  watchDeviceId?: EntityId;
  watchProperty?: string;
  watchValue?: unknown;
}

export interface AutomationRecord {
  id: EntityId;
  homeId: EntityId;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  /** Actions = same as scene actions */
  actions: SceneDeviceAction[];
  status: AutomationStatus;
  /** Execution stats */
  triggerCount: number;
  lastTriggeredAt?: ISODateTimeString;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface AutomationFormInput {
  homeId: EntityId;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  actions: SceneDeviceAction[];
}

// ─── Activity Log ────────────────────────────────────────────────────────

export type ActivityAction =
  | 'device_controlled'
  | 'scene_executed'
  | 'automation_triggered'
  | 'device_added'
  | 'device_removed'
  | 'member_invited'
  | 'member_joined'
  | 'settings_changed';

export interface ActivityLogEntry {
  id: EntityId;
  homeId: EntityId;
  actorId?: EntityId;
  actorName?: string;
  action: ActivityAction;
  targetType: 'device' | 'scene' | 'automation' | 'room' | 'home' | 'member';
  targetId: EntityId;
  targetName: string;
  description: string;
  metadata?: JsonObject;
  occurredAt: ISODateTimeString;
}

// ─── Home Members ────────────────────────────────────────────────────────

export type HomeMemberRole = 'owner' | 'admin' | 'member' | 'guest';

export interface HomeMemberRecord {
  id: EntityId;
  homeId: EntityId;
  userId: EntityId;
  displayName: string;
  email: string;
  role: HomeMemberRole;
  joinedAt: ISODateTimeString;
}

export interface HomeInviteRecord {
  id: EntityId;
  homeId: EntityId;
  invitedByUserId: EntityId;
  email: string;
  role: HomeMemberRole;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt: ISODateTimeString;
  expiresAt: ISODateTimeString;
}

// ─── Device Template (Admin) ─────────────────────────────────────────────

export type DeviceTemplateStatus = 'active' | 'beta' | 'disabled';

export interface DeviceTemplateRecord {
  id: EntityId;
  manufacturer: string;
  deviceType: DeviceType;
  models: string[];
  protocol: DeviceProtocol;
  /** API configuration for controlling this device type */
  apiEndpoint?: string;
  authMethod?: 'oauth' | 'api_key' | 'local';
  supportedActions: string[];
  supportedProperties: string[];
  status: DeviceTemplateStatus;
  timeoutMs: number;
  retryEnabled: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

// ─── WebSocket Events ────────────────────────────────────────────────────

export type OmniverseWsEventType =
  | 'device_state_changed'
  | 'device_online'
  | 'device_offline'
  | 'scene_executed'
  | 'automation_triggered'
  | 'alert';

export interface OmniverseWsEvent {
  type: OmniverseWsEventType;
  homeId: EntityId;
  payload: JsonObject;
  timestamp: ISODateTimeString;
}
