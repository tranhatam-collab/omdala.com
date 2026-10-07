import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSecurityAudit } from "./security-audit-gate.mjs";

const advisory = {
  id: 1240992,
  cves: ["CVE-2026-93687"],
  severity: "high",
  module_name: "braces",
  vulnerable_versions: "<=3.0.3",
  github_advisory_id: "GHSA-vfj7-8cjw-p6xm",
  recommendation: "None",
  patched_versions: "<0.0.0",
  findings: [
    {
      version: "3.0.3",
      paths: [
        ". > eslint-config-next@16.3.8 > @next/eslint-plugin-next@16.3.8 > fast-glob@3.3.1 > micromatch@4.0.8 > braces@3.0.3",
      ],
    },
  ],
};

const waiver = {
  githubAdvisoryId: "GHSA-vfj7-8cjw-p6xm",
  registryId: 1240992,
  cves: ["CVE-2026-93687"],
  module: "braces",
  severity: "high",
  scope: "dev-only",
  installedVersions: ["3.0.3"],
  vulnerableVersions: "<=3.0.3",
  patchedVersions: "<0.0.0",
  recommendation: "None",
  dependencyPaths: advisory.findings[0].paths,
  directDevDependency: "eslint-config-next",
  owner: "Team 1 Release Engineering",
  reason: "No patched release exists for the exact dev-only lint dependency path.",
  createdOn: "2026-10-08",
  expiresOn: "2026-10-22",
};

const rootPackage = {
  devDependencies: { "eslint-config-next": "16.3.8" },
};

function report(advisories = []) {
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
  for (const entry of advisories) counts[entry.severity] += 1;
  return {
    actions: [],
    advisories: Object.fromEntries(advisories.map((entry) => [String(entry.id), entry])),
    muted: [],
    metadata: { vulnerabilities: counts },
  };
}

function evaluate({ prod = [], dev = [advisory], waiverOverride = waiver, today = "2026-10-08" } = {}) {
  return evaluateSecurityAudit({
    productionReport: report(prod),
    developmentReport: report(dev),
    waiverManifest: { schemaVersion: 1, waivers: [waiverOverride] },
    rootPackage,
    today,
  });
}

test("accepts only the exact unpatched dev-only advisory", () => {
  const result = evaluate();
  assert.equal(result.ok, true);
  assert.equal(result.blocked.length, 0);
  assert.deepEqual(result.waived.map((entry) => entry.githubAdvisoryId), [
    "GHSA-vfj7-8cjw-p6xm",
  ]);
});

test("rejects the same advisory in production", () => {
  const result = evaluate({ prod: [advisory] });
  assert.equal(result.ok, false);
  assert.match(result.blocked[0].reason, /production high\/critical/);
});

test("rejects an unexpected development high advisory", () => {
  const unexpected = {
    ...advisory,
    id: 9999999,
    github_advisory_id: "GHSA-aaaa-bbbb-cccc",
  };
  const result = evaluate({ dev: [advisory, unexpected] });
  assert.equal(result.ok, false);
  assert.ok(result.blocked.some((entry) => entry.githubAdvisoryId === "GHSA-aaaa-bbbb-cccc"));
});

test("rejects a changed dependency path", () => {
  const changed = structuredClone(advisory);
  changed.findings[0].paths = [
    ". > another-tool@1.0.0 > micromatch@4.0.8 > braces@3.0.3",
  ];
  const result = evaluate({ dev: [changed] });
  assert.equal(result.ok, false);
  assert.match(result.blocked[0].reason, /dependency path changed/);
});

test("rejects newly available remediation", () => {
  const patched = { ...advisory, patched_versions: ">=3.0.4", recommendation: "Upgrade" };
  const result = evaluate({ dev: [patched] });
  assert.equal(result.ok, false);
  assert.match(result.blocked[0].reason, /patch availability changed/);
});

test("rejects an expired waiver", () => {
  assert.throws(() => evaluate({ today: "2026-10-23" }), /waiver expired/);
});

test("rejects a registry-muted advisory list", () => {
  const developmentReport = report([advisory]);
  developmentReport.muted = [{ id: advisory.id }];
  assert.throws(
    () =>
      evaluateSecurityAudit({
        productionReport: report(),
        developmentReport,
        waiverManifest: { schemaVersion: 1, waivers: [waiver] },
        rootPackage,
        today: "2026-10-08",
      }),
    /registry-muted advisories/,
  );
});

test("rejects a stale waiver once the advisory disappears", () => {
  const result = evaluate({ dev: [] });
  assert.equal(result.ok, false);
  assert.match(result.blocked[0].reason, /waiver is stale/);
});
