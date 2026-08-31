import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { nowIso, randomId } from '../utils.js';
import type {
  CreateLiveSessionInput,
  LiveMemoryProfile,
  LivePersona,
  LivePlanDefinition,
  LivePlanId,
  LiveProviderRoutingDecision,
  LiveSession,
  LiveSubscription,
  LiveUsageDaily,
} from './types.js';

type IdempotencyScope = 'session_create' | 'session_end';

type IdempotencyRecord = {
  user_id: string;
  scope: IdempotencyScope;
  key: string;
  session_id: string;
  created_at: string;
};

type LiveState = {
  personas: LivePersona[];
  sessions: LiveSession[];
  memory_profiles: LiveMemoryProfile[];
  daily_usage: LiveUsageDaily[];
  subscriptions: LiveSubscription[];
  favorites: Array<{ user_id: string; persona_id: string; updated_at: string }>;
  idempotency_records: IdempotencyRecord[];
};

const DEFAULT_PLAN: LivePlanId = 'free';
const DEFAULT_FREE_SECONDS = 30 * 60;

const PLAN_DEFINITIONS: LivePlanDefinition[] = [
  {
    plan_id: 'free',
    display_name: 'Free',
    daily_free_seconds: DEFAULT_FREE_SECONDS,
    supports_avatar: false,
    supports_custom_personas: false,
  },
  {
    plan_id: 'personal_pro',
    display_name: 'Personal Pro',
    daily_free_seconds: 0,
    supports_avatar: true,
    supports_custom_personas: true,
  },
  {
    plan_id: 'education_plus',
    display_name: 'Education Plus',
    daily_free_seconds: 0,
    supports_avatar: true,
    supports_custom_personas: true,
  },
  {
    plan_id: 'business',
    display_name: 'Business',
    daily_free_seconds: 0,
    supports_avatar: true,
    supports_custom_personas: true,
  },
  {
    plan_id: 'enterprise_custom',
    display_name: 'Enterprise Custom',
    daily_free_seconds: 0,
    supports_avatar: true,
    supports_custom_personas: true,
  },
];

function resolveProviderRouting(input: {
  planId: LivePlanId;
  avatarEnabled: boolean;
}): LiveProviderRoutingDecision {
  if (input.planId === 'free') {
    return {
      primary: 'openai_realtime',
      fallback: ['voice_only'],
      reason: 'free_plan_cost_control',
    };
  }

  if (input.avatarEnabled) {
    if (input.planId === 'business' || input.planId === 'enterprise_custom') {
      return {
        primary: 'tavus',
        fallback: ['heygen', 'openai_realtime', 'voice_only'],
        reason: 'business_avatar_priority',
      };
    }

    return {
      primary: 'heygen',
      fallback: ['tavus', 'openai_realtime', 'voice_only'],
      reason: 'avatar_requested',
    };
  }

  return {
    primary: 'openai_realtime',
    fallback: ['voice_only'],
    reason: 'voice_first_default',
  };
}

const DEFAULT_STATE: LiveState = {
  personas: [
    {
      persona_id: 'teacher_english_01',
      display_name: 'Emily',
      role_type: 'english_teacher',
      category: 'english_teacher',
      primary_languages: ['en', 'vi'],
      supports_avatar: true,
      supports_voice_only: true,
      premium_required: false,
      safe_for_children: true,
    },
    {
      persona_id: 'language_partner_en_01',
      display_name: 'Alex',
      role_type: 'language_partner',
      category: 'language_partner',
      primary_languages: ['en', 'vi'],
      supports_avatar: true,
      supports_voice_only: true,
      premium_required: false,
      safe_for_children: true,
    },
    {
      persona_id: 'listener_gentle_01',
      display_name: 'Mia',
      role_type: 'gentle_listener',
      category: 'listener',
      primary_languages: ['en', 'vi'],
      supports_avatar: false,
      supports_voice_only: true,
      premium_required: false,
      safe_for_children: false,
    },
  ],
  sessions: [],
  memory_profiles: [],
  daily_usage: [],
  subscriptions: [],
  favorites: [],
  idempotency_records: [],
};

