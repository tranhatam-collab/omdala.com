import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  PRODUCTION_HOLD_MARKER,
  evaluateProductionTransactionHold,
} from "./production-transaction-hold.mjs";

function actualSources() {
  return {
    apiWorkflow: readFileSync(".github/workflows/deploy.yml", "utf8"),
    surfaceWorkflow: readFileSync(
      ".github/workflows/deploy-surfaces.yml",
      "utf8",
    ),
    productionWorkflow: readFileSync(
      ".github/workflows/production-go-live-e2e.yml",
      "utf8",
    ),
  };
}

describe("production transaction hold", () => {
  it("disables both split production deployment lanes before any release control", () => {
    const result = evaluateProductionTransactionHold(actualSources());
    assert.equal(result.accepted, true, JSON.stringify(result.checks));
    assert.equal(result.verdict, "PRODUCTION_SPLIT_RELEASE_DISABLED");
  });

  for (const lane of ["apiWorkflow", "surfaceWorkflow"]) {
    it(`rejects removal of the ${lane} production hold`, () => {
      const sources = actualSources();
      sources[lane] = sources[lane].replace(PRODUCTION_HOLD_MARKER, "REMOVED");
      const result = evaluateProductionTransactionHold(sources);
      assert.equal(result.accepted, false);
    });

    it(`rejects moving the ${lane} hold after the trusted control plane starts`, () => {
      const sources = actualSources();
      const blockPattern = /      - name: Require the single staging transaction caller before mutation[\s\S]*?(?=\n      - )/;
      const [block] = sources[lane].match(blockPattern) ?? [];
      assert.ok(block);
      sources[lane] = sources[lane].replace(blockPattern, "");
      sources[lane] = `${sources[lane]}\n${block}`;
      const result = evaluateProductionTransactionHold(sources);
      assert.equal(result.accepted, false);
    });

    it(`rejects direct dispatch exposure for the ${lane} child workflow`, () => {
      const sources = actualSources();
      sources[lane] = sources[lane].replace(
        "  workflow_call:",
        "  workflow_dispatch:\n  workflow_call:",
      );
      const result = evaluateProductionTransactionHold(sources);
      assert.equal(result.accepted, false);
    });
  }

  it("rejects removal of the production acceptance hold", () => {
    const sources = actualSources();
    const markerIndex = sources.productionWorkflow.indexOf(
      PRODUCTION_HOLD_MARKER,
    );
    assert.ok(markerIndex >= 0);
    sources.productionWorkflow =
      sources.productionWorkflow.slice(0, markerIndex) +
      "REMOVED_PRODUCTION_HOLD" +
      sources.productionWorkflow.slice(markerIndex + PRODUCTION_HOLD_MARKER.length);
    const result = evaluateProductionTransactionHold(sources);
    assert.equal(result.accepted, false);
  });

  it("rejects bypassing the production acceptance hold dependency", () => {
    const sources = actualSources();
    sources.productionWorkflow = sources.productionWorkflow.replace(
      "    needs: production-atomicity-hold\n",
      "",
    );
    const result = evaluateProductionTransactionHold(sources);
    assert.equal(result.accepted, false);
  });
});
