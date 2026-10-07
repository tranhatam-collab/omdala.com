import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = resolve(scriptDirectory, "..");
const blockingSeverities = new Set(["high", "critical"]);

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireStringArray(value, label) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((entry) => typeof entry !== "string" || entry.trim() === "")
  ) {
    throw new Error(`${label} must be a non-empty string array`);
  }
  return value;
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function equalStringSets(left, right) {
  return JSON.stringify(sortedUnique(left)) === JSON.stringify(sortedUnique(right));
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);
}

function packageNameFromPathSegment(segment) {
  const trimmed = segment.trim();
  if (trimmed === ".") return trimmed;
  const versionSeparator = trimmed.lastIndexOf("@");
  return versionSeparator > 0 ? trimmed.slice(0, versionSeparator) : trimmed;
}

function directPackageFromAuditPath(auditPath) {
  const segments = auditPath.split(/\s*>\s*/).filter(Boolean);
  if (segments[0] !== "." || segments.length < 2) return "";
  return packageNameFromPathSegment(segments[1]);
}

function validateAuditReport(report, scope) {
  requireObject(report, `${scope} audit report`);
  const advisories = requireObject(report.advisories, `${scope}.advisories`);
  const metadata = requireObject(report.metadata, `${scope}.metadata`);
  const vulnerabilities = requireObject(
    metadata.vulnerabilities,
    `${scope}.metadata.vulnerabilities`,
  );

  for (const severity of ["info", "low", "moderate", "high", "critical"]) {
    if (!Number.isInteger(vulnerabilities[severity]) || vulnerabilities[severity] < 0) {
      throw new Error(`${scope}.metadata.vulnerabilities.${severity} must be a non-negative integer`);
    }
  }
  if (!Array.isArray(report.muted)) {
    throw new Error(`${scope}.muted must be an array`);
  }
  if (report.muted.length !== 0) {
    throw new Error(`${scope} audit contains registry-muted advisories; repository waivers are the only allowed exception mechanism`);
  }

  for (const [registryKey, advisoryValue] of Object.entries(advisories)) {
    const advisory = requireObject(advisoryValue, `${scope}.advisories.${registryKey}`);
    if (String(advisory.id) !== registryKey) {
      throw new Error(`${scope} advisory registry key ${registryKey} does not match advisory.id`);
    }
    requireString(advisory.github_advisory_id, `${scope}.${registryKey}.github_advisory_id`);
    requireString(advisory.module_name, `${scope}.${registryKey}.module_name`);
    requireString(advisory.severity, `${scope}.${registryKey}.severity`);
    if (!Array.isArray(advisory.findings) || advisory.findings.length === 0) {
      throw new Error(`${scope}.${registryKey}.findings must be non-empty`);
    }
  }

  const enumeratedBlocking = Object.values(advisories).filter((advisory) =>
    blockingSeverities.has(advisory.severity),
  );
  const metadataBlocking = vulnerabilities.high + vulnerabilities.critical;
  if (metadataBlocking !== enumeratedBlocking.length) {
    throw new Error(
      `${scope} audit metadata reports ${metadataBlocking} high/critical advisories but ${enumeratedBlocking.length} were enumerated`,
    );
  }

  return { advisories, vulnerabilities };
}

function validateWaiverManifest(manifest, today) {
  requireObject(manifest, "waiver manifest");
  if (manifest.schemaVersion !== 1) {
    throw new Error("waiver manifest schemaVersion must equal 1");
  }
  if (!Array.isArray(manifest.waivers)) {
    throw new Error("waiver manifest waivers must be an array");
  }

  const seen = new Set();
  for (const [index, waiverValue] of manifest.waivers.entries()) {
    const label = `waivers[${index}]`;
    const waiver = requireObject(waiverValue, label);
    const ghsa = requireString(waiver.githubAdvisoryId, `${label}.githubAdvisoryId`);
    if (!/^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(ghsa)) {
      throw new Error(`${label}.githubAdvisoryId is invalid`);
    }
    if (seen.has(ghsa)) throw new Error(`duplicate waiver for ${ghsa}`);
    seen.add(ghsa);

    if (!Number.isInteger(waiver.registryId) || waiver.registryId <= 0) {
      throw new Error(`${label}.registryId must be a positive integer`);
    }
    requireStringArray(waiver.cves, `${label}.cves`);
    requireString(waiver.module, `${label}.module`);
    requireString(waiver.severity, `${label}.severity`);
    if (!blockingSeverities.has(waiver.severity)) {
      throw new Error(`${label}.severity must be high or critical`);
    }
    if (waiver.scope !== "dev-only") {
      throw new Error(`${label}.scope must equal dev-only`);
    }
    requireStringArray(waiver.installedVersions, `${label}.installedVersions`);
    requireString(waiver.vulnerableVersions, `${label}.vulnerableVersions`);
    requireString(waiver.patchedVersions, `${label}.patchedVersions`);
    requireString(waiver.recommendation, `${label}.recommendation`);
    requireStringArray(waiver.dependencyPaths, `${label}.dependencyPaths`);
    requireString(waiver.directDevDependency, `${label}.directDevDependency`);
    requireString(waiver.owner, `${label}.owner`);
    requireString(waiver.reason, `${label}.reason`);
    if (!isIsoDate(waiver.createdOn)) throw new Error(`${label}.createdOn must be YYYY-MM-DD`);
    if (!isIsoDate(waiver.expiresOn)) throw new Error(`${label}.expiresOn must be YYYY-MM-DD`);
    if (waiver.createdOn > waiver.expiresOn) {
      throw new Error(`${label}.expiresOn precedes createdOn`);
    }
    if (today > waiver.expiresOn) {
      throw new Error(`${ghsa} waiver expired on ${waiver.expiresOn}`);
    }
  }
  return manifest.waivers;
}

