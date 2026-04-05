import { getJson, postJson } from './client';
import {
  type ApiEnvelope,
  type ApiCallResult,
  type PlanRecord,
  type ApprovalRecord,
  type DeviceRecord,
  type SceneRecord,
  type SceneRunRecord,
  type RunRecord,
  type ProofRecord,
} from '../../../shared/api-contracts';

function fail<T>(error: string): ApiCallResult<T> {
  return { value: null, error };
}

export async function listRuns(limit = 20): Promise<ApiCallResult<RunRecord[]>> {
  const result = await getJson<ApiEnvelope<{ runs: RunRecord[] }>>(`/v2/reality/runs?page=1&limit=${limit}`);
  if (result.error) return fail(result.error);
  return { value: result.data?.data.runs ?? [], error: null };
}

export async function getRun(runId: string): Promise<ApiCallResult<RunRecord>> {
  const result = await getJson<ApiEnvelope<{ run: RunRecord }>>(`/v2/reality/runs/${runId}`);
  if (result.error || !result.data?.data.run) return fail(result.error ?? 'run_not_found');
  return { value: result.data.data.run, error: null };
}

export async function getProof(proofId: string): Promise<ApiCallResult<ProofRecord>> {
  const result = await getJson<ApiEnvelope<{ proof: ProofRecord }>>(`/v2/reality/proofs/${proofId}`);
  if (result.error || !result.data?.data.proof) return fail(result.error ?? 'proof_not_found');
  return { value: result.data.data.proof, error: null };
}

export async function listScenes(): Promise<ApiCallResult<SceneRecord[]>> {
  const result = await getJson<ApiEnvelope<{ scenes: SceneRecord[] }>>('/v2/reality/scenes');
  if (result.error) return fail(result.error);
  return { value: result.data?.data.scenes ?? [], error: null };
}

export async function runScene(sceneId: string): Promise<ApiCallResult<SceneRunRecord>> {
  const result = await postJson<ApiEnvelope<SceneRunRecord>>(`/v2/reality/scenes/${sceneId}/run`, null, {
    'x-user-id': 'app_user',
    'x-role': 'owner',
  });
  if (result.error || !result.data?.data) return fail(result.error ?? 'request_failed');
  return { value: result.data.data, error: null };
}

export async function listDevices(): Promise<ApiCallResult<DeviceRecord[]>> {
  const result = await getJson<ApiEnvelope<{ devices: DeviceRecord[] }>>('/v2/reality/devices');
  if (result.error) return fail(result.error);
  return { value: result.data?.data.devices ?? [], error: null };
}

export async function planTransition(rawInput: string): Promise<ApiCallResult<PlanRecord>> {
  const result = await postJson<ApiEnvelope<PlanRecord>>('/v2/reality/transitions/plan', {
    raw_input: rawInput,
    role: 'owner',
    actionClass: 'low',
    businessMode: false,
  });
  if (result.error || !result.data?.data) return fail(result.error ?? 'request_failed');
  return { value: result.data.data, error: null };
}

export async function requestApproval(runId: string): Promise<ApiCallResult<ApprovalRecord>> {
  const result = await postJson<ApiEnvelope<{ approval: ApprovalRecord }>>('/v2/reality/approvals/request', {
    run_id: runId,
    requested_by: 'app_user',
  });
  if (result.error || !result.data?.data.approval) return fail(result.error ?? 'request_failed');
  return { value: result.data.data.approval, error: null };
}
