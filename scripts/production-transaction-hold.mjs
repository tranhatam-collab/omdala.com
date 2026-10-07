import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const PRODUCTION_HOLD_MARKER =
  "PRODUCTION_HOLD_UNIFIED_TRANSACTION_REQUIRED";

function workflowStep(source, name) {
  const marker = `      - name: ${name}`;
  const start = source.indexOf(marker);
  if (start < 0) return { body: "", start: -1 };
  const end = source.indexOf("\n      - ", start + marker.length);
  return {
    body: source.slice(start, end < 0 ? source.length : end),
    start,
  };
}

export function evaluateProductionTransactionHold({
  apiWorkflow,
  surfaceWorkflow,
  productionWorkflow = "",
}) {
  const checks = [];
  for (const [lane, source] of [
    ["api", apiWorkflow],
    ["surfaces", surfaceWorkflow],
  ]) {
    const guard = workflowStep(
      source,
      "Require the single staging transaction caller before mutation",
    );
    const productionCaseIndex = guard.body.indexOf("production)");
    const markerIndex = guard.body.indexOf(
      PRODUCTION_HOLD_MARKER,
      productionCaseIndex,
    );
    const exitIndex = guard.body.indexOf("exit 1", markerIndex);
    const controlPlaneIndex = source.indexOf(
      "Require the workflow control plane from current main",
    );
    const firstMutationIndex = Math.min(
      ...[
        source.indexOf("wrangler deploy"),
        source.indexOf("wrangler pages deploy"),
        source.indexOf("psql "),
      ].filter((index) => index >= 0),
    );
    checks.push({
      id: `${lane.toUpperCase()}_PRODUCTION_SPLIT_LANE_FAILS_CLOSED`,
      pass:
        source.includes("workflow_call:") &&
        !source.includes("workflow_dispatch:") &&
        guard.start >= 0 &&
        guard.body.includes('case "$RELEASE_ENVIRONMENT" in') &&
        guard.body.includes("staging) ;;") &&
        productionCaseIndex >= 0 &&
        markerIndex >= 0 &&
        exitIndex > markerIndex &&
        controlPlaneIndex >= 0 &&
        guard.start < controlPlaneIndex &&
        (Number.isFinite(firstMutationIndex)
          ? guard.start < firstMutationIndex
          : true),
    });
  }
  const holdJobIndex = productionWorkflow.indexOf("  production-atomicity-hold:");
  const holdMarkerIndex = productionWorkflow.indexOf(
    PRODUCTION_HOLD_MARKER,
    holdJobIndex,
  );
  const acceptanceJobIndex = productionWorkflow.indexOf("  production-acceptance:");
  const protectedEnvironmentIndex = productionWorkflow.indexOf(
    "environment: production",
    acceptanceJobIndex,
  );
  const rollbackIndex = productionWorkflow.indexOf(
    "production-cross-workflow-rollback.sh",
    acceptanceJobIndex,
  );
  const holdExitIndex = productionWorkflow.indexOf("exit 1", holdMarkerIndex);
  checks.push({
    id: "PRODUCTION_ACCEPTANCE_AND_ROLLBACK_FAILS_CLOSED",
    pass:
      holdJobIndex >= 0 &&
      holdMarkerIndex > holdJobIndex &&
      holdExitIndex > holdMarkerIndex &&
      acceptanceJobIndex > holdExitIndex &&
      productionWorkflow
        .slice(acceptanceJobIndex, protectedEnvironmentIndex)
        .includes("needs: production-atomicity-hold") &&
      protectedEnvironmentIndex > acceptanceJobIndex &&
      rollbackIndex > protectedEnvironmentIndex,
  });
  return {
    schema_version: 1,
    verdict: checks.every(({ pass }) => pass)
      ? "PRODUCTION_SPLIT_RELEASE_DISABLED"
      : "PRODUCTION_TRANSACTION_HOLD_BYPASSABLE",
    accepted: checks.every(({ pass }) => pass),
    checks,
  };
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("Arguments must use --name value pairs.");
    }
    options[key.slice(2)] = value;
  }
  return options;
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const result = evaluateProductionTransactionHold({
    apiWorkflow: readFileSync(
      options["api-workflow"] ?? ".github/workflows/deploy.yml",
      "utf8",
    ),
    surfaceWorkflow: readFileSync(
      options["surface-workflow"] ?? ".github/workflows/deploy-surfaces.yml",
      "utf8",
    ),
    productionWorkflow: readFileSync(
      options["production-workflow"] ??
        ".github/workflows/production-go-live-e2e.yml",
      "utf8",
    ),
  });
  if (options.receipt) {
    writeFileSync(options.receipt, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  if (!result.accepted) {
    throw new Error(JSON.stringify(result.checks));
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
