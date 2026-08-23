import test from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

// ─── Persistence Adapter Tests ─────────────────────────────────────────
// Proves that the JsonPersistenceAdapter correctly stores and retrieves
// devices, plans, approvals, aliases, proofs, scenes, and runs.
// Uses NODE_ENV=test so the adapter runs in-memory only.

const TEST_DATA_DIR = 'data-test-persistence';

test('lists default devices after load', async () => {
  process.env.NODE_ENV = 'test';
  process.env.OM_AI_DATA_DIR = TEST_DATA_DIR;
  await rm(join(process.cwd(), TEST_DATA_DIR), { recursive: true, force: true }).catch(() => {});
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const devices = await persistence.listDevices();
  assert.ok(devices.length >= 2, 'should have at least 2 default devices');
  assert.ok(devices.some((d: any) => d.device_id === 'light_child_01'));
});

test('retrieves a specific device by id', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const device = await persistence.getDevice('light_child_01');
  assert.ok(device, 'device should exist');
  assert.equal(device.device_id, 'light_child_01');
  assert.equal(device.display_name, 'Child Room Light');
});

test('returns undefined for unknown device', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const device = await persistence.getDevice('nonexistent_device');
  assert.equal(device, undefined);
});

test('stores and retrieves a plan', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const plan = {
    plan_id: 'plan_test_001',
    display_name: 'Test Plan',
    safety_class: 'low' as const,
    steps: [],
    created_at: new Date().toISOString(),
  };
  await persistence.putPlan(plan);
  const retrieved = await persistence.getPlan('plan_test_001');
  assert.ok(retrieved, 'plan should be retrievable');
  assert.equal(retrieved.plan_id, 'plan_test_001');
  assert.equal(retrieved.display_name, 'Test Plan');
});

test('returns undefined for unknown plan', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const plan = await persistence.getPlan('nonexistent_plan');
  assert.equal(plan, undefined);
});

test('stores and retrieves an approval', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const approval = {
    approval_id: 'approval_test_001',
    plan_id: 'plan_test_001',
    approved_by: 'test_user',
    decision: 'approved' as const,
    created_at: new Date().toISOString(),
  };
  await persistence.putApproval(approval);
  const retrieved = await persistence.getApproval('approval_test_001');
  assert.ok(retrieved, 'approval should be retrievable');
  assert.equal(retrieved.approval_id, 'approval_test_001');
  assert.equal(retrieved.decision, 'approved');
});

test('stores and lists aliases', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const alias = {
    alias_id: 'alias_test_001',
    display_name: 'Test Alias',
    target_device_id: 'light_child_01',
    created_at: new Date().toISOString(),
  };
  await persistence.putAlias(alias);
  const aliases = await persistence.listAliases();
  assert.ok(aliases.some((a: any) => a.alias_id === 'alias_test_001'));
});

test('stores and retrieves a proof', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const proof = {
    proofId: 'proof_test_001',
    runId: 'run_test_001',
    type: 'execution_log' as const,
    payload: { log: 'test execution' },
    created_at: new Date().toISOString(),
  };
  await persistence.putProof(proof);
  const retrieved = await persistence.getProof('proof_test_001');
  assert.ok(retrieved, 'proof should be retrievable');
  assert.equal(retrieved.proofId, 'proof_test_001');
});

test('lists default scenes after load', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const scenes = await persistence.listScenes();
  assert.ok(scenes.length >= 1, 'should have at least 1 default scene');
  assert.ok(scenes.some((s: any) => s.scene_id === 'scene_sleep_child'));
});

test('retrieves a specific scene by id', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const scene = await persistence.getScene('scene_sleep_child');
  assert.ok(scene, 'scene should exist');
  assert.equal(scene.scene_id, 'scene_sleep_child');
  assert.equal(scene.display_name, 'Child Sleep Scene');
});

test('stores and retrieves a new scene', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const scene = {
    scene_id: 'scene_test_001',
    display_name: 'Test Scene',
    safety_class: 'low' as const,
    actions: [],
    created_at: new Date().toISOString(),
  };
  await persistence.putScene(scene);
  const retrieved = await persistence.getScene('scene_test_001');
  assert.ok(retrieved, 'scene should be retrievable');
  assert.equal(retrieved.scene_id, 'scene_test_001');
});

test('stores and retrieves an execution run', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const run = {
    run_id: 'run_test_001',
    scene_id: 'scene_sleep_child',
    status: 'completed' as const,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    actions_executed: 1,
  };
  await persistence.putRun(run);
  const retrieved = await persistence.getRun('run_test_001');
  assert.ok(retrieved, 'run should be retrievable');
  assert.equal(retrieved.run_id, 'run_test_001');
  assert.equal(retrieved.status, 'completed');
});

test('lists runs after storing', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const runs = await persistence.listRuns();
  assert.ok(runs.some((r: any) => r.run_id === 'run_test_001'));
});

test('putPlan is idempotent (upsert)', async () => {
  process.env.NODE_ENV = 'test';
  const { persistence } = await import('../src/persistence.js');
  await persistence.ensureLoaded();
  const plan1 = {
    plan_id: 'plan_idem_001',
    display_name: 'Version 1',
    safety_class: 'low' as const,
    steps: [],
    created_at: new Date().toISOString(),
  };
  await persistence.putPlan(plan1);
  const plan2 = {
    plan_id: 'plan_idem_001',
    display_name: 'Version 2',
    safety_class: 'low' as const,
    steps: [],
    created_at: new Date().toISOString(),
  };
  await persistence.putPlan(plan2);
  const retrieved = await persistence.getPlan('plan_idem_001');
  assert.equal(retrieved.display_name, 'Version 2');
});
