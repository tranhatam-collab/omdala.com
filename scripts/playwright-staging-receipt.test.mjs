import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canonicalPlaywrightProjectionSha256,
  evaluatePlaywrightReport,
  EXPECTED_STAGING_SCENARIOS,
} from "./playwright-staging-receipt.mjs";

function report(statuses = ["passed", "passed", "passed", "passed"]) {
  const expected = statuses.filter((status) => status === "passed").length;
  return {
    suites: [
      {
        specs: statuses.map((resultStatus, index) => ({
          title: EXPECTED_STAGING_SCENARIOS[index]?.title ?? `unexpected scenario ${index + 1}`,
          tests: [
            {
              status: resultStatus === "passed" ? "expected" : "unexpected",
              results: [{ status: resultStatus }],
            },
          ],
        })),
      },
    ],
    stats: {
      expected,
      unexpected: statuses.length - expected,
      flaky: 0,
      skipped: 0,
    },
  };
}

describe("staging Playwright receipt", () => {
  it("accepts exactly four executed and passing scenarios", () => {
    const result = evaluatePlaywrightReport(report());
    assert.equal(result.accepted, true);
    assert.equal(result.executedAndPassedCount, 4);
  });

  it("rejects a discovered test that was not executed", () => {
    const candidate = report();
    candidate.suites[0].specs[3].tests[0].results = [];
    const result = evaluatePlaywrightReport(candidate);
    assert.equal(result.accepted, false);
  });

  it("rejects any unexpected test result", () => {
    const result = evaluatePlaywrightReport(
      report(["passed", "passed", "failed", "passed"]),
    );
    assert.equal(result.accepted, false);
  });

  it("rejects a report with fewer than four scenarios", () => {
    const result = evaluatePlaywrightReport(
      report(["passed", "passed", "passed"]),
    );
    assert.equal(result.accepted, false);
  });

  it("rejects and never copies candidate-controlled titles or extra stats", () => {
    const candidate = report();
    candidate.suites[0].specs[0].title = "leaked-test-secret";
    candidate.stats.accidental_secret = "leaked-test-secret";
    const result = evaluatePlaywrightReport(candidate);
    assert.equal(result.accepted, false);
    assert.equal(JSON.stringify(result).includes("leaked-test-secret"), false);
    assert.deepEqual(Object.keys(result.stats).sort(), ["expected", "flaky", "skipped", "unexpected"]);
  });

  it("hashes only the canonical validated projection, never ignored candidate report bytes", () => {
    const first = report();
    const second = report();
    first.candidate_covert_field = "secret-bit-zero";
    second.candidate_covert_field = "secret-bit-one";
    first.suites[0].specs[0].tests[0].results[0].ignored = "zero";
    second.suites[0].specs[0].tests[0].results[0].ignored = "one";
    const firstResult = evaluatePlaywrightReport(first);
    const secondResult = evaluatePlaywrightReport(second);
    assert.equal(firstResult.accepted, true);
    assert.equal(secondResult.accepted, true);
    assert.equal(
      canonicalPlaywrightProjectionSha256(firstResult),
      canonicalPlaywrightProjectionSha256(secondResult),
    );
  });
});
