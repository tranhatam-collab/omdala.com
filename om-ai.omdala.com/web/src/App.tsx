import { useEffect, useMemo, useState } from 'react';
import { requestMagicLink } from './api/auth';
import { getLastRequestId, subscribeRequestTrace } from './api/client';
import { describeApiError } from './api/liveErrors';
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
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { LiveExecutionCard } from './components/LiveExecutionCard';
import { useLocale } from './i18n/locale';
import { useAppStore } from './state/store';

export function App() {
  const releaseTag = import.meta.env.VITE_RELEASE_TAG ?? 'local-dev';
  const deployStatus = import.meta.env.VITE_DEPLOY_STATUS ?? 'preview';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'same-origin';

  const { t } = useLocale();
  const { state, setSelectedSpaceId } = useAppStore();
  const { devices, loading: loadingDevices, error: devicesError } = useDevices();
  const { scenes, runScene, loading: loadingScenes, error: scenesError } = useScenes();
  const { runs, refresh: refreshRuns, loading: loadingRuns, error: runsError } = useRuns();
  const { fetchRunDetails, loading: loadingRunDetails, error: runDetailsError } = useRunDetails();
  const { plan, loading: planning, error: planningError } = usePlanner();
  const { fetchPlan, loading: loadingPlanDetails, error: planDetailsError } = usePlanDetails();
  const { requestApproval, fetchApproval, loading: approvalsLoading, error: approvalsError } = useApprovals();
  const [input, setInput] = useState('Om, cho phòng con ngủ / Om, turn off the baby room light');
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
  const apiReady = 'blocked' as const;
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
  const apiReadyLabel = 'blocked pending canonical session bridge / bị chặn, chờ cầu nối phiên chuẩn (canonical)';

  const featurePoints = [
    'Natural language to safe execution plans with explicit policy decisions. / Ngôn ngữ tự nhiên thành kế hoạch thực thi an toàn với quyết định chính sách rõ ràng.',
    'Run-level proof records for traceability and post-action audits. / Bản ghi bằng chứng theo từng run để truy vết và kiểm toán sau hành động.',
    'Live AI teacher, coach, and companion calls with metered session access. / Các cuộc gọi AI trực tiếp với giáo viên, huấn luyện viên và người đồng hành, có giới hạn thời lượng phiên sử dụng.',
  ];

  const useCases = [
    'Smart home routines with parent-safe control boundaries. / Kịch bản nhà thông minh với giới hạn điều khiển an toàn cho gia đình.',
    '1:1 language practice and guided teacher calls on iPhone. / Luyện ngôn ngữ 1:1 và các cuộc gọi hướng dẫn với giáo viên trên iPhone.',
    'Facility operations and assistive workflows with confidence and verification. / Vận hành cơ sở và quy trình trợ lý với độ tin cậy và khả năng xác minh.',
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

  function onCheckApiReady() {
    setApiCheckedAt(new Date().toISOString());
  }

  useEffect(() => {
    onCheckApiReady();
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
      setAuthError('Please enter your email. / Vui lòng nhập email.');
      return;
    }

    if (cooldownSeconds > 0) {
      setAuthError(`Please wait ${cooldownSeconds}s before resending. / Vui lòng đợi ${cooldownSeconds} giây trước khi gửi lại.`);
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const result = await requestMagicLink({ email, redirectTo: '/dashboard' });

    if (result.error || !result.value) {
      setAuthError(
        describeApiError(
          result.error,
          'Could not send request. Please try again. / Chưa gửi được yêu cầu. Vui lòng thử lại.',
        ),
      );
      setAuthLoading(false);
      return;
    }

    setLastAuthEmail(email);
    setAuthSuccess(
      `Check your email: ${email}${
        result.value.expiresAt ? ` (expires at ${result.value.expiresAt})` : ''
      }. / Vui long kiem tra email: ${email}${
        result.value.expiresAt ? ` (het han luc ${result.value.expiresAt})` : ''
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
      setSelectedProofDetails('No proof yet / Chưa có bằng chứng');
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
    <div className="page">
      <header className="hero">
        <h1>Om AI</h1>
        <LanguageSwitcher />
        <p>
          {t(
            'Control your space and talk with live AI support in one place. Every action is checked by policy and saved with a clear history. / Điều khiển không gian và trò chuyện với AI trực tiếp ở cùng một nơi. Mọi hành động đều được kiểm tra theo chính sách và lưu lại lịch sử rõ ràng.',
          )}
        </p>
        <div className="hero-actions">
          <a href="#planner" className="cta-primary">{t('Try live planner / Thử planner trực tiếp')}</a>
          <a href="#activity" className="cta-secondary">{t('See activity timeline / Xem nhật ký hoạt động')}</a>
        </div>
        <div className="hero-row">
          <span className="chip">{t('Policy-first execution / Thực thi ưu tiên chính sách')}</span>
          <span className="chip">{t('Proof-linked runs / Run gắn với bằng chứng')}</span>
          <span className="chip">{t('Human approvals built-in / Có sẵn phê duyệt thủ công')}</span>
        </div>
        <div className="status-row">
          <span className="status-pill">{t('Status / Trạng thái: ')}{deployStatus}</span>
          <span className="status-pill">{t('Release / Phiên bản: ')}{releaseTag}</span>
          <span className="status-pill">API: {apiBaseUrl}</span>
          <span className="status-pill status-down">
            {t('API ready / API sẵn sàng: ')}{t(apiReadyLabel)}
          </span>
          <button className="button-secondary" onClick={onCheckApiReady}>
            {t('Show bridge status / Xem trạng thái cầu nối')}
          </button>
        </div>
        {lastRequestId ? <p className="meta-line">{t('Latest request id / Request id mới nhất: ')}{lastRequestId}</p> : null}
        {apiCheckedAt ? <p className="meta-line">{t('Last API check / Lần kiểm tra API gần nhất: ')}{apiCheckedAt}</p> : null}
        {apiReady === 'blocked' ? (
          <p className="meta-line warning-line">
            {t(
              'Protected actions are disabled before network access until this surface has a verified canonical OMDALA session bridge. / Các thao tác được bảo vệ bị tắt trước khi truy cập mạng, cho đến khi bề mặt này có cầu nối phiên OMDALA chuẩn đã được xác minh.',
            )}
          </p>
        ) : null}
      </header>

      <main>
      <section className="grid">
      <Card className="span-6" id="auth" title={t('Sign in / Đăng nhập (magic link)')}>
        {callbackState === 'success' ? <Alert tone="success">{t('Your sign-in link is verified. You can continue. / Liên kết đăng nhập đã được xác minh. Bạn có thể tiếp tục.')}</Alert> : null}
        {callbackState === 'expired' ? (
          <Alert tone="warning">{t('Your sign-in link has expired. Request a new link below. / Liên kết đăng nhập đã hết hạn. Hãy yêu cầu liên kết mới bên dưới.')}</Alert>
        ) : null}
        {callbackState === 'invalid' ? <Alert tone="warning">{t('Invalid sign-in link. Request a new link. / Liên kết đăng nhập không hợp lệ. Hãy yêu cầu liên kết mới.')}</Alert> : null}
        <div className="controls">
          <Input
            type="email"
            aria-label={t('Email address / Địa chỉ email')}
            placeholder={t('you@domain.com / ban@domain.com')}
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
          />
          <Button onClick={() => void onRequestMagicLink()} disabled={authLoading || cooldownSeconds > 0}>
            {authLoading ? t('Sending... / Đang gửi...') : cooldownSeconds > 0 ? t(`Resend in ${cooldownSeconds}s / Gửi lại sau ${cooldownSeconds} giây`) : t('Send magic link / Gửi magic link')}
          </Button>
        </div>
        {authSuccess ? <Alert tone="success">{t(authSuccess)}</Alert> : null}
        {authError ? (
          <Alert tone="warning">
            {t(authError)}{' '}
            <Button variant="secondary" onClick={() => void onRequestMagicLink(lastAuthEmail || undefined)}>
              {t('Retry / Thử lại')}
            </Button>
          </Alert>
        ) : null}
      </Card>

      <Card className="span-6" title={t('Why Om AI / Vì sao chọn Om AI')}>
        <ul>
          {featurePoints.map((point) => (
            <li key={point}>{t(point)}</li>
          ))}
        </ul>
      </Card>

      <Card className="span-6" title={t('Use cases / Cách dùng thực tế')}>
        <ul>
          {useCases.map((item) => (
            <li key={item}>{t(item)}</li>
          ))}
        </ul>
      </Card>

      <LiveExecutionCard className="span-6" />

      <Card className="span-6" id="planner" title={t('Planner / Bộ lập kế hoạch')}>
        <div className="controls">
          <Input value={input} onChange={(e) => setInput(e.target.value)} aria-label={t('Describe what you want / Mô tả điều bạn muốn')} placeholder={t('Describe what you want / Mô tả điều bạn muốn')} />
        <Button onClick={onPlan} disabled={planning}>
          {planning ? t('Planning... / Đang lập kế hoạch...') : t('Plan / Lập kế hoạch')}
        </Button>
        </div>
        {planningError ? <Alert tone="warning">{t('Planner error / Lỗi planner: ')}{planningError}</Alert> : null}
        {planResult ? <Alert>{t('Last plan / Kế hoạch gần nhất: ')}{planResult}</Alert> : null}
        {loadingPlanDetails ? <p>{t('Loading plan details... / Đang tải chi tiết kế hoạch...')}</p> : null}
        {planDetailsError ? <Alert tone="warning">{t('Plan details error / Lỗi chi tiết kế hoạch: ')}{planDetailsError}</Alert> : null}
        {planDetailResult ? <Alert>{t('Plan details / Chi tiết kế hoạch: ')}{planDetailResult}</Alert> : null}
        {approvalsLoading ? <p>{t('Loading approval... / Đang tải phê duyệt...')}</p> : null}
        {approvalsError ? <Alert tone="warning">{t('Approvals error / Lỗi phê duyệt: ')}{approvalsError}</Alert> : null}
        {approvalResult ? <Alert>{t('Approval / Phê duyệt: ')}{approvalResult}</Alert> : null}
      </Card>

      <Card className="span-6" title={t('Scenes / Ngữ cảnh')}>
        {loadingScenes ? <p>{t('Loading scenes... / Đang tải scenes...')}</p> : null}
        {scenesError ? <Alert tone="warning">{t('Scenes error / Lỗi scenes: ')}{scenesError}</Alert> : null}
        {!loadingScenes && !scenesError ? (
          <ul>
            {scenes.map((s) => (
              <li key={s.scene_id}>
                {s.display_name} ({s.safety_class})
                <Button onClick={() => onRunScene(s.scene_id)} variant="secondary" className="ml-8">
                  {t('Run / Chạy')}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        {sceneRunResult ? <Alert>{t('Last scene run / Lần chạy scene gần nhất: ')}{sceneRunResult}</Alert> : null}
      </Card>

      <Card className="span-8" id="activity" title={t('Activity timeline / Nhật ký hoạt động')}>
        <Button onClick={() => void refreshRuns()} disabled={loadingRuns} variant="secondary">
          {loadingRuns ? t('Refreshing... / Đang làm mới...') : t('Refresh / Làm mới')}
        </Button>
        {runsError ? <Alert tone="warning">{t('Runs error / Lỗi runs: ')}{runsError}</Alert> : null}
        {!loadingRuns && !runsError ? (
          <ul>
            {runs.map((r) => (
              <li key={r.run_id}>
                {r.created_at} - {r.source}:{r.source_id} - {r.status} ({r.run_id})
                <Button onClick={() => void onToggleRunDetails(r.run_id)} className="ml-8" variant="secondary">
                  {selectedRunId === r.run_id ? t('Hide details / Ẩn chi tiết') : t('View details / Xem chi tiết')}
                </Button>
                {selectedRunId === r.run_id ? (
                  <div className="meta-line">
                    {loadingRunDetails ? <p>{t('Loading run details... / Đang tải chi tiết run...')}</p> : null}
                    {runDetailsError ? <Alert tone="warning">{t('Run details error / Lỗi chi tiết run: ')}{runDetailsError}</Alert> : null}
                    {selectedRunDetails ? (
                      <p>
                        {t('Activity / Hoạt động: ')}{selectedRunDetails}{' '}
                        <Button variant="secondary" onClick={() => void onCopy(r.run_id)}>
                          {t('Copy run id / Sao chép run id')}
                        </Button>
                      </p>
                    ) : null}
                    {selectedProofDetails ? (
                      <p>
                        {t('Proof / Bằng chứng: ')}{t(selectedProofDetails)}{' '}
                        {selectedProofId ? (
                          <Button variant="secondary" onClick={() => void onCopy(selectedProofId)}>
                            {t('Copy proof id / Sao chép proof id')}
                          </Button>
                        ) : null}
                      </p>
                    ) : null}
                    {selectedRequestedState ? (
                      <>
                        <p>{t('Requested state / Trạng thái yêu cầu')}</p>
                        <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{selectedRequestedState}</pre>
                      </>
                    ) : null}
                    {selectedActualState ? (
                      <>
                        <p>{t('Actual state / Trạng thái thực tế')}</p>
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

      <Card className="span-4" title={t('Devices / Thiết bị')}>
        {loadingDevices ? <p>{t('Loading devices... / Đang tải thiết bị...')}</p> : null}
        {devicesError ? <Alert tone="warning">{t('Device error / Lỗi thiết bị: ')}{devicesError}</Alert> : null}
        {!loadingDevices && !devicesError ? (
          <ul>
            {devices.map((d) => (
              <li key={d.device_id}>{d.display_name} ({d.protocol}) - {d.online_state}</li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card className="span-12" title={t('Store / Bộ nhớ trạng thái')}>
        <Alert>{t('Selected space / Không gian đang chọn: ')}{state.selectedSpaceId ?? t('none / chưa chọn')}</Alert>
        <Button onClick={() => setSelectedSpaceId('space_demo_01')}>{t('Select demo space / Chọn không gian demo')}</Button>
        <Button onClick={() => setSelectedSpaceId(null)} className="ml-8" variant="secondary">{t('Clear / Xóa')}</Button>
      </Card>
      </section>
      </main>

      <footer className="footer">{t('Om AI - reality control and AI human interaction in one governed flow. / Om AI - điều khiển thực tại và tương tác giữa AI và con người trong một luồng được quản trị.')}</footer>
    </div>
  );
}
