import type { PersistenceAdapter } from '../persistence.js';
import type { ApprovalRecord, Device, ExecutionRunRecord, MemoryAlias, PlanRecord, ProofRecord, SceneRecord } from '../types.js';

export class SqlitePersistenceAdapter implements PersistenceAdapter {
  async ensureLoaded() {}

  async listDevices(): Promise<Device[]> {
    throw new Error('not_implemented');
  }

  async getDevice(_deviceId: string): Promise<Device | undefined> {
    throw new Error('not_implemented');
  }

  async putPlan(_plan: PlanRecord): Promise<PlanRecord> {
    throw new Error('not_implemented');
  }

  async getPlan(_planId: string): Promise<PlanRecord | undefined> {
    throw new Error('not_implemented');
  }

  async putApproval(_approval: ApprovalRecord): Promise<ApprovalRecord> {
    throw new Error('not_implemented');
  }

  async getApproval(_approvalId: string): Promise<ApprovalRecord | undefined> {
    throw new Error('not_implemented');
  }

  async listAliases(): Promise<MemoryAlias[]> {
    throw new Error('not_implemented');
  }

  async putAlias(_alias: MemoryAlias): Promise<MemoryAlias> {
    throw new Error('not_implemented');
  }

  async putProof(_proof: ProofRecord): Promise<ProofRecord> {
    throw new Error('not_implemented');
  }

  async getProof(_proofId: string): Promise<ProofRecord | undefined> {
    throw new Error('not_implemented');
  }

  async listScenes(): Promise<SceneRecord[]> {
    throw new Error('not_implemented');
  }

  async getScene(_sceneId: string): Promise<SceneRecord | undefined> {
    throw new Error('not_implemented');
  }

  async putScene(_scene: SceneRecord): Promise<SceneRecord> {
    throw new Error('not_implemented');
  }

  async listRuns(): Promise<ExecutionRunRecord[]> {
    throw new Error('not_implemented');
  }

  async getRun(_runId: string): Promise<ExecutionRunRecord | undefined> {
    throw new Error('not_implemented');
  }

  async putRun(_run: ExecutionRunRecord): Promise<ExecutionRunRecord> {
    throw new Error('not_implemented');
  }
}
