export const REQUIRED_RELEASE_STAGES = [
  "dependencies",
  "tests",
  "build",
  "package",
  "bundle",
  "browser",
  "native",
  "install",
];

export function assertReleaseReceipt(receipt, candidate) {
  if (
    !receipt?.runId ||
    receipt.status !== "PASS" ||
    receipt.exitCode !== 0 ||
    !Number.isFinite(Date.parse(receipt.finishedAt)) ||
    !Number.isFinite(Date.parse(receipt.startedAt)) ||
    Date.parse(receipt.finishedAt) > Date.now() + 60000 ||
    Date.now() - Date.parse(receipt.finishedAt) > 86400000 ||
    Date.parse(receipt.finishedAt) < Date.parse(receipt.startedAt)
  )
    throw new Error(
      "Release receipt is stale, incomplete or not a completed run.",
    );
  if (!receipt?.ok) throw new Error("Release receipt is not successful.");
  if (
    receipt.version !== candidate.version ||
    receipt.sourceDigest !== candidate.sourceDigest ||
    receipt.bundleManifestDigest !== candidate.bundleManifestDigest
  )
    throw new Error("Release receipt belongs to a different candidate.");

  for (const stage of REQUIRED_RELEASE_STAGES) {
    if (
      receipt.stages?.[stage]?.ok !== true ||
      receipt.stages?.[stage]?.runId !== receipt.runId ||
      receipt.stages?.[stage]?.exitCode !== 0
    )
      throw new Error(`Release receipt stage is missing or failed: ${stage}`);
  }
  return true;
}
