import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { validatePublicOrigin } from "../packages/core/src/public-origins.mjs";

export const REQUIRED_SURFACES = Object.freeze(["web", "app", "auth", "brand"]);
const ALLOWED_ENVIRONMENTS = new Set(["staging", "production"]);
const STAGING_WORKER_NAMES = Object.freeze({
  web: "omdala-surface-web-staging",
  app: "omdala-surface-app-staging",
  auth: "omdala-surface-auth-staging",
  brand: "omdala-surface-brand-staging",
});
const PRODUCTION_PAGES_PROJECTS = Object.freeze({
  web: "omdala-web",
  app: "omdala-app",
  auth: "omdala-auth",
  brand: "omdala-brand",
});
const PRODUCTION_HOSTS = Object.freeze({
  web: "omdala.com",
  app: "app.omdala.com",
  auth: "auth.omdala.com",
  brand: "brand.omdala.com",
});
const PRODUCTION_BRANCHES = Object.freeze({
  web: "main",
  app: "main",
  auth: "production",
  brand: "main",
});
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

function requireFullSha(value, label = "candidate SHA") {
  if (!/^[a-f0-9]{40}$/i.test(value ?? "")) {
    throw new Error(`${label} must be a full 40-character Git SHA.`);
  }
  return value.toLowerCase();
}

function requireReleaseId(value) {
  if (!/^[A-Za-z0-9._-]{8,160}$/.test(value ?? "")) {
    throw new Error("Surface release ID contains unsupported characters or has an invalid length.");
  }
  return value;
}

function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return number;
}

function requireSurfaceUrl(value, surface, environment) {
  return validatePublicOrigin(surface, value, environment);
}

export function validateWorkerDeployment(record, { surface, releaseId }) {
  if (
    record?.schema_version !== 1 ||
    record.surface !== surface ||
    record.platform !== "cloudflare-workers-static-assets" ||
    record.worker_name !== STAGING_WORKER_NAMES[surface] ||
    record.release_id !== releaseId ||
    !UUID.test(record.deployment_id ?? "") ||
    !UUID.test(record.version_id ?? "") ||
    !/^[a-f0-9]{64}$/.test(record.version_etag ?? "") ||
    record.secret_inventory_verified !== true ||
    record.pre_secret_inventory_verified !== true ||
    record.post_secret_inventory_verified !== true ||
    record.worker_authority_verified !== true ||
    record.asset_binding_verified !== true ||
    record.asset_binding_name !== "ASSETS" ||
    !/^[a-f0-9]{64}$/.test(
      record.pre_secret_inventory_receipt_sha256 ?? "",
    ) ||
    !/^[a-f0-9]{64}$/.test(
      record.post_secret_inventory_receipt_sha256 ?? "",
    ) ||
    !/^[a-f0-9]{64}$/.test(record.worker_authority_receipt_sha256 ?? "") ||
    (record.previous_deployment_id !== null &&
      !UUID.test(record.previous_deployment_id ?? "")) ||
    (record.previous_version_id !== null &&
      !UUID.test(record.previous_version_id ?? "")) ||
    typeof record.captured_at !== "string" ||
    Number.isNaN(Date.parse(record.captured_at))
  ) {
    throw new Error(`${surface} Worker deployment receipt is invalid.`);
  }
  return record;
}

export function validatePagesDeployment(record, { surface, releaseId, releaseSha }) {
  let deploymentUrl;
  try {
    deploymentUrl = new URL(record?.deployment_url ?? "");
  } catch {
    deploymentUrl = null;
  }
  if (
    record?.schema_version !== 1 ||
    record.surface !== surface ||
    record.platform !== "cloudflare-pages" ||
    record.environment !== "production" ||
    record.release_id !== releaseId ||
    record.source_sha !== releaseSha ||
    record.project_name !== PRODUCTION_PAGES_PROJECTS[surface] ||
    !UUID.test(record.deployment_id ?? "") ||
    (record.previous_deployment_id !== null &&
      !UUID.test(record.previous_deployment_id ?? "")) ||
    !deploymentUrl ||
    deploymentUrl.protocol !== "https:" ||
    !deploymentUrl.hostname.endsWith(".pages.dev") ||
    deploymentUrl.username ||
    deploymentUrl.password ||
    deploymentUrl.port ||
    record.production_branch !== PRODUCTION_BRANCHES[surface] ||
    record.deployment_status !== "success" ||
    record.custom_domain !== PRODUCTION_HOSTS[surface] ||
    record.canonical_after_deploy !== true ||
    typeof record.captured_at !== "string" ||
    Number.isNaN(Date.parse(record.captured_at))
  ) {
    throw new Error(`${surface} Pages deployment receipt is invalid.`);
  }
  return record;
}

