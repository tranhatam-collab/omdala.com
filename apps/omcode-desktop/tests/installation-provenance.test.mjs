import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  currentInstallationProvenance,
  previousInstallationHistory,
} from "../scripts/installation-provenance.mjs";

const head = "a".repeat(40);

test("install provenance retains the candidate worktree identity without legacy aliases", () => {
  const release = {
    sourceHead: head,
    sourceBranch: "OMCODE/candidate",
    sourceState: "VERIFIED_WORKTREE_ONLY",
    sourceChanges: [" M server/index.mjs"],
    branch: "legacy/recovery",
    upstreamBase: "b".repeat(40),
  };
  const result = currentInstallationProvenance(release);
  assert.deepEqual(result, {
    sourceHead: head,
    sourceBranch: "OMCODE/candidate",
    sourceState: "VERIFIED_WORKTREE_ONLY",
    sourceChanges: [" M server/index.mjs"],
  });
  result.sourceChanges.push("another change");
  assert.equal(release.sourceChanges.length, 1);
});

test("missing release identity is explicitly unknown and never borrowed from an old install", () => {
  assert.deepEqual(currentInstallationProvenance({}), {
    sourceHead: null,
    sourceBranch: null,
    sourceState: "NOT_CHECKED",
    sourceChanges: null,
  });
  assert.equal(
    currentInstallationProvenance({ sourceHead: "invalid" }).sourceHead,
    null,
  );
  assert.equal(
    currentInstallationProvenance({ sourceHead: head }).sourceState,
    "NOT_CHECKED",
  );
});

test("clean source provenance is accepted only with a valid SHA and empty changes", () => {
  assert.equal(
    currentInstallationProvenance({
      sourceHead: head,
      sourceBranch: "OMCODE/release",
      sourceState: "VERIFIED_HEAD_ONLY",
      sourceChanges: [],
    }).sourceState,
    "VERIFIED_HEAD_ONLY",
  );
  for (const release of [
    { sourceState: "VERIFIED_HEAD_ONLY", sourceHead: head },
    { sourceState: "VERIFIED_HEAD_ONLY", sourceChanges: [] },
    {
      sourceState: "VERIFIED_HEAD_ONLY",
      sourceHead: head,
      sourceChanges: ["dirty"],
    },
    {
      sourceState: "VERIFIED_WORKTREE_ONLY",
      sourceHead: head,
      sourceChanges: [],
    },
  ])
    assert.throws(() => currentInstallationProvenance(release), /inconsistent/);
});

test("legacy baseline and branch remain under hashed history referencing the original bytes", () => {
  const bytes = Buffer.from(
    JSON.stringify(
      {
        time: "2026-09-25T09:35:48.120Z",
        version: "0.2.2",
        branch: "legacy/recovery",
        upstreamBase: "b".repeat(40),
        sourceHead: head,
        sourceBranch: "OMCODE/release",
        sourceFiles: [{ path: "README.md" }],
      },
      null,
      2,
    ) + "\n",
  );
  const result = previousInstallationHistory(
    bytes,
    "/backup/installation-receipt-before.json",
  );
  assert.equal(result.receipt, "/backup/installation-receipt-before.json");
  assert.equal(result.sha256, createHash("sha256").update(bytes).digest("hex"));
  assert.equal(result.recordedProvenance.branch, "legacy/recovery");
  assert.equal(result.recordedProvenance.upstreamBase, "b".repeat(40));
  assert.equal(Object.hasOwn(result, "branch"), false);
  assert.equal(Object.hasOwn(result.recordedProvenance, "sourceFiles"), false);
});

test("history preserves the previous receipt by reference without flattening older generations", () => {
  const previous = {
    sourceHead: head,
    sourceBranch: "OMCODE/release",
    history: {
      previousInstallation: {
        recordedProvenance: { branch: "legacy/recovery" },
      },
    },
  };
  const result = previousInstallationHistory(
    Buffer.from(JSON.stringify(previous)),
    "/backup/prior.json",
  );
  assert.equal(result.recordedProvenance.sourceBranch, "OMCODE/release");
  assert.equal(Object.hasOwn(result.recordedProvenance, "branch"), false);
  assert.equal(Object.hasOwn(result.recordedProvenance, "history"), false);
});
