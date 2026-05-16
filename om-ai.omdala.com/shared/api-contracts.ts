export const SHARED_API_CONTRACT_VERSION = '1.0.0' as const;

export type ApiEnvelope<T> = {
  data: T;
  error?: string | null;
  meta?: Record<string, unknown>;
};

export type ApiCallResult<T> = {
  value: T | null;
  error: string | null;
};

export type PlanRecord = {
  plan_id: string;
  policy_decision: string;
};

export type ApprovalRecord = {
  approval_id: string;
  status: string;
};

export type DeviceRecord = {
  device_id: string;
  display_name: string;
  protocol: string;
  online_state: string;
};

export type SceneRecord = {
  scene_id: string;
  display_name: string;
  safety_class: string;
};

export type SceneRunRecord = {
  run_id: string;
  scene_id: string;
  status: string;
};

export type RunRecord = {
  run_id: string;
  source: 'device' | 'transition' | 'scene';
  source_id: string;
  actor_id: string;
  status: 'queued' | 'running' | 'partial_success' | 'succeeded' | 'failed';
  policy_decision?: string;
  proof_id?: string;
  created_at: string;
};

export type ProofRecord = {
  proofId: string;
  runId: string;
  actorId: string;
  policyDecision?: string;
  requestedState: Record<string, unknown>;
  actualState: Record<string, unknown>;
  confidenceScore: number;
  verifiedAt: string;
};

export type SessionTokenPayload = {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
};
