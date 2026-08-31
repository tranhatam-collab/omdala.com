import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function evaluateReleaseControlSources(files) {
  const apiDeploy = files.apiDeploy ?? "";
  const surfaceDeploy = files.surfaceDeploy ?? "";
  const staging = files.staging ?? "";
  const independent = files.independent ?? "";
  const codeowners = files.codeowners ?? "";
  const mailE2e = files.mailE2e ?? "";
  const releaseSources = [apiDeploy, surfaceDeploy, staging, independent].join("\n");
  const backupIndex = apiDeploy.indexOf("Backup, restore, and verify before migration");
  const migrationIndex = apiDeploy.indexOf("Apply migrations in lexical order");

  const checks = [
    {
      id: "CODEOWNERS_CRITICAL_PATHS",
      pass:
        codeowners.includes("/.github/workflows/") &&
        codeowners.includes("/infra/postgres/") &&
        codeowners.includes("/services/api/"),
    },
    {
      id: "INDEPENDENT_EXACT_SHA_REVIEW",
      pass:
        independent.includes("release-review-policy.mjs") &&
        independent.includes("github.event.pull_request.head.sha"),
    },
    {
      id: "DEPLOYMENTS_RECHECK_INDEPENDENT_REVIEW",
      pass:
        apiDeploy.includes("release-review-policy.mjs") &&
        surfaceDeploy.includes("release-review-policy.mjs") &&
        staging.includes("release-review-policy.mjs"),
    },
    {
      id: "BACKUP_RESTORE_PRECEDES_MIGRATION",
      pass: backupIndex >= 0 && migrationIndex > backupIndex,
    },
    {
      id: "STAGING_BINDS_RELEASE_RUN_ARTIFACTS",
      pass:
        staging.includes("api_release_run_id") &&
        staging.includes("surface_release_run_id") &&
        staging.includes("omdala-pre-migration-backup-") &&
        staging.includes("database_backup_receipt_sha256") &&
        staging.includes("encrypted_backup_decrypt_verified"),
    },
    {
      id: "PLAYWRIGHT_EXECUTION_RECEIPT",
      pass:
        staging.includes("playwright-staging-receipt.mjs") &&
        staging.includes("staging-e2e-receipt.json"),
    },
    {
      id: "MAIL_PROVIDER_RECEIPT_ASSERTED",
      pass:
        mailE2e.includes('transport: "mail-api"') &&
        mailE2e.includes("providerMessageId: expect.any(String)"),
    },
    {
      id: "NO_CONTINUE_ON_ERROR_IN_RELEASE_CHAIN",
      pass: !/continue-on-error\s*:\s*true/.test(releaseSources),
    },
  ];
  return {
    accepted: checks.every((check) => check.pass),
    checks,
    passed: checks.filter((check) => check.pass).length,
    total: checks.length,
  };
}

function readReleaseSources() {
  return {
    apiDeploy: readFileSync(".github/workflows/deploy.yml", "utf8"),
    surfaceDeploy: readFileSync(".github/workflows/deploy-surfaces.yml", "utf8"),
    staging: readFileSync(".github/workflows/staging-go-live-e2e.yml", "utf8"),
    independent: readFileSync(".github/workflows/independent-review.yml", "utf8"),
    codeowners: readFileSync(".github/CODEOWNERS", "utf8"),
    mailE2e: readFileSync("apps/app/e2e-staging/go-live.spec.ts", "utf8"),
  };
}

function main() {
  const result = evaluateReleaseControlSources(readReleaseSources());
  const receipt = {
    schemaVersion: 1,
    verdict: result.accepted ? "RELEASE_CONTROLS_ACCEPTED" : "RELEASE_CONTROLS_BLOCKED",
    checkedAt: new Date().toISOString(),
    ...result,
  };
  const receiptPath = process.argv[2];
  if (receiptPath) {
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  if (!result.accepted) process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
