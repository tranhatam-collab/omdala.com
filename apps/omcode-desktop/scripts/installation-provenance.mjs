import { createHash } from "node:crypto";

export function currentInstallationProvenance(release) {
  const sourceHead = /^[a-f0-9]{40}$/i.test(release.sourceHead || "")
    ? release.sourceHead
    : null;
  const sourceBranch = release.sourceBranch?.trim() || null;
  const sourceChanges = Array.isArray(release.sourceChanges)
    ? [...release.sourceChanges]
    : null;
  const sourceState = ["VERIFIED_HEAD_ONLY", "VERIFIED_WORKTREE_ONLY"].includes(
    release.sourceState,
  )
    ? release.sourceState
    : "NOT_CHECKED";
  if (
    sourceState !== "NOT_CHECKED" &&
    (!sourceHead ||
      !sourceChanges ||
      (sourceState === "VERIFIED_HEAD_ONLY") !== (sourceChanges.length === 0))
  )
    throw new Error("Release source identity is inconsistent.");

  // Only the candidate's validated release receipt may identify this install.
  return { sourceHead, sourceBranch, sourceState, sourceChanges };
}

export function previousInstallationHistory(bytes, receiptPath) {
  const previous = JSON.parse(bytes.toString());
  const fields = [
    "upstreamBase",
    "branch",
    "source",
    "target",
    "sourceHead",
    "sourceBranch",
    "sourceState",
    "sourceDigest",
    "bundleManifestDigest",
  ];
  return {
    receipt: receiptPath,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    time: previous.time || null,
    version: previous.version || null,
    recordedProvenance: Object.fromEntries(
      fields
        .filter((key) => Object.hasOwn(previous, key))
        .map((key) => [key, previous[key]]),
    ),
  };
}
