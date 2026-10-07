import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const HANDOFF_ADDRESSES = Object.freeze([
  "cloudflare_worker_script.api",
  "cloudflare_record.api",
  "cloudflare_record.auth",
  "cloudflare_pages_project.marketing",
]);

export function verifyWranglerAccountAuthority({ wranglerToml, accountId }) {
  if (!/^[a-f0-9]{32}$/.test(accountId ?? "")) {
    throw new Error("Protected Cloudflare account ID is invalid.");
  }
  const accountAssignments = String(wranglerToml ?? "")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*account_id\s*=\s*["']([a-f0-9]{32})["']\s*(?:#.*)?$/i))
    .filter(Boolean)
    .map((match) => match[1].toLowerCase());
  if (accountAssignments.length !== 1 || accountAssignments[0] !== accountId) {
    throw new Error(
      "Wrangler account_id does not match the protected Cloudflare account ID.",
    );
  }
  return accountAssignments[0];
}

export function verifyInfraAuthorityHandoff({ bytes, expectedSha256, accountId }) {
  if (!/^[a-f0-9]{64}$/.test(expectedSha256 ?? "")) {
    throw new Error("Protected Terraform handoff SHA-256 is invalid.");
  }
  if (!/^[a-f0-9]{32}$/.test(accountId ?? "")) {
    throw new Error("Protected Cloudflare account ID is invalid.");
  }
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (actualSha256 !== expectedSha256) {
    throw new Error("Terraform authority handoff receipt digest mismatch.");
  }
  const receipt = JSON.parse(bytes.toString("utf8"));
  const statuses = receipt?.terraform_state_addresses ?? {};
  const exactAddresses = Object.keys(statuses).sort();
  if (
    receipt?.schema_version !== 1 ||
    receipt.verdict !== "AUTHORITY_HANDOFF_ACCEPTED" ||
    receipt.cloudflare_account_id !== accountId ||
    receipt.remote_backend_locked !== true ||
    receipt.lock_contention_verified !== true ||
    !/^[a-f0-9]{64}$/.test(receipt.state_backup_sha256 ?? "") ||
    receipt.zero_destroy_plan !== true ||
    JSON.stringify(exactAddresses) !== JSON.stringify([...HANDOFF_ADDRESSES].sort()) ||
    !Object.values(statuses).every((status) =>
      status === "removed" || status === "not_present"
    ) ||
    receipt?.readback?.api_deployment_authority !== "wrangler:services/api/wrangler.toml" ||
    receipt?.readback?.surface_deployment_authority !==
      "github-actions:.github/workflows/deploy-surfaces.yml" ||
    receipt?.readback?.auth_pages_domain !== "auth.omdala.com" ||
    receipt?.readback?.auth_pages_attached !== true ||
    typeof receipt.created_at !== "string" ||
    Number.isNaN(Date.parse(receipt.created_at))
  ) {
    throw new Error("Terraform authority handoff receipt is incomplete or invalid.");
  }
  return { receipt, sha256: actualSha256 };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const receiptPath = option("--receipt");
  const wranglerConfigPath = option("--wrangler-config");
  const accountId = option("--account-id");
  if (!wranglerConfigPath) throw new Error("--wrangler-config is required.");
  const verifiedAccountId = verifyWranglerAccountAuthority({
    wranglerToml: readFileSync(wranglerConfigPath, "utf8"),
    accountId,
  });
  if (!receiptPath) {
    if (option("--sha256")) {
      throw new Error("--sha256 cannot be used without --receipt.");
    }
    process.stdout.write(
      `${JSON.stringify({ verdict: "WRANGLER_ACCOUNT_AUTHORITY_ACCEPTED", cloudflare_account_id: verifiedAccountId })}\n`,
    );
  } else {
    const result = verifyInfraAuthorityHandoff({
      bytes: readFileSync(receiptPath),
      expectedSha256: option("--sha256"),
      accountId,
    });
    process.stdout.write(
      `${JSON.stringify({ verdict: result.receipt.verdict, sha256: result.sha256, cloudflare_account_id: verifiedAccountId })}\n`,
    );
  }
}