function normalizePlanId(value: string | undefined): LivePlanId {
  const found = PLAN_DEFINITIONS.find((p) => p.plan_id === value);
  return found?.plan_id ?? DEFAULT_PLAN;
}

function normalizeTimezone(tz: string | undefined): string {
  const fallback = 'UTC';
  if (!tz) return fallback;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return fallback;
  }
}

function toDateKey(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: normalizeTimezone(timezone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function normalizeIdempotencyKey(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length < 8 || trimmed.length > 128) return undefined;
  return trimmed;
}

class LiveStore {
  private state: LiveState = structuredClone(DEFAULT_STATE);
  private loaded = false;
  private readonly inMemoryOnly = process.env.NODE_ENV === 'test';
  private readonly dataDir = process.env.OM_AI_DATA_DIR ?? 'data';
  private readonly filePath = join(process.cwd(), this.dataDir, 'live-store.json');

  async ensureLoaded() {
    if (this.loaded) return;

    if (this.inMemoryOnly) {
      this.state = structuredClone(DEFAULT_STATE);
      this.loaded = true;
      return;
    }

    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<LiveState>;
      this.state = {
        personas: parsed.personas ?? DEFAULT_STATE.personas,
        sessions: parsed.sessions ?? DEFAULT_STATE.sessions,
        memory_profiles: parsed.memory_profiles ?? DEFAULT_STATE.memory_profiles,
        daily_usage: parsed.daily_usage ?? DEFAULT_STATE.daily_usage,
        subscriptions: parsed.subscriptions ?? DEFAULT_STATE.subscriptions,
        favorites: parsed.favorites ?? DEFAULT_STATE.favorites,
        idempotency_records: parsed.idempotency_records ?? DEFAULT_STATE.idempotency_records,
      };
    } catch {
      await this.persist();
    }

    this.loaded = true;
  }

  private async persist() {
    if (this.inMemoryOnly) return;
    await mkdir(join(process.cwd(), this.dataDir), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  private findIdempotency(userId: string, scope: IdempotencyScope, key: string) {
    return this.state.idempotency_records.find(
      (record) => record.user_id === userId && record.scope === scope && record.key === key,
    );
  }

  private async saveIdempotency(userId: string, scope: IdempotencyScope, key: string, sessionId: string) {
    this.state.idempotency_records = [
      ...this.state.idempotency_records.filter(
        (record) => !(record.user_id === userId && record.scope === scope && record.key === key),
      ),
      {
        user_id: userId,
        scope,
        key,
        session_id: sessionId,
        created_at: nowIso(),
      },
    ];
    await this.persist();
  }

  listPlans() {
    return PLAN_DEFINITIONS;
  }

  async listPersonas(query: {
    category?: string;
    language?: string;
    safe_for_children?: boolean;
    supports_avatar?: boolean;
    supports_voice_only?: boolean;
  }) {
    await this.ensureLoaded();
    return this.state.personas.filter((persona) => {
      if (query.category && persona.category !== query.category) return false;
      if (query.language && !persona.primary_languages.includes(query.language)) return false;
      if (typeof query.safe_for_children === 'boolean' && persona.safe_for_children !== query.safe_for_children) {
        return false;
      }
      if (typeof query.supports_avatar === 'boolean' && persona.supports_avatar !== query.supports_avatar) {
        return false;
      }
      if (
        typeof query.supports_voice_only === 'boolean' &&
        persona.supports_voice_only !== query.supports_voice_only
      ) {
        return false;
      }
      return true;
    });
  }

  async getPersona(personaId: string) {
    await this.ensureLoaded();
    return this.state.personas.find((p) => p.persona_id === personaId);
  }

  async favoritePersona(userId: string, personaId: string) {
    await this.ensureLoaded();
    this.state.favorites = [
      ...this.state.favorites.filter((f) => !(f.user_id === userId && f.persona_id === personaId)),
      { user_id: userId, persona_id: personaId, updated_at: nowIso() },
    ];
    await this.persist();
  }

  async getSubscription(userId: string): Promise<LiveSubscription> {
    await this.ensureLoaded();
    const found = this.state.subscriptions.find((s) => s.user_id === userId);
    if (found) return found;

    const created: LiveSubscription = {
      user_id: userId,
      plan_id: DEFAULT_PLAN,
      updated_at: nowIso(),
    };
    this.state.subscriptions.push(created);
    await this.persist();
    return created;
  }

  async upgradePlan(userId: string, planId: string) {
    await this.ensureLoaded();
    const nextPlan = normalizePlanId(planId);
    const updated: LiveSubscription = {
      user_id: userId,
      plan_id: nextPlan,
      updated_at: nowIso(),
    };
    this.state.subscriptions = [...this.state.subscriptions.filter((s) => s.user_id !== userId), updated];
    await this.persist();
    return updated;
  }

  async getMemoryProfile(userId: string) {
    await this.ensureLoaded();
    const found = this.state.memory_profiles.find((m) => m.user_id === userId);
    if (found) return found;

    const created: LiveMemoryProfile = {
      user_id: userId,
      timezone: 'UTC',
      updated_at: nowIso(),
    };
    this.state.memory_profiles.push(created);
    await this.persist();
    return created;
  }

  async patchMemoryProfile(
    userId: string,
    patch: Partial<Omit<LiveMemoryProfile, 'user_id' | 'updated_at'>>,
  ): Promise<LiveMemoryProfile> {
    await this.ensureLoaded();
    const current = await this.getMemoryProfile(userId);
    const next: LiveMemoryProfile = {
      ...current,
      ...patch,
      timezone: normalizeTimezone(patch.timezone ?? current.timezone),
      updated_at: nowIso(),
    };
    this.state.memory_profiles = [...this.state.memory_profiles.filter((m) => m.user_id !== userId), next];
    await this.persist();
    return next;
  }

  async getUsageToday(userId: string) {
    await this.ensureLoaded();
    const profile = await this.getMemoryProfile(userId);
    const dateKey = toDateKey(profile.timezone);
    const sub = await this.getSubscription(userId);
    const plan = PLAN_DEFINITIONS.find((p) => p.plan_id === sub.plan_id);
    const freeLimit = plan?.daily_free_seconds ?? DEFAULT_FREE_SECONDS;
    const found = this.state.daily_usage.find((u) => u.user_id === userId && u.date_key === dateKey);

    if (found) {
      return {
        ...found,
        free_seconds_limit: freeLimit,
        free_seconds_remaining: Math.max(0, freeLimit - found.free_seconds_used),
        plan_id: sub.plan_id,
      };
    }

    const created: LiveUsageDaily = {
      user_id: userId,
      date_key: dateKey,
      free_seconds_limit: freeLimit,
      free_seconds_used: 0,
      premium_seconds_used: 0,
      updated_at: nowIso(),
    };
    this.state.daily_usage.push(created);
    await this.persist();
    return {
      ...created,
      free_seconds_remaining: freeLimit,
      plan_id: sub.plan_id,
    };
  }

  async createSession(input: CreateLiveSessionInput, options?: { idempotencyKey?: string }) {
    await this.ensureLoaded();
    const usage = await this.getUsageToday(input.user_id);
    const plan = normalizePlanId(input.plan_context ?? usage.plan_id);
    const idempotencyKey = normalizeIdempotencyKey(options?.idempotencyKey);

    if (idempotencyKey) {
      const existingKey = this.findIdempotency(input.user_id, 'session_create', idempotencyKey);
      if (existingKey) {
        const existingSession = await this.getSession(existingKey.session_id);
        if (existingSession) {
          return {
            session: existingSession,
            free_seconds_remaining_today: usage.free_seconds_remaining,
            idempotent_replayed: true,
          };
        }
      }
    }

    const session: LiveSession = {
      session_id: randomId('live_session'),
      user_id: input.user_id,
      persona_id: input.persona_id,
      session_type: input.session_type,
      status: 'ready',
      created_at: nowIso(),
      avatar_enabled: Boolean(input.avatar_enabled),
      goal: input.goal,
      plan_context: plan,
      language_mode: input.language_mode,
      billable_seconds: 0,
      free_seconds_applied: 0,
      premium_seconds_applied: 0,
      provider_routing: resolveProviderRouting({
        planId: plan,
        avatarEnabled: Boolean(input.avatar_enabled),
      }),
    };

    this.state.sessions.push(session);

    if (idempotencyKey) {
      await this.saveIdempotency(input.user_id, 'session_create', idempotencyKey, session.session_id);
    } else {
      await this.persist();
    }

    return {
      session,
      free_seconds_remaining_today: usage.free_seconds_remaining,
      idempotent_replayed: false,
    };
  }

  async listSessions(query: { user_id?: string; status?: string }) {
    await this.ensureLoaded();
    return this.state.sessions
      .filter((s) => {
        if (query.user_id && s.user_id !== query.user_id) return false;
        if (query.status && s.status !== query.status) return false;
        return true;
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  async getSession(sessionId: string) {
    await this.ensureLoaded();
    return this.state.sessions.find((s) => s.session_id === sessionId);
  }

  async connectSession(sessionId: string) {
    await this.ensureLoaded();
    const session = await this.getSession(sessionId);
    if (!session) return null;
    if (session.status === 'ended') return session;

    const connected = {
      ...session,
      status: 'active' as const,
      connected_at: session.connected_at ?? nowIso(),
    };

    this.state.sessions = [...this.state.sessions.filter((s) => s.session_id !== sessionId), connected];
    await this.persist();
    return connected;
  }

  async endSession(sessionId: string, overrideBillableSeconds?: number, options?: { idempotencyKey?: string }) {
    await this.ensureLoaded();
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const idempotencyKey = normalizeIdempotencyKey(options?.idempotencyKey);
    if (idempotencyKey) {
      const existingKey = this.findIdempotency(session.user_id, 'session_end', idempotencyKey);
      if (existingKey) {
        const existingSession = await this.getSession(existingKey.session_id);
        if (existingSession) {
          const usage = await this.getUsageToday(existingSession.user_id);
          return {
            session: existingSession,
            usage,
            idempotent_replayed: true,
          };
        }
      }
    }

    if (session.status === 'ended') {
      const usage = await this.getUsageToday(session.user_id);
      return {
        session,
        usage,
        idempotent_replayed: false,
      };
    }

    const startedAt = session.connected_at ? Date.parse(session.connected_at) : Date.parse(session.created_at);
    const endedAt = Date.now();
    const computed = Number.isFinite(startedAt) ? Math.max(0, Math.round((endedAt - startedAt) / 1000)) : 0;
    const billable = Math.max(0, Math.floor(overrideBillableSeconds ?? computed));

    const usage = await this.getUsageToday(session.user_id);
    const freeAvailable = usage.free_seconds_remaining;
    const freeApplied = Math.min(freeAvailable, billable);
    const premiumApplied = Math.max(0, billable - freeApplied);

    const ended: LiveSession = {
      ...session,
      status: 'ended',
      ended_at: nowIso(),
      billable_seconds: billable,
      free_seconds_applied: freeApplied,
      premium_seconds_applied: premiumApplied,
    };

    this.state.sessions = [...this.state.sessions.filter((s) => s.session_id !== sessionId), ended];

    const dateUsage = this.state.daily_usage.find((u) => u.user_id === usage.user_id && u.date_key === usage.date_key);
    if (dateUsage) {
      dateUsage.free_seconds_limit = usage.free_seconds_limit;
      dateUsage.free_seconds_used += freeApplied;
      dateUsage.premium_seconds_used += premiumApplied;
      dateUsage.updated_at = nowIso();
    }

    if (idempotencyKey) {
      await this.saveIdempotency(session.user_id, 'session_end', idempotencyKey, ended.session_id);
    } else {
      await this.persist();
    }

    const updatedUsage = await this.getUsageToday(session.user_id);

    return {
      session: ended,
      usage: updatedUsage,
      idempotent_replayed: false,
    };
  }

  async issueRealtimeToken(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    if (session.user_id !== userId) return null;

    return {
      session_id: sessionId,
      realtime_transport: 'webrtc',
      realtime_bootstrap_token: randomId('rt_ephemeral'),
      expires_in_seconds: 60,
      provider_routing: session.provider_routing,
    };
  }
}

export const liveStore = new LiveStore();