export function validateSurfaceManifest(
  manifest,
  { surface, environment, releaseSha, releaseId },
) {
  if (!REQUIRED_SURFACES.includes(surface)) {
    throw new Error(`Unsupported surface: ${surface}`);
  }
  if (!ALLOWED_ENVIRONMENTS.has(environment)) {
    throw new Error("Surface release environment must be staging or production.");
  }
  const expectedSha = requireFullSha(releaseSha, "Surface release SHA");
  const expectedReleaseId = requireReleaseId(releaseId);
  if (
    manifest?.schema_version !== 1 ||
    manifest.surface !== surface ||
    manifest.environment !== environment ||
    manifest.release_sha !== expectedSha ||
    manifest.release_id !== expectedReleaseId ||
    !/^[a-f0-9]{64}$/.test(manifest.asset_manifest_sha256 ?? "") ||
    !Number.isSafeInteger(manifest.asset_file_count) ||
    manifest.asset_file_count <= 0 ||
    typeof manifest.built_at !== "string" ||
    Number.isNaN(Date.parse(manifest.built_at))
  ) {
    throw new Error(`${surface} release manifest does not match the expected release identity.`);
  }
  return manifest;
}

export function createAggregateSurfaceReceipt({
  manifests,
  urls,
  environment,
  candidateSha,
  candidateTreeSha,
  reviewedSha,
  reviewedTreeSha,
  controlPlaneSha,
  stagingTransactionId,
  cloudflareAccountId,
  releaseId,
  sourcePrNumber,
  independentReviewer,
  independentReviewId,
  workflowRunId,
  workflowRunAttempt,
  reusableWorkflowRef,
  reusableWorkflowSha,
  reusableWorkflowPath,
  repository,
  workerDeployments = {},
  pagesDeployments = {},
  createdAt = new Date().toISOString(),
}) {
  if (!ALLOWED_ENVIRONMENTS.has(environment)) {
    throw new Error("Surface release environment must be staging or production.");
  }
  const normalizedSha = requireFullSha(candidateSha);
  const normalizedCandidateTreeSha = requireFullSha(
    candidateTreeSha,
    "Candidate tree SHA",
  );
  const normalizedReviewedSha = requireFullSha(reviewedSha, "Reviewed SHA");
  const normalizedReviewedTreeSha = requireFullSha(
    reviewedTreeSha,
    "Reviewed tree SHA",
  );
  const normalizedControlPlaneSha = requireFullSha(
    controlPlaneSha,
    "Control-plane SHA",
  );
  if (
    environment === "staging" &&
    !/^staging-[1-9][0-9]*-[1-9][0-9]*$/.test(stagingTransactionId ?? "")
  ) {
    throw new Error("Staging transaction ID must bind the workflow run and attempt.");
  }
  if (!/^[a-f0-9]{32}$/.test(cloudflareAccountId ?? "")) {
    throw new Error("Cloudflare account ID must be exactly 32 lowercase hex characters.");
  }
  if (normalizedCandidateTreeSha !== normalizedReviewedTreeSha) {
    throw new Error("Candidate and independently reviewed Git trees must match.");
  }
  if (environment === "staging" && normalizedSha !== normalizedReviewedSha) {
    throw new Error("Staging candidate SHA must equal the independently reviewed SHA.");
  }
  const normalizedReleaseId = requireReleaseId(releaseId);
  if (typeof independentReviewer !== "string" || !independentReviewer.trim()) {
    throw new Error("Independent reviewer is required.");
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repository ?? "")) {
    throw new Error("Repository must use the owner/name form.");
  }
  if (
    reusableWorkflowRef !==
      `${repository}/.github/workflows/deploy-surfaces.yml@${normalizedControlPlaneSha}` ||
    reusableWorkflowSha !== normalizedControlPlaneSha ||
    reusableWorkflowPath !== ".github/workflows/deploy-surfaces.yml"
  ) {
    throw new Error("Surface reusable-workflow identity is not exact current main.");
  }

  const suppliedSurfaces = Object.keys(manifests).sort();
  const expectedSurfaces = [...REQUIRED_SURFACES].sort();
  if (JSON.stringify(suppliedSurfaces) !== JSON.stringify(expectedSurfaces)) {
    throw new Error(`Exactly these surfaces are required: ${REQUIRED_SURFACES.join(", ")}.`);
  }

  const surfaces = {};
  for (const surface of REQUIRED_SURFACES) {
    const entry = manifests[surface];
    const manifest = validateSurfaceManifest(entry.manifest, {
      surface,
      environment,
      releaseSha: normalizedSha,
      releaseId: normalizedReleaseId,
    });
    if (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) {
      throw new Error(`${surface} manifest SHA-256 is invalid.`);
    }
    surfaces[surface] = {
      ...manifest,
      url: requireSurfaceUrl(urls[surface], surface, environment),
      manifest_sha256: entry.sha256,
    };
  }

  const deployments = {};
  const pages = {};
  if (environment === "staging") {
    const suppliedDeployments = Object.keys(workerDeployments).sort();
    if (JSON.stringify(suppliedDeployments) !== JSON.stringify(expectedSurfaces)) {
      throw new Error(
        `Staging requires Worker deployment receipts for: ${REQUIRED_SURFACES.join(", ")}.`,
      );
    }
    for (const surface of REQUIRED_SURFACES) {
      deployments[surface] = validateWorkerDeployment(workerDeployments[surface], {
        surface,
        releaseId: normalizedReleaseId,
      });
    }
    if (Object.keys(pagesDeployments).length > 0) {
      throw new Error("Staging Worker receipts cannot contain production Pages deployments.");
    }
  } else {
    if (Object.keys(workerDeployments).length > 0) {
      throw new Error("Production Pages receipts cannot contain staging Worker deployments.");
    }
    const suppliedPages = Object.keys(pagesDeployments).sort();
    if (JSON.stringify(suppliedPages) !== JSON.stringify(expectedSurfaces)) {
      throw new Error(
        `Production requires Pages deployment receipts for: ${REQUIRED_SURFACES.join(", ")}.`,
      );
    }
    for (const surface of REQUIRED_SURFACES) {
      pages[surface] = validatePagesDeployment(pagesDeployments[surface], {
        surface,
        releaseId: normalizedReleaseId,
        releaseSha: normalizedSha,
      });
    }
  }

  return {
    schema_version: 4,
    verdict: "SURFACE_RELEASE_ACCEPTED",
    environment,
    candidate_sha: normalizedSha,
    candidate_tree_sha: normalizedCandidateTreeSha,
    reviewed_sha: normalizedReviewedSha,
    reviewed_tree_sha: normalizedReviewedTreeSha,
    control_plane_sha: normalizedControlPlaneSha,
    staging_transaction_id:
      environment === "staging" ? stagingTransactionId : null,
    cloudflare_account_id: cloudflareAccountId,
    release_id: normalizedReleaseId,
    source_pr_number: requirePositiveInteger(sourcePrNumber, "Source PR number"),
    independent_reviewer: independentReviewer.trim(),
    independent_review_id: requirePositiveInteger(
      independentReviewId,
      "Independent review ID",
    ),
    workflow_run_id: requirePositiveInteger(workflowRunId, "Workflow run ID"),
    workflow_run_attempt: requirePositiveInteger(
      workflowRunAttempt,
      "Workflow run attempt",
    ),
    reusable_workflow_ref: reusableWorkflowRef,
    reusable_workflow_sha: reusableWorkflowSha,
    reusable_workflow_path: reusableWorkflowPath,
    repository,
    surface_names: [...REQUIRED_SURFACES],
    surfaces,
    worker_deployments: deployments,
    pages_deployments: pages,
    created_at: createdAt,
  };
}