function advisoryEvidence(advisory) {
  const findings = advisory.findings ?? [];
  return {
    installedVersions: sortedUnique(findings.map((finding) => String(finding.version))),
    dependencyPaths: sortedUnique(
      findings.flatMap((finding) =>
        Array.isArray(finding.paths) ? finding.paths.map((entry) => String(entry)) : [],
      ),
    ),
  };
}

function waiverMismatch(advisory, waiver, rootPackage) {
  const evidence = advisoryEvidence(advisory);
  const cves = Array.isArray(advisory.cves) ? advisory.cves.map(String) : [];
  const checks = [
    [Number(advisory.id) === waiver.registryId, "registry ID changed"],
    [equalStringSets(cves, waiver.cves), "CVE set changed"],
    [advisory.module_name === waiver.module, "module changed"],
    [advisory.severity === waiver.severity, "severity changed"],
    [
      equalStringSets(evidence.installedVersions, waiver.installedVersions),
      "installed version set changed",
    ],
    [advisory.vulnerable_versions === waiver.vulnerableVersions, "vulnerable range changed"],
    [advisory.patched_versions === waiver.patchedVersions, "patch availability changed"],
    [advisory.recommendation === waiver.recommendation, "registry recommendation changed"],
    [equalStringSets(evidence.dependencyPaths, waiver.dependencyPaths), "dependency path changed"],
    [
      waiver.dependencyPaths.every(
        (auditPath) => directPackageFromAuditPath(auditPath) === waiver.directDevDependency,
      ),
      "waived path does not begin at the declared direct dev dependency",
    ],
    [
      Object.hasOwn(rootPackage.devDependencies ?? {}, waiver.directDevDependency),
      "declared direct dependency is absent from root devDependencies",
    ],
    [
      !Object.hasOwn(rootPackage.dependencies ?? {}, waiver.directDevDependency) &&
        !Object.hasOwn(rootPackage.optionalDependencies ?? {}, waiver.directDevDependency),
      "declared direct dependency is present in a production dependency set",
    ],
  ];
  return checks.filter(([matches]) => !matches).map(([, reason]) => reason);
}

