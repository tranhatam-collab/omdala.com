import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  ApprovalRecord,
  Device,
  ExecutionRunRecord,
  MemoryAlias,
  PlanRecord,
  ProofRecord,
  SceneRecord,
} from './types.js';

type PersistedState = {
  devices: Device[];
  plans: PlanRecord[];
  approvals: ApprovalRecord[];
  aliases: MemoryAlias[];
  proofs: ProofRecord[];
  scenes: SceneRecord[];
  runs: ExecutionRunRecord[];
};

const DEFAULT_STATE: PersistedState = {
  devices: [
    {
      device_id: 'light_child_01',
      display_name: 'Child Room Light',
      protocol: 'homekit',
      online_state: 'online',
      safety_class: 'low',
    },
    {
      device_id: 'curtain_child_01',
      display_name: 'Child Room Curtain',
      protocol: 'homekit',
      online_state: 'online',
      safety_class: 'medium',
    },
  ],
  plans: [],
  approvals: [],
  aliases: [],
  proofs: [],
  scenes: [
    {
      scene_id: 'scene_sleep_child',
      display_name: 'Child Sleep Scene',
      safety_class: 'low',
      actions: [
        {
          target_id: 'light_child_01',
          action: 'set_level',
          params: { value: 15 },
        },
      ],
      created_at: new Date().toISOString(),
    },
  ],
  runs: [],
};

export interface PersistenceAdapter {
  ensureLoaded(): Promise<void>;
  listDevices(): Promise<Device[]>;
  getDevice(deviceId: string): Promise<Device | undefined>;
  putPlan(plan: PlanRecord): Promise<PlanRecord>;
  getPlan(planId: string): Promise<PlanRecord | undefined>;
  putApproval(approval: ApprovalRecord): Promise<ApprovalRecord>;
  getApproval(approvalId: string): Promise<ApprovalRecord | undefined>;
  listAliases(): Promise<MemoryAlias[]>;
  putAlias(alias: MemoryAlias): Promise<MemoryAlias>;
  putProof(proof: ProofRecord): Promise<ProofRecord>;
  getProof(proofId: string): Promise<ProofRecord | undefined>;
  listScenes(): Promise<SceneRecord[]>;
  getScene(sceneId: string): Promise<SceneRecord | undefined>;
  putScene(scene: SceneRecord): Promise<SceneRecord>;
  listRuns(): Promise<ExecutionRunRecord[]>;
  getRun(runId: string): Promise<ExecutionRunRecord | undefined>;
  putRun(run: ExecutionRunRecord): Promise<ExecutionRunRecord>;
}

class JsonPersistenceAdapter implements PersistenceAdapter {
  private state: PersistedState = DEFAULT_STATE;
  private loaded = false;
  private readonly filePath = join(process.cwd(), 'data', 'store.json');

  async ensureLoaded() {
    if (this.loaded) return;

    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      this.state = {
        devices: parsed.devices ?? DEFAULT_STATE.devices,
        plans: parsed.plans ?? DEFAULT_STATE.plans,
        approvals: parsed.approvals ?? DEFAULT_STATE.approvals,
        aliases: parsed.aliases ?? DEFAULT_STATE.aliases,
        proofs: parsed.proofs ?? DEFAULT_STATE.proofs,
        scenes: parsed.scenes ?? DEFAULT_STATE.scenes,
        runs: parsed.runs ?? DEFAULT_STATE.runs,
      };
    } catch {
      await this.persist();
    }

    this.loaded = true;
  }

  private async persist() {
    await mkdir(join(process.cwd(), 'data'), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  async listDevices() {
    await this.ensureLoaded();
    return this.state.devices;
  }

  async getDevice(deviceId: string) {
    await this.ensureLoaded();
    return this.state.devices.find((d) => d.device_id === deviceId);
  }

  async putPlan(plan: PlanRecord) {
    await this.ensureLoaded();
    this.state.plans = [...this.state.plans.filter((p) => p.plan_id !== plan.plan_id), plan];
    await this.persist();
    return plan;
  }

  async getPlan(planId: string) {
    await this.ensureLoaded();
    return this.state.plans.find((p) => p.plan_id === planId);
  }

  async putApproval(approval: ApprovalRecord) {
    await this.ensureLoaded();
    this.state.approvals = [...this.state.approvals.filter((a) => a.approval_id !== approval.approval_id), approval];
    await this.persist();
    return approval;
  }

  async getApproval(approvalId: string) {
    await this.ensureLoaded();
    return this.state.approvals.find((a) => a.approval_id === approvalId);
  }

  async listAliases() {
    await this.ensureLoaded();
    return this.state.aliases;
  }

  async putAlias(alias: MemoryAlias) {
    await this.ensureLoaded();
    this.state.aliases = [...this.state.aliases.filter((a) => a.alias_id !== alias.alias_id), alias];
    await this.persist();
    return alias;
  }

  async putProof(proof: ProofRecord) {
    await this.ensureLoaded();
    this.state.proofs = [...this.state.proofs.filter((p) => p.proofId !== proof.proofId), proof];
    await this.persist();
    return proof;
  }

  async getProof(proofId: string) {
    await this.ensureLoaded();
    return this.state.proofs.find((p) => p.proofId === proofId);
  }

  async listScenes() {
    await this.ensureLoaded();
    return this.state.scenes;
  }

  async getScene(sceneId: string) {
    await this.ensureLoaded();
    return this.state.scenes.find((s) => s.scene_id === sceneId);
  }

  async putScene(scene: SceneRecord) {
    await this.ensureLoaded();
    this.state.scenes = [...this.state.scenes.filter((s) => s.scene_id !== scene.scene_id), scene];
    await this.persist();
    return scene;
  }

  async listRuns() {
    await this.ensureLoaded();
    return this.state.runs;
  }

  async getRun(runId: string) {
    await this.ensureLoaded();
    return this.state.runs.find((r) => r.run_id === runId);
  }

  async putRun(run: ExecutionRunRecord) {
    await this.ensureLoaded();
    this.state.runs = [...this.state.runs.filter((r) => r.run_id !== run.run_id), run];
    await this.persist();
    return run;
  }
}

export const persistence: PersistenceAdapter = new JsonPersistenceAdapter();
