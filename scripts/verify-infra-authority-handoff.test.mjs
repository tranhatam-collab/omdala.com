import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import {
  HANDOFF_ADDRESSES,
  verifyInfraAuthorityHandoff,
  verifyWranglerAccountAuthority,
} from "./verify-infra-authority-handoff.mjs";

const accountId = "f".repeat(32);
function fixture(overrides = {}) {
  return {
    schema_version: 1,
    verdict: "AUTHORITY_HANDOFF_ACCEPTED",
    cloudflare_account_id: accountId,
    remote_backend_locked: true,
    lock_contention_verified: true,
    state_backup_sha256: "a".repeat(64),
    zero_destroy_plan: true,
    terraform_state_addresses: Object.fromEntries(
      HANDOFF_ADDRESSES.map((address) => [address, "not_present"]),
    ),
    readback: {
      api_deployment_authority: "wrangler:services/api/wrangler.toml",
      surface_deployment_authority: "github-actions:.github/workflows/deploy-surfaces.yml",
      auth_pages_domain: "auth.omdala.com",
      auth_pages_attached: true,
    },
    created_at: "2026-10-08T00:00:00Z",
    ...overrides,
  };
}
function encoded(value) {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
  return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
}

describe("Terraform authority handoff receipt", () => {
  it("accepts one exact Wrangler account_id matching the protected account", () => {
    assert.equal(
      verifyWranglerAccountAuthority({
        wranglerToml: `name = "omdala-api"\naccount_id = "${accountId}"\n[env.staging]\nname = "omdala-api-staging"\n`,
        accountId,
      }),
      accountId,
    );
  });

  it("rejects a missing, duplicate, or mismatched Wrangler account_id", () => {
    assert.throws(() =>
      verifyWranglerAccountAuthority({ wranglerToml: 'name = "omdala-api"\n', accountId }),
    );
    assert.throws(() =>
      verifyWranglerAccountAuthority({
        wranglerToml: `account_id = "${accountId}"\naccount_id = "${accountId}"\n`,
        accountId,
      }),
    );
    assert.throws(() =>
      verifyWranglerAccountAuthority({
        wranglerToml: `account_id = "${"e".repeat(32)}"\n`,
        accountId,
      }),
    );
  });

  it("accepts an exact protected digest and complete ownership transfer", () => {
    const { bytes, sha256 } = encoded(fixture());
    assert.equal(
      verifyInfraAuthorityHandoff({ bytes, expectedSha256: sha256, accountId }).sha256,
      sha256,
    );
  });

  it("rejects a digest mismatch", () => {
    const { bytes } = encoded(fixture());
    assert.throws(() =>
      verifyInfraAuthorityHandoff({ bytes, expectedSha256: "b".repeat(64), accountId }),
    );
  });

  it("rejects an ownership address that was not transferred or proved absent", () => {
    const receipt = fixture();
    receipt.terraform_state_addresses[HANDOFF_ADDRESSES[0]] = "managed";
    const { bytes, sha256 } = encoded(receipt);
    assert.throws(() =>
      verifyInfraAuthorityHandoff({ bytes, expectedSha256: sha256, accountId }),
    );
  });
});