function parseArgs(argv) {
  const values = { manifests: {}, urls: {}, deployments: {}, pagesDeployments: {} };
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith("--") || value === undefined) {
      throw new Error("Surface receipt arguments must use --name value pairs.");
    }
    if (
      name === "--manifest" ||
      name === "--url" ||
      name === "--deployment" ||
      name === "--pages-deployment"
    ) {
      const separator = value.indexOf("=");
      if (separator <= 0) throw new Error(`${name} must use surface=value.`);
      const surface = value.slice(0, separator);
      const item = value.slice(separator + 1);
      const target =
        name === "--manifest"
          ? values.manifests
          : name === "--deployment"
            ? values.deployments
            : name === "--pages-deployment"
              ? values.pagesDeployments
            : values.urls;
      if (target[surface]) throw new Error(`Duplicate ${name} for ${surface}.`);
      target[surface] = item;
    } else {
      values[name.slice(2)] = value;
    }
  }
  return values;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifests = {};
  for (const [surface, path] of Object.entries(args.manifests)) {
    const bytes = readFileSync(path);
    manifests[surface] = {
      manifest: JSON.parse(bytes.toString("utf8")),
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }
  const workerDeployments = {};
  for (const [surface, path] of Object.entries(args.deployments)) {
    workerDeployments[surface] = JSON.parse(readFileSync(path, "utf8"));
  }
  const pagesDeployments = {};
  for (const [surface, path] of Object.entries(args.pagesDeployments)) {
    pagesDeployments[surface] = JSON.parse(readFileSync(path, "utf8"));
  }
  const receipt = createAggregateSurfaceReceipt({
    manifests,
    urls: args.urls,
    environment: args.environment,
    candidateSha: args["candidate-sha"],
    candidateTreeSha: args["candidate-tree-sha"],
    reviewedSha: args["reviewed-sha"],
    reviewedTreeSha: args["reviewed-tree-sha"],
    controlPlaneSha: args["control-plane-sha"],
    stagingTransactionId: args["staging-transaction-id"],
    cloudflareAccountId: args["cloudflare-account-id"],
    releaseId: args["release-id"],
    sourcePrNumber: args["source-pr-number"],
    independentReviewer: args["independent-reviewer"],
    independentReviewId: args["independent-review-id"],
    workflowRunId: args["workflow-run-id"],
    workflowRunAttempt: args["workflow-run-attempt"],
    reusableWorkflowRef: args["reusable-workflow-ref"],
    reusableWorkflowSha: args["reusable-workflow-sha"],
    reusableWorkflowPath: args["reusable-workflow-path"],
    repository: args.repository,
    workerDeployments,
    pagesDeployments,
  });
  if (!args.output) throw new Error("--output is required.");
  writeFileSync(args.output, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
