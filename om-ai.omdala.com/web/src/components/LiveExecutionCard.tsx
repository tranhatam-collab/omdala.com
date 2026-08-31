import { useEffect, useMemo, useState } from 'react';
import {
  createLiveSession,
  connectLiveSession,
  endLiveSession,
  getLiveMemoryProfile,
  getLivePersonaDetail,
  getLiveUsageToday,
  listLivePersonas,
  listLivePlans,
  updateLiveMemoryProfile,
  upgradeLivePlan,
  type LiveMemoryProfile,
  type LivePersonaDetail,
  type LivePersonaRecord,
  type LivePlanDefinition,
} from '../api/live';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';

type Props = {
  className?: string;
};

const FALLBACK_PERSONA: LivePersonaRecord = {
  persona_id: 'teacher_english_01',
  display_name: 'Emily',
  role_type: 'english_teacher',
  category: 'english_teacher',
  primary_languages: ['en', 'vi'],
  supports_avatar: true,
  supports_voice_only: true,
};

const FALLBACK_PLANS: LivePlanDefinition[] = [
  {
    plan_id: 'free',
    display_name: 'Free',
    daily_free_seconds: 1800,
    supports_avatar: false,
    supports_custom_personas: false,
  },
];

const CORRECTION_STYLE_OPTIONS: NonNullable<LiveMemoryProfile['correction_style']>[] = [
  'none',
  'gentle',
  'inline',
  'post_turn',
  'end_of_session',
];

