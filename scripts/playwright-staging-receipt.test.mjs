import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluatePlaywrightReport } from "./playwright-staging-receipt.mjs";

function report(statuses = ["passed", "passed", "passed", "passed"]) {
  const expected = statuses.filter((status) => status === "passed").length;
  return {
    suites: [
      {
        specs: statuses.map((resultStatus, index) => ({
          title: `scenario ${index + 1}`,
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
});
