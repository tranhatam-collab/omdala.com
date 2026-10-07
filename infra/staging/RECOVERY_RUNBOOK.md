# OMDALA protected release recovery

Use this runbook when a protected API or surface release is interrupted after a
remote mutation starts. A cancelled or timed-out GitHub runner may stop before
its in-job cleanup executes, so the next operator must reconcile the provider
state before retrying.

## Required evidence

- repository, workflow run ID and attempt;
- exact candidate SHA and release ID;
- protected environment and Cloudflare account ID;
- attempted-mutation marker artifact;
- API pre-deploy version/deployment receipt or the four Pages canonical
  deployment baselines;
- provider readback captured before and after recovery.

Never infer a rollback target from the newest deployment. Use only the baseline
ID recorded before the failed mutation.

## API Worker

1. Download the failed run artifacts and verify the attempted-mutation marker,
   candidate SHA, Worker name, account ID, and pre-deploy version/deployment ID.
2. Read the current Worker versions and deployment split with Wrangler. Stop if
   the account, Worker, or recorded baseline does not match.
3. If the attempted candidate is active, create a deployment that sends exactly
   100 percent of traffic to the recorded baseline version. Do not publish new
   source during recovery.
4. Read the provider state back again and require exactly one version at 100
   percent. Probe `/health` and `/health/deep`; their version identity must equal
   the restored baseline.
5. Upload a recovery receipt containing raw provider responses, hashes, the
   failed run ID, baseline and restored deployment IDs, and probe output.

## Staging static Workers

1. For each attempted surface, load its recorded pre-deploy version list.
2. If the baseline is empty, delete only the exact staging Worker created by the
   failed run after confirming its name and custom domain. Otherwise restore the
   one recorded baseline version to 100 percent.
3. Read back versions and the custom domain. Require either a verified empty
   baseline or exactly one restored version at 100 percent.
4. Probe `release.json`, HTML, `robots.txt`, and `_headers` for all four staging
   domains and save a recovery receipt.

## Production Pages

1. Use the canonical deployment ID captured before the failed upload for each
   Pages project. Confirm Direct Upload authority, locked custom domain and
   expected production branch before rollback.
2. Invoke the Pages rollback operation for only that exact baseline deployment.
3. Read the project again and require `canonical_deployment.id` to equal the
   recorded baseline. Probe the custom domain and `release.json`.
4. Treat a missing Brand project or missing successful canonical baseline as a
   bootstrap blocker. Do not create or attach production resources from a
   recovery attempt.

## Retry gate

A retry needs a new workflow run and release ID. Attach the recovery receipt to
the incident and make the protected lane independently revalidate source,
review, provider state, database backup/restore, asset manifests and runtime
identity. Never reuse a partially accepted release receipt.