export function LiveExecutionCard({ className = '' }: Props) {
  const [userId, setUserId] = useState('web_live_user_01');
  const [personaId, setPersonaId] = useState('teacher_english_01');
  const [personas, setPersonas] = useState<LivePersonaRecord[]>([]);
  const [personaDetail, setPersonaDetail] = useState<LivePersonaDetail | null>(null);
  const [plans, setPlans] = useState<LivePlanDefinition[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState('free');
  const [selectedPlanId, setSelectedPlanId] = useState('free');
  const [sessionId, setSessionId] = useState('');
  const [usageText, setUsageText] = useState('');
  const [flowText, setFlowText] = useState('');
  const [memoryText, setMemoryText] = useState('');
  const [planText, setPlanText] = useState('');
  const [memoryDisplayName, setMemoryDisplayName] = useState('');
  const [memoryTimezone, setMemoryTimezone] = useState('Asia/Ho_Chi_Minh');
  const [memoryTargetLanguage, setMemoryTargetLanguage] = useState('en');
  const [memoryCorrectionStyle, setMemoryCorrectionStyle] =
    useState<NonNullable<LiveMemoryProfile['correction_style']>>('gentle');
  const [flowLoading, setFlowLoading] = useState(false);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState('');

  const personaOptions = useMemo(() => {
    if (personas.length > 0) return personas;
    return [FALLBACK_PERSONA];
  }, [personas]);

  const planOptions = useMemo(() => {
    if (plans.length > 0) return plans;
    return FALLBACK_PLANS;
  }, [plans]);

  const activePlan = useMemo(
    () => planOptions.find((plan) => plan.plan_id === currentPlanId) ?? planOptions[0],
    [currentPlanId, planOptions],
  );

  useEffect(() => {
    void (async () => {
      const result = await listLivePersonas();
      if (!result.value) {
        setError(result.error ?? 'personas_failed');
        return;
      }

      setPersonas(result.value);
      if (!result.value.find((persona) => persona.persona_id === personaId)) {
        setPersonaId(result.value[0]?.persona_id ?? personaId);
      }
    })();
  }, []);

  useEffect(() => {
    void loadPersonaDetail(personaId);
  }, [personaId]);

  useEffect(() => {
    void refreshUsage(userId);
    void refreshMemory(userId);
  }, [userId]);

  useEffect(() => {
    void (async () => {
      const result = await listLivePlans();
      if (!result.value) {
        setError(result.error ?? 'plans_failed');
        return;
      }

      setPlans(result.value);
    })();
  }, []);

  async function loadPersonaDetail(targetPersonaId: string) {
    const result = await getLivePersonaDetail(targetPersonaId);
    if (!result.value) {
      setError(result.error ?? 'persona_detail_failed');
      return;
    }

    setPersonaDetail(result.value);
  }

  async function refreshUsage(targetUserId: string) {
    const usage = await getLiveUsageToday(targetUserId);
    if (!usage.value) {
      setError(usage.error ?? 'usage_failed');
      return;
    }

    const nextPlanId = usage.value.plan_id;

    setUsageText(
      `plan=${nextPlanId} / free=${usage.value.free_seconds_used}/${usage.value.free_seconds_limit} / remaining=${usage.value.free_seconds_remaining}`,
    );
    setCurrentPlanId(nextPlanId);
    setSelectedPlanId((previous) => (previous === currentPlanId ? nextPlanId : previous));
  }

  async function refreshMemory(targetUserId: string) {
    const result = await getLiveMemoryProfile(targetUserId);
    if (!result.value) {
      setError(result.error ?? 'memory_failed');
      return;
    }

    setMemoryDisplayName(result.value.display_name ?? '');
    setMemoryTimezone(result.value.timezone);
    setMemoryTargetLanguage(result.value.target_language ?? '');
    setMemoryCorrectionStyle(result.value.correction_style ?? 'gentle');
    setMemoryText(
      `timezone=${result.value.timezone} / target=${result.value.target_language ?? 'unset'} / correction=${result.value.correction_style ?? 'unset'}`,
    );
  }

  async function onCreate() {
    setFlowLoading(true);
    setError('');

    const created = await createLiveSession({
      user_id: userId,
      persona_id: personaId,
      session_type: 'language_call',
      avatar_enabled: activePlan?.supports_avatar ?? false,
    });

    if (!created.value) {
      setError(created.error ?? 'create_failed');
      setFlowLoading(false);
      return;
    }

    setSessionId(created.value.session_id);
    setFlowText(
      `created=${created.value.session_id} / status=${created.value.status} / free_remaining=${created.value.usage.free_seconds_remaining_today}`,
    );

    await refreshUsage(userId);
    setFlowLoading(false);
  }

  async function onConnect() {
    if (!sessionId) return;
    setFlowLoading(true);
    setError('');

    const connected = await connectLiveSession(sessionId);
    if (!connected.value) {
      setError(connected.error ?? 'connect_failed');
      setFlowLoading(false);
      return;
    }

    setFlowText(`connected=${connected.value.session_id} / status=${connected.value.status}`);
    setFlowLoading(false);
  }

  async function onEnd() {
    if (!sessionId) return;
    setFlowLoading(true);
    setError('');

    const ended = await endLiveSession(sessionId, 180);
    if (!ended.value) {
      setError(ended.error ?? 'end_failed');
      setFlowLoading(false);
      return;
    }

    setFlowText(
      `ended=${ended.value.session_id} / billable=${ended.value.billable_seconds}s / free_remaining=${ended.value.free_seconds_remaining_today}s`,
    );
    await refreshUsage(userId);
    setFlowLoading(false);
  }

  async function onSaveMemory() {
    setMemoryLoading(true);
    setError('');

    const result = await updateLiveMemoryProfile({
      user_id: userId,
      display_name: memoryDisplayName || undefined,
      timezone: memoryTimezone || undefined,
      target_language: memoryTargetLanguage || undefined,
      correction_style: memoryCorrectionStyle,
    });

    if (!result.value) {
      setError(result.error ?? 'memory_update_failed');
      setMemoryLoading(false);
      return;
    }

    setMemoryText(
      `saved=${result.value.updated_at} / timezone=${result.value.timezone} / target=${result.value.target_language ?? 'unset'} / correction=${result.value.correction_style ?? 'unset'}`,
    );
    setMemoryLoading(false);
  }

  async function onUpgradePlan() {
    setPlanLoading(true);
    setError('');

    const result = await upgradeLivePlan({
      user_id: userId,
      plan_id: selectedPlanId,
    });

    if (!result.value) {
      setError(result.error ?? 'plan_upgrade_failed');
      setPlanLoading(false);
      return;
    }

    setCurrentPlanId(result.value.plan_id);
    setPlanText(`current=${result.value.plan_id} / updated=${result.value.updated_at}`);
    await refreshUsage(userId);
    setPlanLoading(false);
  }

  return (
    <Card className={className} title="Om AI Live Execution / Thuc thi live">
      <p className="meta-line">
        Backend execution path for <code>/v2/live</code> with persona, memory, plan gating, and server-side metering.
        {' '} / Luong backend <code>/v2/live</code> gom persona, memory, plan gating, va metering o phia server.
      </p>

      <div className="controls">
        <Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="user_id" />
        <select value={personaId} onChange={(event) => setPersonaId(event.target.value)}>
          {personaOptions.map((persona) => (
            <option key={persona.persona_id} value={persona.persona_id}>
              {persona.display_name} ({persona.role_type})
            </option>
          ))}
        </select>
      </div>

      {personaDetail ? (
        <Alert>
          persona={personaDetail.display_name} / safety={personaDetail.safety_profile} / modes=
          {personaDetail.supported_modes.join(', ')} / providers={personaDetail.supported_providers.join(', ')}
        </Alert>
      ) : null}

      <div className="controls">
        <Button onClick={() => void onCreate()} disabled={flowLoading}>
          Create session
        </Button>
        <Button onClick={() => void onConnect()} disabled={flowLoading || !sessionId} variant="secondary">
          Connect
        </Button>
        <Button onClick={() => void onEnd()} disabled={flowLoading || !sessionId} variant="secondary">
          End (180s)
        </Button>
        <Button onClick={() => void refreshUsage(userId)} disabled={flowLoading} variant="secondary">
          Refresh usage
        </Button>
      </div>

      <div className="subsection">
        <h3>Memory profile / Ho so memory</h3>
        <div className="controls">
          <Input
            value={memoryDisplayName}
            onChange={(event) => setMemoryDisplayName(event.target.value)}
            placeholder="display_name"
          />
          <Input
            value={memoryTimezone}
            onChange={(event) => setMemoryTimezone(event.target.value)}
            placeholder="timezone"
          />
        </div>
        <div className="controls">
          <Input
            value={memoryTargetLanguage}
            onChange={(event) => setMemoryTargetLanguage(event.target.value)}
            placeholder="target_language"
          />
          <select
            value={memoryCorrectionStyle}
            onChange={(event) =>
              setMemoryCorrectionStyle(event.target.value as NonNullable<LiveMemoryProfile['correction_style']>)
            }
          >
            {CORRECTION_STYLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Button onClick={() => void onSaveMemory()} disabled={memoryLoading}>
            Save memory
          </Button>
          <Button onClick={() => void refreshMemory(userId)} disabled={memoryLoading} variant="secondary">
            Refresh memory
          </Button>
        </div>
      </div>

      <div className="subsection">
        <h3>Plan gating / Goi va gioi han</h3>
        <div className="controls">
          <select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}>
            {planOptions.map((plan) => (
              <option key={plan.plan_id} value={plan.plan_id}>
                {plan.display_name} ({plan.plan_id})
              </option>
            ))}
          </select>
          <Button onClick={() => void onUpgradePlan()} disabled={planLoading}>
            Upgrade plan
          </Button>
          <Button onClick={() => void refreshUsage(userId)} disabled={planLoading} variant="secondary">
            Refresh plan usage
          </Button>
        </div>
        <p className="meta-line">
          Current plan / Goi hien tai: {currentPlanId} / avatar={activePlan?.supports_avatar ? 'yes' : 'no'} /
          custom_personas={activePlan?.supports_custom_personas ? 'yes' : 'no'} /
          free_seconds={activePlan?.daily_free_seconds ?? 0}
        </p>
      </div>

      {flowText ? <Alert>{flowText}</Alert> : null}
      {usageText ? <Alert>{usageText}</Alert> : null}
      {memoryText ? <Alert>{memoryText}</Alert> : null}
      {planText ? <Alert>{planText}</Alert> : null}
      {error ? <Alert tone="warning">Live execution error: {error}</Alert> : null}
    </Card>
  );
}
