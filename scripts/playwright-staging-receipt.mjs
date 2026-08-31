import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function collectTests(suites, target = []) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        target.push({
          title: spec.title,
          status: test.status,
          resultStatuses: (test.results ?? []).map((result) => result.status),
        });
      }
    }
    collectTests(suite.suites, target);
  }
  return target;
}

export function evaluatePlaywrightReport(report, expectedCount = 4) {
  const tests = collectTests(report?.suites);
  const passed = tests.filter(
    (test) =>
      test.status === "expected" &&
      test.resultStatuses.length > 0 &&
      test.resultStatuses.every((status) => status === "passed"),
  );
  const stats = report?.stats ?? {};
  const accepted =
    tests.length === expectedCount &&
    passed.length === expectedCount &&
    Number(stats.expected) === expectedCount &&
    Number(stats.unexpected) === 0 &&
    Number(stats.flaky) === 0 &&
    Number(stats.skipped) === 0;
  return {
    accepted,
    reason: accepted ? "ALL_STAGING_SCENARIOS_EXECUTED" : "STAGING_SCENARIOS_INCOMPLETE",
    expectedCount,
    discoveredCount: tests.length,
    executedAndPassedCount: passed.length,
    stats,
    tests,
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const reportPath = option("--report") ?? "staging-e2e-results.json";
  const receiptPath = option("--receipt") ?? "staging-e2e-receipt.json";
  const expectedCount = Number(option("--expected") ?? 4);
  const candidateSha = option("--sha") ?? process.env.E2E_RELEASE_SHA;
  if (!Number.isInteger(expectedCount) || expectedCount < 1) {
    throw new Error("--expected must be a positive integer");
  }
  if (!candidateSha || !/^[0-9a-f]{40}$/.test(candidateSha)) {
    throw new Error("An exact 40-character --sha is required");
  }
  const reportBytes = readFileSync(reportPath);
  const report = JSON.parse(reportBytes.toString("utf8"));
  const result = evaluatePlaywrightReport(report, expectedCount);
  const receipt = {
    schemaVersion: 1,
    verdict: result.accepted ? "STAGING_E2E_ACCEPTED" : "STAGING_E2E_BLOCKED",
    candidateSha,
    reportSha256: createHash("sha256").update(reportBytes).digest("hex"),
    checkedAt: new Date().toISOString(),
    ...result,
  };
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  if (process.env.GITHUB_OUTPUT && result.accepted) {
    writeFileSync(
      process.env.GITHUB_OUTPUT,
      `executed=${result.executedAndPassedCount}\nreport_sha256=${receipt.reportSha256}\n`,
      { flag: "a" },
    );
  }
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
