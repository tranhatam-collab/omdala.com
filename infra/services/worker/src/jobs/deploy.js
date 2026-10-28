// Legacy queue deployments are disabled. Staging and production releases must
// run through the protected exact-SHA workflows, where approval, environment
// identity, receipts, rollback, and compensation are enforced.

export const WORKER_DEPLOY_DISABLED =
  'WORKER_DEPLOY_DISABLED_USE_PROTECTED_RELEASE_WORKFLOW';

export async function deployJob() {
  throw new Error(WORKER_DEPLOY_DISABLED);
}
