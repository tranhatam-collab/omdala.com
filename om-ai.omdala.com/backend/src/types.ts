export type UserRole =
  | 'owner'
  | 'family_admin'
  | 'family_member'
  | 'guest'
  | 'operator'
  | 'facility_admin'
  | 'technician'
  | 'observer';

export type PolicyDecision =
  | 'allow'
  | 'allow_with_logging'
  | 'suggest_only'
  | 'confirm_required'
  | 'location_required'
  | 'time_window_required'
  | 'two_person_approval'
  | 'admin_only'
  | 'denied';

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'partial_success'
  | 'succeeded'
  | 'failed';

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

export type Device = {
  device_id: string;
  display_name: string;
  protocol: 'homekit' | 'matter' | 'ble' | 'local_ip' | 'cloud';
  online_state: 'online' | 'offline';
  safety_class: 'low' | 'medium' | 'sensitive' | 'high' | 'critical';
};

export type PlanStep = {
  step_id: string;
  executor: 'native_homekit' | 'gateway' | 'cloud_connector';
  target_id: string;
  action: string;
  params: Record<string, unknown>;
};

export type PlanRecord = {
  plan_id: string;
  role: UserRole;
  actionClass: 'observe' | 'low' | 'medium' | 'sensitive' | 'high' | 'critical';
  policy_decision: PolicyDecision;
  steps: PlanStep[];
  created_at: string;
};

export type ApprovalRecord = {
  approval_id: string;
  run_id: string;
  requested_by: string;
  status: 'pending' | 'confirmed' | 'rejected';
  reason?: string;
  updated_at: string;
};

export type MemoryAlias = {
  alias_id: string;
  term: string;
  target_id: string;
  updated_at: string;
};

export type SceneAction = {
  target_id: string;
  action: string;
  params: Record<string, unknown>;
};

export type SceneRecord = {
  scene_id: string;
  display_name: string;
  safety_class: 'low' | 'medium' | 'sensitive' | 'high' | 'critical';
  actions: SceneAction[];
  created_at: string;
};

export type ExecutionRunRecord = {
  run_id: string;
  source: 'device' | 'transition' | 'scene';
  source_id: string;
  actor_id: string;
  status: ExecutionStatus;
  policy_decision?: PolicyDecision;
  proof_id?: string;
  created_at: string;
};
