import { useEffect, useMemo, useState } from 'react';
import { requestMagicLink } from './api/auth';
import { getLastRequestId, subscribeRequestTrace } from './api/client';
import { Alert } from './components/ui/Alert';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { useDevices } from './hooks/useDevices';
import { usePlanner } from './hooks/usePlanner';
import { usePlanDetails } from './hooks/usePlanDetails';
import { useApprovals } from './hooks/useApprovals';
import { useRunDetails } from './hooks/useRunDetails';
import { useRuns } from './hooks/useRuns';
import { useScenes } from './hooks/useScenes';
import { buildApiUrl } from './config/env';
import { useAppStore } from './state/store';

export function App() {
  const releaseTag = import.meta.env.VITE_RELEASE_TAG ?? 'local-dev';
  const deployStatus = import.meta.env.VITE_DEPLOY_STATUS ?? 'preview';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'same-origin';

  const { state, setSelectedSpaceId } = useAppStore();
  const { devices, loading: loadingDevices, error: devicesError } = useDevices();
  const { scenes, runScene, loading: loadingScenes, error: scenesError } = useScenes();
  const { runs, refresh: refreshRuns, loading: loadingRuns, error: runsError } = useRuns();
  const { fetchRunDetails, loading: loadingRunDetails, error: runDetailsError } = useRunDetails();
  const { plan, loading: planning, error: planningError } = usePlanner();
  const { fetchPlan, loading: loadingPlanDetails, error: planDetailsError } = usePlanDetails();
  const { requestApproval, fetchApproval, loading: approvalsLoading, error: approvalsError } = useApprovals();
  const [input, setInput] = useState('Om, cho phong con ngu / Om, turn off the baby room light');
  const [planResult, setPlanResult] = useState<string>('');
  const [planDetailResult, setPlanDetailResult] = useState<string>('');
  const [approvalResult, setApprovalResult] = useState<string>('');
  const [sceneRunResult, setSceneRunResult] = useState<string>('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRunDetails, setSelectedRunDetails] = useState<string>('');
  const [selectedProofDetails, setSelectedProofDetails] = useState<string>('');
  const [selectedProofId, setSelectedProofId] = useState<string>('');
  const [selectedRequestedState, setSelectedRequestedState] = useState<string>('');
  const [selectedActualState, setSelectedActualState] = useState<string>('');
  const [apiReady, setApiReady] = useState<'checking' | 'ready' | 'down'>('checking');
  const [apiCheckedAt, setApiCheckedAt] = useState<string>('');
  const [lastRequestId, setLastRequestId] = useState<string>('');
  const [authEmail, setAuthEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState('');
  const [authError, setAuthError] = useState('');
  const [lastAuthEmail, setLastAuthEmail] = useState('');
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());

  const callbackState = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = (params.get('auth') ?? '').toLowerCase();
    const err = (params.get('error') ?? params.get('auth_error') ?? '').toLowerCase();
    if (auth === 'success') return 'success';
    if (auth === 'expired' || err.includes('expired')) return 'expired';
    if (auth === 'invalid' || err.includes('invalid') || err.includes('token')) return 'invalid';
    return 'none';
  }, []);

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - nowTick) / 1000));
  const apiReadyLabel =
    apiReady === 'ready'
      ? 'ready / san sang'
      : apiReady === 'down'
        ? 'down / khong san sang'
        : 'checking / dang kiem tra';

  const featurePoints = [
    'Natural language to safe execution plans with explicit policy decisions. / Ngon ngu tu nhien thanh ke hoach thuc thi an toan voi quyet dinh chinh sach ro rang.',
    'Run-level proof records for traceability and post-action audits. / Ban ghi bang chung theo tung run de truy vet va kiem toan sau hanh dong.',
    'Live AI teacher, coach, and companion calls with metered session access. / Cuoc goi AI live cho giao vien, huan luyen vien, va dong hanh voi gioi han phien su dung.',
  ];

  const useCases = [
    'Smart home routines with parent-safe control boundaries. / Kich ban nha thong minh voi gioi han dieu khien an toan cho gia dinh.',
    '1:1 language practice and guided teacher calls on iPhone. / Luyen ngon ngu 1:1 va cuoc goi huong dan voi giao vien tren iPhone.',
    'Facility operations and assistive workflows with confidence and verification. / Van hanh co so va quy trinh tro ly co do tin cay va xac minh.',
  ];

  async function onPlan() {
    const result = await plan(input);
    if (result) {
      setPlanResult(`${result.plan_id} / ${result.policy_decision}`);

      const planDetails = await fetchPlan(result.plan_id);
      if (planDetails) {
        setPlanDetailResult(`${planDetails.plan_id} / ${planDetails.policy_decision}`);
      }

      const approval = await requestApproval(result.plan_id);
      if (approval) {
        const fetched = await fetchApproval(approval.approval_id);
        if (fetched) {
          setApprovalResult(`${fetched.approval_id} / ${fetched.status}`);
        }
      }
      await refreshRuns();
    }
  }

  async function onCheckApiReady() {
    setApiReady('checking');
    try {
      const response = await fetch(buildApiUrl('/ready'));
      if (!response.ok) {
        setApiReady('down');
        setApiCheckedAt(new Date().toISOString());
        return;
      }
      setApiReady('ready');
      setApiCheckedAt(new Date().toISOString());
    } catch {
      setApiReady('down');
      setApiCheckedAt(new Date().toISOString());
    }
  }

  useEffect(() => {
    void onCheckApiReady();
  }, []);

  useEffect(() => {
    setLastRequestId(getLastRequestId() ?? '');
    return subscribeRequestTrace((requestId) => {
      if (requestId) setLastRequestId(requestId);
    });
  }, []);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  async function onRequestMagicLink(emailOverride?: string) {
    const email = (emailOverride ?? authEmail).trim();
    if (!email) {
      setAuthError('Please enter your email. / Vui long nhap email.');
      return;
    }

    if (cooldownSeconds > 0) {
      setAuthError(`Please wait ${cooldownSeconds}s before resending. / Vui long doi ${cooldownSeconds} giay truoc khi gui lai.`);
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const result = await requestMagicLink({ email, redirectTo: '/dashboard' });

    if (result.error || !result.value) {
      setAuthError(
        result.error === 'network_error'
          ? 'Connection issue. Please try again. / Ket noi dang co van de. Vui long thu lai.'
          : 'Could not send request. Please try again. / Chua gui duoc yeu cau. Vui long thu lai.',
      );
      setAuthLoading(false);
      return;
    }

    setLastAuthEmail(email);
    setAuthSuccess(
      `Check your email: ${email} / Vui long kiem tra email: ${email}${
        result.value.expiresAt ? ` (expires at ${result.value.expiresAt} / het han luc ${result.value.expiresAt})` : ''
      }.`,
    );
    setCooldownUntil(Date.now() + 30_000);
    setNowTick(Date.now());
    setAuthLoading(false);
  }

  async function onCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op for non-secure contexts
    }
  }

  async function onRunScene(sceneId: string) {
    const result = await runScene(sceneId);
    if (result) {
      setSceneRunResult(`${result.scene_id} / ${result.status} / ${result.run_id}`);
      await refreshRuns();
    }
  }

  async function onToggleRunDetails(runId: string) {
    if (selectedRunId === runId) {
      setSelectedRunId(null);
      setSelectedRunDetails('');
      setSelectedProofDetails('');
      setSelectedProofId('');
      setSelectedRequestedState('');
      setSelectedActualState('');
      return;
    }

    setSelectedRunId(runId);
    setSelectedRunDetails('');
    setSelectedProofDetails('');
    setSelectedProofId('');
    setSelectedRequestedState('');
    setSelectedActualState('');

    const details = await fetchRunDetails(runId);
    if (!details) {
      setSelectedRunId(null);
      return;
    }

    setSelectedRunDetails(
      `${details.run.run_id} / ${details.run.source}:${details.run.source_id} / ${details.run.status} / actor=${details.run.actor_id} / policy=${details.run.policy_decision ?? 'none'}`,
    );

    if (!details.proof) {
      setSelectedProofDetails('No proof yet / Chua co bang chung');
      return;
    }

    setSelectedProofId(details.proof.proofId);
    setSelectedProofDetails(
      `${details.proof.proofId} / confidence-do tin cay=${details.proof.confidenceScore} / verifiedAt-da xac minh luc=${details.proof.verifiedAt}`,
    );
    setSelectedRequestedState(JSON.stringify(details.proof.requestedState, null, 2));
    setSelectedActualState(JSON.stringify(details.proof.actualState, null, 2));
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>Om AI</h1>
        <p>
          Control your space and talk with live AI support in one place. Every action is checked by policy and
          saved with a clear history. / Dieu khien khong gian va tro chuyen voi AI live trong mot noi. Moi hanh dong
          duoc kiem tra theo chinh sach va luu lai lich su ro rang.
        </p>
        <div className="hero-actions">
          <a href="#planner" className="cta-primary">Try live planner / Thu planner truc tiep</a>
          <a href="#activity" className="cta-secondary">See activity timeline / Xem nhat ky hoat dong</a>
        </div>
        <div className="hero-row">
          <span className="chip">Policy-first execution / Thuc thi uu tien chinh sach</span>
          <span className="chip">Proof-linked runs / Run gan voi bang chung</span>
          <span className="chip">Human approvals built-in / Co phe duyet thu cong tich hop</span>
        </div>
        <div className="status-row">
          <span className="status-pill">Status / Trang thai: {deployStatus}</span>
          <span className="status-pill">Release / Phien ban: {releaseTag}</span>
          <span className="status-pill">API: {apiBaseUrl}</span>
          <span className={`status-pill ${apiReady === 'ready' ? 'status-ok' : apiReady === 'down' ? 'status-down' : ''}`}>
            API ready / API san sang: {apiReadyLabel}
          </span>
          <button className="button-secondary" onClick={() => void onCheckApiReady()}>
            Check API / Kiem tra API
          </button>
        </div>
        {lastRequestId ? <p className="meta-line">Latest request id / Request id moi nhat: {lastRequestId}</p> : null}
        {apiCheckedAt ? <p className="meta-line">Last API check / Lan kiem tra API gan nhat: {apiCheckedAt}</p> : null}
        {apiReady === 'down' ? (
          <p className="meta-line warning-line">
            API is not available right now. Check backend health, `VITE_API_BASE_URL`, and CORS settings. / API hien
            tai chua san sang. Hay kiem tra health backend, `VITE_API_BASE_URL`, va cau hinh CORS.
          </p>
        ) : null}
      </section>

      <section className="grid">
      <Card className="span-6" id="auth" title="Sign in / Dang nhap (magic link)">
        {callbackState === 'success' ? <Alert tone="success">Your sign-in link is verified. You can continue. / Link dang nhap da duoc xac minh. Ban co the tiep tuc.</Alert> : null}
        {callbackState === 'expired' ? (
          <Alert tone="warning">Your sign-in link has expired. Request a new link below. / Link dang nhap da het han. Hay yeu cau link moi ben duoi.</Alert>
        ) : null}
        {callbackState === 'invalid' ? <Alert tone="warning">Invalid sign-in link. Request a new link. / Link dang nhap khong hop le. Hay yeu cau link moi.</Alert> : null}
        <div className="controls">
          <Input
            type="email"
            placeholder="you@domain.com / ban@domain.com"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
          />
          <Button onClick={() => void onRequestMagicLink()} disabled={authLoading || cooldownSeconds > 0}>
            {authLoading ? 'Sending... / Dang gui...' : cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s / Gui lai sau ${cooldownSeconds} giay` : 'Send magic link / Gui magic link'}
          </Button>
        </div>
        {authSuccess ? <Alert tone="success">{authSuccess}</Alert> : null}
        {authError ? (
          <Alert tone="warning">
            {authError}{' '}
            <Button variant="secondary" onClick={() => void onRequestMagicLink(lastAuthEmail || undefined)}>
              Retry / Thu lai
            </Button>
          </Alert>
        ) : null}
      </Card>

      <Card className="span-6" title="Why Om AI / Vi sao chon Om AI">
        <ul>
          {featurePoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </Card>

      <Card className="span-6" title="Use cases / Cach dung thuc te">
        <ul>
          {useCases.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card className="span-6" id="planner" title="Planner / Bo lap ke hoach">
        <div className="controls">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe what you want / Mo ta dieu ban muon" />
        <Button onClick={onPlan} disabled={planning}>
          {planning ? 'Planning... / Dang lap ke hoach...' : 'Plan / Lap ke hoach'}
        </Button>
        </div>
        {planningError ? <Alert tone="warning">Planner error / Loi planner: {planningError}</Alert> : null}
        {planResult ? <Alert>Last plan / Ke hoach gan nhat: {planResult}</Alert> : null}
        {loadingPlanDetails ? <p>Loading plan details... / Dang tai chi tiet ke hoach...</p> : null}
        {planDetailsError ? <Alert tone="warning">Plan details error / Loi chi tiet ke hoach: {planDetailsError}</Alert> : null}
        {planDetailResult ? <Alert>Plan details / Chi tiet ke hoach: {planDetailResult}</Alert> : null}
        {approvalsLoading ? <p>Loading approval... / Dang tai phe duyet...</p> : null}
        {approvalsError ? <Alert tone="warning">Approvals error / Loi phe duyet: {approvalsError}</Alert> : null}
        {approvalResult ? <Alert>Approval / Phe duyet: {approvalResult}</Alert> : null}
      </Card>

      <Card className="span-6" title="Scenes / Ngu canh">
        {loadingScenes ? <p>Loading scenes... / Dang tai scenes...</p> : null}
        {scenesError ? <Alert tone="warning">Scenes error / Loi scenes: {scenesError}</Alert> : null}
        {!loadingScenes && !scenesError ? (
          <ul>
            {scenes.map((s) => (
              <li key={s.scene_id}>
                {s.display_name} ({s.safety_class})
                <Button onClick={() => onRunScene(s.scene_id)} variant="secondary" className="ml-8">
                  Run / Chay
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        {sceneRunResult ? <Alert>Last scene run / Lan chay scene gan nhat: {sceneRunResult}</Alert> : null}
      </Card>

      <Card className="span-8" id="activity" title="Activity timeline / Nhat ky hoat dong">
        <Button onClick={() => void refreshRuns()} disabled={loadingRuns} variant="secondary">
          {loadingRuns ? 'Refreshing... / Dang lam moi...' : 'Refresh / Lam moi'}
        </Button>
        {runsError ? <Alert tone="warning">Runs error / Loi runs: {runsError}</Alert> : null}
        {!loadingRuns && !runsError ? (
          <ul>
            {runs.map((r) => (
              <li key={r.run_id}>
                {r.created_at} - {r.source}:{r.source_id} - {r.status} ({r.run_id})
                <Button onClick={() => void onToggleRunDetails(r.run_id)} className="ml-8" variant="secondary">
                  {selectedRunId === r.run_id ? 'Hide details / An chi tiet' : 'View details / Xem chi tiet'}
                </Button>
                {selectedRunId === r.run_id ? (
                  <div className="meta-line">
                    {loadingRunDetails ? <p>Loading run details... / Dang tai chi tiet run...</p> : null}
                    {runDetailsError ? <Alert tone="warning">Run details error / Loi chi tiet run: {runDetailsError}</Alert> : null}
                    {selectedRunDetails ? (
                      <p>
                        Activity / Hoat dong: {selectedRunDetails}{' '}
                        <Button variant="secondary" onClick={() => void onCopy(r.run_id)}>
                          Copy run id / Sao chep run id
                        </Button>
                      </p>
                    ) : null}
                    {selectedProofDetails ? (
                      <p>
                        Proof / Bang chung: {selectedProofDetails}{' '}
                        {selectedProofId ? (
                          <Button variant="secondary" onClick={() => void onCopy(selectedProofId)}>
                            Copy proof id / Sao chep proof id
                          </Button>
                        ) : null}
                      </p>
                    ) : null}
                    {selectedRequestedState ? (
                      <>
                        <p>Requested state / Trang thai yeu cau</p>
                        <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{selectedRequestedState}</pre>
                      </>
                    ) : null}
                    {selectedActualState ? (
                      <>
                        <p>Actual state / Trang thai thuc te</p>
                        <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{selectedActualState}</pre>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card className="span-4" title="Devices / Thiet bi">
        {loadingDevices ? <p>Loading devices... / Dang tai thiet bi...</p> : null}
        {devicesError ? <Alert tone="warning">Device error / Loi thiet bi: {devicesError}</Alert> : null}
        {!loadingDevices && !devicesError ? (
          <ul>
            {devices.map((d) => (
              <li key={d.device_id}>{d.display_name} ({d.protocol}) - {d.online_state}</li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card className="span-12" title="Store / Bo nho trang thai">
        <Alert>Selected space / Khong gian dang chon: {state.selectedSpaceId ?? 'none / chua chon'}</Alert>
        <Button onClick={() => setSelectedSpaceId('space_demo_01')}>Select demo space / Chon khong gian demo</Button>
        <Button onClick={() => setSelectedSpaceId(null)} className="ml-8" variant="secondary">Clear / Xoa</Button>
      </Card>
      </section>

      <footer className="footer">Om AI - reality control and AI human interaction in one governed flow. / Om AI - dieu khien thuc tai va tuong tac AI con nguoi trong mot luong duoc quan tri.</footer>
    </main>
  );
}
