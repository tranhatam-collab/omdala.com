import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifyApiVersionHyperdrive } from "./verify-api-version-hyperdrive.mjs";

const ID = "57b7076f58be42419276f058a8968187";
const VERSION_ID = "11111111-1111-4111-8111-111111111111";
const RELEASE_ID = "gh-123-1-deadbeef1234";

function providerVersion(bindings) {
  return {
    id: VERSION_ID,
    annotations: { "workers/message": RELEASE_ID },
    resources: { bindings },
  };
}

describe("API provider Hyperdrive evidence", () => {
  it("accepts one exact binding", () => {
    const result = verifyApiVersionHyperdrive({
      version: providerVersion([
        { name: "ENVIRONMENT", type: "plain_text", text: "staging" },
        { name: "HYPERDRIVE", type: "hyperdrive", id: ID },
      ]),
      versionId: VERSION_ID,
      releaseId: RELEASE_ID,
      hyperdriveId: ID,
    });
    assert.equal(result.binding_verified, true);
    assert.equal(result.hyperdrive_id, ID);
  });

  it("rejects an unavailable binding schema", () => {
    assert.throws(
      () =>
        verifyApiVersionHyperdrive({
          version: { id: VERSION_ID, annotations: { "workers/message": RELEASE_ID } },
          versionId: VERSION_ID,
          releaseId: RELEASE_ID,
          hyperdriveId: ID,
        }),
      /does not expose resources\.bindings/,
    );
  });

  it("rejects wrong, renamed, or duplicate Hyperdrive bindings", () => {
    const cases = [
      [{ name: "HYPERDRIVE", type: "hyperdrive", id: "a".repeat(32) }],
      [{ name: "DATABASE", type: "hyperdrive", id: ID }],
      [
        { name: "HYPERDRIVE", type: "hyperdrive", id: ID },
        { name: "SECOND_DATABASE", type: "hyperdrive", id: ID },
      ],
    ];
    for (const bindings of cases) {
      assert.throws(() =>
        verifyApiVersionHyperdrive({
          version: providerVersion(bindings),
          versionId: VERSION_ID,
          releaseId: RELEASE_ID,
          hyperdriveId: ID,
        }),
      );
    }
  });

  it("rejects provider identity drift", () => {
    assert.throws(
      () =>
        verifyApiVersionHyperdrive({
          version: providerVersion([{ name: "HYPERDRIVE", type: "hyperdrive", id: ID }]),
          versionId: "22222222-2222-4222-8222-222222222222",
          releaseId: RELEASE_ID,
          hyperdriveId: ID,
        }),
      /version ID/,
    );
  });
});