export function evaluateSecurityAudit({
  productionReport,
  developmentReport,
  waiverManifest,
  rootPackage,
  today = new Date().toISOString().slice(0, 10),
}) {
  if (!isIsoDate(today)) throw new Error("today must be YYYY-MM-DD");
  const production = validateAuditReport(productionReport, "production");
  const development = validateAuditReport(developmentReport, "development");
  const waivers = validateWaiverManifest(waiverManifest, today);
  requireObject(rootPackage, "root package.json");

  const blocked = [];
  const waived = [];
  const usedWaivers = new Set();

  for (const advisory of Object.values(production.advisories)) {
    if (!blockingSeverities.has(advisory.severity)) continue;
    blocked.push({
      scope: "production",
      githubAdvisoryId: advisory.github_advisory_id,
      module: advisory.module_name,
      reason: "production high/critical advisories cannot be waived",
    });
  }

  for (const advisory of Object.values(development.advisories)) {
    if (!blockingSeverities.has(advisory.severity)) continue;
    const waiver = waivers.find(
      (candidate) => candidate.githubAdvisoryId === advisory.github_advisory_id,
    );
    if (!waiver) {
      blocked.push({
        scope: "development",
        githubAdvisoryId: advisory.github_advisory_id,
        module: advisory.module_name,
        reason: "no exact repository waiver",
      });
      continue;
    }
    const mismatches = waiverMismatch(advisory, waiver, rootPackage);
    if (mismatches.length !== 0) {
      blocked.push({
        scope: "development",
        githubAdvisoryId: advisory.github_advisory_id,
        module: advisory.module_name,
        reason: mismatches.join("; "),
      });
      continue;
    }
    usedWaivers.add(waiver.githubAdvisoryId);
    waived.push({
      scope: "development",
      githubAdvisoryId: advisory.github_advisory_id,
      module: advisory.module_name,
      owner: waiver.owner,
      expiresOn: waiver.expiresOn,
      dependencyPaths: advisoryEvidence(advisory).dependencyPaths,
    });
  }

  for (const waiver of waivers) {
    if (!usedWaivers.has(waiver.githubAdvisoryId)) {
      blocked.push({
        scope: "development",
        githubAdvisoryId: waiver.githubAdvisoryId,
        module: waiver.module,
        reason: "waiver is stale or the advisory is no longer present",
      });
    }
  }

  return {
    ok: blocked.length === 0,
    today,
    counts: {
      production: production.vulnerabilities,
      development: development.vulnerabilities,
    },
    waived,
    blocked,
  };
}

function pnpmInvocation(environment = process.env) {
  const npmExecPath = environment.npm_execpath;
  if (npmExecPath && /pnpm(?:\.c?js|\.mjs)?$/.test(npmExecPath)) {
    return { command: process.execPath, prefixArguments: [npmExecPath] };
  }
  return { command: "corepack", prefixArguments: ["pnpm"] };
}

function runPnpm(argumentsList, repositoryRoot) {
  const invocation = pnpmInvocation();
  const result = spawnSync(invocation.command, [...invocation.prefixArguments, ...argumentsList], {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: "1" },
  });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`pnpm ${argumentsList.join(" ")} ended on signal ${result.signal}`);
  return result;
}

function runAudit(scope, repositoryRoot) {
  const result = runPnpm(["audit", `--${scope}`, "--json"], repositoryRoot);
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch (error) {
    const stderr = result.stderr.trim().slice(0, 1000);
    throw new Error(
      `pnpm audit --${scope} did not return valid JSON (exit ${result.status}): ${stderr || error.message}`,
    );
  }
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`pnpm audit --${scope} exited with unexpected status ${result.status}`);
  }
  return report;
}

export function runSecurityAuditGate({ repositoryRoot = defaultRepositoryRoot } = {}) {
  const rootPackage = JSON.parse(readFileSync(join(repositoryRoot, "package.json"), "utf8"));
  const waiverManifest = JSON.parse(
    readFileSync(join(repositoryRoot, "config", "security-audit-waivers.json"), "utf8"),
  );
  const expectedPnpm = requireString(rootPackage.packageManager, "packageManager").replace(
    /^pnpm@/,
    "",
  );
  const versionResult = runPnpm(["--version"], repositoryRoot);
  const actualPnpm = versionResult.stdout.trim();
  if (versionResult.status !== 0 || actualPnpm !== expectedPnpm) {
    throw new Error(`security audit requires pnpm ${expectedPnpm}; received ${actualPnpm || "unknown"}`);
  }

  const productionReport = runAudit("prod", repositoryRoot);
  const developmentReport = runAudit("dev", repositoryRoot);
  return {
    pnpmVersion: actualPnpm,
    ...evaluateSecurityAudit({
      productionReport,
      developmentReport,
      waiverManifest,
      rootPackage,
    }),
  };
}

function printResult(result) {
  const lines = [
    `security-audit-gate ${result.ok ? "PASS" : "FAIL"}`,
    `pnpm=${result.pnpmVersion}`,
    `production high=${result.counts.production.high} critical=${result.counts.production.critical}`,
    `development high=${result.counts.development.high} critical=${result.counts.development.critical}`,
  ];
  for (const waiver of result.waived) {
    lines.push(
      `waived ${waiver.githubAdvisoryId} module=${waiver.module} owner=${waiver.owner} expires=${waiver.expiresOn}`,
    );
  }
  for (const blocker of result.blocked) {
    lines.push(
      `blocked ${blocker.scope} ${blocker.githubAdvisoryId} module=${blocker.module}: ${blocker.reason}`,
    );
  }
  console.log(lines.join("\n"));
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  try {
    const result = runSecurityAuditGate();
    printResult(result);
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(`security-audit-gate ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
