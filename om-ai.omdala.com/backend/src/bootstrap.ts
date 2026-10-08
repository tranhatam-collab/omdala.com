import { persistence } from './persistence.js';
import { nowIso } from './utils.js';

async function run() {
  const samplePlanId = 'plan_sample_01';
  const sampleApprovalId = 'approval_sample_01';
  const sampleProofId = 'proof_sample_01';

  await persistence.putPlan({
    plan_id: samplePlanId,
    role: 'owner',
    actionClass: 'low',
    policy_decision: 'allow_with_logging',
    steps: [
      {
        step_id: '1',
        executor: 'native_homekit',
        target_id: 'light_child_01',
        action: 'set_level',
        params: { value: 30 },
      },
    ],
    created_at: nowIso(),
  });

  await persistence.putApproval({
    approval_id: sampleApprovalId,
    run_id: samplePlanId,
    requested_by: 'user_sample_01',
    status: 'pending',
    reason: 'Sample seeded approval',
    updated_at: nowIso(),
  });

  await persistence.putProof({
    proofId: sampleProofId,
    runId: samplePlanId,
    actorId: 'user_sample_01',
    policyDecision: 'allow_with_logging',
    requestedState: { scene: 'sample_scene' },
    actualState: { light_child_01: { level: 30 } },
    confidenceScore: 0.99,
    verifiedAt: nowIso(),
  });

  process.stdout.write('Bootstrap sample data completed\n');
  process.stdout.write(`plan_id=${samplePlanId}\n`);
  process.stdout.write(`approval_id=${sampleApprovalId}\n`);
  process.stdout.write(`proof_id=${sampleProofId}\n`);
}

void run();
