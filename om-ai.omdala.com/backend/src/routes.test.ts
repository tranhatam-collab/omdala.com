import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';

test('planner returns plan id and policy decision', async () => {
  const app = createApp();
  const response = await app.inject({
    method: 'POST',
    url: '/v2/reality/transitions/plan',
    payload: {
      role: 'owner',
      actionClass: 'low',
      raw_input: 'Om, turn on lights',
    },
  });

  assert.equal(response.statusCode, 200);
  const body = response.json() as { data: { plan_id: string; policy_decision: string }; error: null };
  assert.equal(body.error, null);
  assert.ok(body.data.plan_id);
  assert.ok(body.data.policy_decision);
  await app.close();
});

test('approval request and confirm flow works', async () => {
  const app = createApp();

  const requested = await app.inject({
    method: 'POST',
    url: '/v2/reality/approvals/request',
    payload: {
      run_id: 'run_demo_01',
      requested_by: 'user_demo_01',
    },
  });

  assert.equal(requested.statusCode, 200);
  const requestBody = requested.json() as { data: { approval: { approval_id: string; status: string } } };
  assert.equal(requestBody.data.approval.status, 'pending');

  const confirmed = await app.inject({
    method: 'POST',
    url: `/v2/reality/approvals/${requestBody.data.approval.approval_id}/confirm`,
    headers: {
      'x-user-id': 'user_demo_01',
      'x-role': 'owner',
    },
  });

  assert.equal(confirmed.statusCode, 200);
  const confirmBody = confirmed.json() as { data: { approval: { status: string } } };
  assert.equal(confirmBody.data.approval.status, 'confirmed');
  await app.close();
});

test('execute creates proof and proof fetch works', async () => {
  const app = createApp();

  const plan = await app.inject({
    method: 'POST',
    url: '/v2/reality/transitions/plan',
    payload: {
      role: 'owner',
      actionClass: 'low',
    },
  });
  const planBody = plan.json() as { data: { plan_id: string } };

  const execute = await app.inject({
    method: 'POST',
    url: '/v2/reality/transitions/execute',
    payload: { plan_id: planBody.data.plan_id },
    headers: {
      'x-user-id': 'user_demo_01',
      'x-role': 'owner',
    },
  });

  assert.equal(execute.statusCode, 200);
  const executeBody = execute.json() as { data: { run_id: string; proof: { proofId: string } } };

  const proof = await app.inject({
    method: 'GET',
    url: `/v2/reality/proofs/${executeBody.data.proof.proofId}`,
  });

  assert.equal(proof.statusCode, 200);

  const run = await app.inject({
    method: 'GET',
    url: `/v2/reality/runs/${executeBody.data.run_id}`,
  });
  assert.equal(run.statusCode, 200);
  const runBody = run.json() as {
    data: { run: { run_id: string; source: string; source_id: string; proof_id?: string; status: string } };
  };
  assert.equal(runBody.data.run.run_id, executeBody.data.run_id);
  assert.equal(runBody.data.run.source, 'transition');
  assert.equal(runBody.data.run.source_id, planBody.data.plan_id);
  assert.equal(runBody.data.run.proof_id, executeBody.data.proof.proofId);
  assert.equal(runBody.data.run.status, 'succeeded');

  await app.close();
});

test('can fetch plan by id and approval by id', async () => {
  const app = createApp();

  const plan = await app.inject({
    method: 'POST',
    url: '/v2/reality/transitions/plan',
    payload: {
      role: 'owner',
      actionClass: 'low',
    },
  });
  const planBody = plan.json() as { data: { plan_id: string } };

  const planGet = await app.inject({
    method: 'GET',
    url: `/v2/reality/plans/${planBody.data.plan_id}`,
  });
  assert.equal(planGet.statusCode, 200);

  const approvalReq = await app.inject({
    method: 'POST',
    url: '/v2/reality/approvals/request',
    payload: {
      run_id: 'run_demo_plan_fetch',
    },
  });
  const approvalReqBody = approvalReq.json() as { data: { approval: { approval_id: string } } };

  const approvalGet = await app.inject({
    method: 'GET',
    url: `/v2/reality/approvals/${approvalReqBody.data.approval.approval_id}`,
  });
  assert.equal(approvalGet.statusCode, 200);

  await app.close();
});

test('can list and run scene with proof-ready result', async () => {
  const app = createApp();

  const scenes = await app.inject({
    method: 'GET',
    url: '/v2/reality/scenes',
  });
  assert.equal(scenes.statusCode, 200);
  const scenesBody = scenes.json() as { data: { scenes: Array<{ scene_id: string }> } };
  assert.ok(scenesBody.data.scenes.length > 0);

  const sceneId = scenesBody.data.scenes[0]?.scene_id;
  assert.ok(sceneId);

  const runScene = await app.inject({
    method: 'POST',
    url: `/v2/reality/scenes/${sceneId}/run`,
    headers: {
      'x-user-id': 'user_demo_01',
      'x-role': 'owner',
    },
  });

  assert.equal(runScene.statusCode, 200);
  const runBody = runScene.json() as { data: { run_id: string; scene_id: string; status: string; proof: { proofId: string } } };
  assert.equal(runBody.data.scene_id, sceneId);
  assert.equal(runBody.data.status, 'succeeded');
  assert.ok(runBody.data.proof.proofId);

  const runs = await app.inject({
    method: 'GET',
    url: '/v2/reality/runs?page=1&limit=10',
  });
  assert.equal(runs.statusCode, 200);
  const runsBody = runs.json() as {
    data: { runs: Array<{ run_id: string; source: string; source_id: string; proof_id?: string }> };
  };
  const foundSceneRun = runsBody.data.runs.find((r) => r.run_id === runBody.data.run_id);
  assert.ok(foundSceneRun);
  assert.equal(foundSceneRun?.source, 'scene');
  assert.equal(foundSceneRun?.source_id, sceneId);
  assert.equal(foundSceneRun?.proof_id, runBody.data.proof.proofId);

  await app.close();
});
