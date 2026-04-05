import { createApp } from './app.js';

async function run() {
  const app = createApp();

  const plan = await app.inject({
    method: 'POST',
    url: '/v2/reality/transitions/plan',
    payload: {
      role: 'owner',
      actionClass: 'low',
      businessMode: false,
      raw_input: 'Om, cho phong con ngu',
    },
  });

  const planBody = plan.json() as { data: { plan_id: string } };
  process.stdout.write(`plan_id=${planBody.data.plan_id}\n`);

  const execute = await app.inject({
    method: 'POST',
    url: '/v2/reality/transitions/execute',
    headers: {
      'x-user-id': 'user_demo_01',
      'x-role': 'owner',
    },
    payload: {
      plan_id: planBody.data.plan_id,
      actor_id: 'user_demo_01',
    },
  });

  const executeBody = execute.json() as { data: { run_id: string; proof: { proofId: string } } };
  process.stdout.write(`run_id=${executeBody.data.run_id}\n`);
  process.stdout.write(`proof_id=${executeBody.data.proof.proofId}\n`);

  const approvalReq = await app.inject({
    method: 'POST',
    url: '/v2/reality/approvals/request',
    payload: {
      run_id: executeBody.data.run_id,
      requested_by: 'user_demo_01',
      reason: 'Sensitive demo path',
    },
  });
  const approvalReqBody = approvalReq.json() as { data: { approval: { approval_id: string } } };
  process.stdout.write(`approval_id=${approvalReqBody.data.approval.approval_id}\n`);

  const planFetch = await app.inject({
    method: 'GET',
    url: `/v2/reality/plans/${planBody.data.plan_id}`,
  });
  process.stdout.write(`plan_fetch_status_code=${planFetch.statusCode}\n`);

  const approvalFetch = await app.inject({
    method: 'GET',
    url: `/v2/reality/approvals/${approvalReqBody.data.approval.approval_id}`,
  });
  process.stdout.write(`approval_fetch_status_code=${approvalFetch.statusCode}\n`);

  const approvalConfirm = await app.inject({
    method: 'POST',
    url: `/v2/reality/approvals/${approvalReqBody.data.approval.approval_id}/confirm`,
    headers: {
      'x-user-id': 'user_demo_01',
      'x-role': 'owner',
    },
  });

  const approvalConfirmBody = approvalConfirm.json() as { data: { approval: { status: string } } };
  process.stdout.write(`approval_status=${approvalConfirmBody.data.approval.status}\n`);

  const proof = await app.inject({
    method: 'GET',
    url: `/v2/reality/proofs/${executeBody.data.proof.proofId}`,
  });

  process.stdout.write(`proof_status_code=${proof.statusCode}\n`);
  await app.close();
}

void run();
