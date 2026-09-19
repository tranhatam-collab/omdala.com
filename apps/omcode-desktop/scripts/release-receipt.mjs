export const REQUIRED_RELEASE_STAGES = [
  "tests",
  "build",
  "package",
  "bundle",
  "browser",
  "native",
  "install",
];

export function assertReleaseReceipt(receipt, candidate) {
  if (!receipt?.ok) throw new Error("Release receipt is not successful.");
  if (
    receipt.version !== candidate.version ||
    receipt.sourceDigest !== candidate.sourceDigest ||
    receipt.bundleManifestDigest !== candidate.bundleManifestDigest
  )
    throw new Error("Release receipt belongs to a different candidate.");

  for (const stage of REQUIRED_RELEASE_STAGES) {
    if (receipt.stages?.[stage]?.ok !== true)
      throw new Error(`Release receipt stage is missing or failed: ${stage}`);
  }
  return true;
}
