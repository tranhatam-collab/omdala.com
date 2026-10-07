import test from "node:test";
import assert from "node:assert/strict";
import { evaluateIndependentReview } from "./release-review-policy.mjs";

const sha = "a".repeat(40);
const oldSha = "b".repeat(40);
const mergeSha = "c".repeat(40);
const treeSha = "d".repeat(40);
const pullRequest = {
  user: { login: "author" },
  head: { sha },
  base: { ref: "main" },
  state: "open",
  draft: false,
  merged: false,
};

function review(overrides = {}) {
  return {
    id: 1,
    user: { login: "reviewer" },
    state: "APPROVED",
    commit_id: sha,
    author_association: "COLLABORATOR",
    submitted_at: "2026-08-30T00:00:00Z",
    ...overrides,
  };
}

test("accepts an independent collaborator approval on the exact SHA", () => {
  const result = evaluateIndependentReview({
    pullRequest,
    reviews: [review()],
    expectedSha: sha,
    candidateTreeSha: treeSha,
    reviewedTreeSha: treeSha,
  });
  assert.equal(result.accepted, true);
  assert.equal(result.reviewer, "reviewer");
});

test("rejects self approval and untrusted external approval", () => {
  const result = evaluateIndependentReview({
    pullRequest,
    reviews: [
      review({ user: { login: "author" } }),
      review({ id: 2, user: { login: "external" }, author_association: "NONE" }),
    ],
    expectedSha: sha,
    candidateTreeSha: treeSha,
    reviewedTreeSha: treeSha,
  });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "NO_INDEPENDENT_EXACT_SHA_APPROVAL");
});

test("rejects an approval attached to a stale commit", () => {
  const result = evaluateIndependentReview({
    pullRequest,
    reviews: [review({ commit_id: oldSha })],
    expectedSha: sha,
    candidateTreeSha: treeSha,
    reviewedTreeSha: treeSha,
  });
  assert.equal(result.accepted, false);
});

test("a later changes-requested review revokes approval", () => {
  const result = evaluateIndependentReview({
    pullRequest,
    reviews: [
      review(),
      review({ id: 2, state: "CHANGES_REQUESTED", submitted_at: "2026-08-30T00:01:00Z" }),
    ],
    expectedSha: sha,
    candidateTreeSha: treeSha,
    reviewedTreeSha: treeSha,
  });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "ACTIVE_INDEPENDENT_CHANGE_REQUEST");
});

test("an active change request from another trusted reviewer vetoes an exact approval", () => {
  const result = evaluateIndependentReview({
    pullRequest,
    reviews: [
      review({ user: { login: "reviewer-a" } }),
      review({
        id: 2,
        user: { login: "reviewer-b" },
        state: "CHANGES_REQUESTED",
        submitted_at: "2026-08-30T00:01:00Z",
      }),
    ],
    expectedSha: sha,
    candidateTreeSha: treeSha,
    reviewedTreeSha: treeSha,
  });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "ACTIVE_INDEPENDENT_CHANGE_REQUEST");
  assert.deepEqual(result.activeObjections.map((entry) => entry.reviewer), ["reviewer-b"]);
});

test("the objecting reviewer must approve or have the objection explicitly dismissed", () => {
  for (const resolution of ["APPROVED", "DISMISSED"]) {
    const result = evaluateIndependentReview({
      pullRequest,
      reviews: [
        review({ user: { login: "reviewer-a" } }),
        review({
          id: 2,
          user: { login: "reviewer-b" },
          state: "CHANGES_REQUESTED",
          submitted_at: "2026-08-30T00:01:00Z",
        }),
        review({
          id: 3,
          user: { login: "reviewer-b" },
          state: resolution,
          submitted_at: "2026-08-30T00:02:00Z",
        }),
      ],
      expectedSha: sha,
      candidateTreeSha: treeSha,
      reviewedTreeSha: treeSha,
    });
    assert.equal(result.accepted, true);
  }
});

test("a later comment does not erase an exact-SHA approval", () => {
  const result = evaluateIndependentReview({
    pullRequest,
    reviews: [
      review(),
      review({ id: 2, state: "COMMENTED", submitted_at: "2026-08-30T00:01:00Z" }),
    ],
    expectedSha: sha,
    candidateTreeSha: treeSha,
    reviewedTreeSha: treeSha,
  });
  assert.equal(result.accepted, true);
});

test("rejects a PR whose current head differs from the candidate", () => {
  const result = evaluateIndependentReview({
    pullRequest: { ...pullRequest, head: { sha: oldSha } },
    reviews: [review()],
    expectedSha: sha,
    candidateTreeSha: treeSha,
    reviewedTreeSha: treeSha,
  });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "PR_HEAD_SHA_MISMATCH");
});

test("rejects staging for closed, draft, merged, or non-main pull requests", () => {
  for (const overrides of [
    { state: "closed" },
    { draft: true },
    { merged: true, state: "closed" },
  ]) {
    const result = evaluateIndependentReview({
      pullRequest: { ...pullRequest, ...overrides },
      reviews: [review()],
      expectedSha: sha,
      candidateTreeSha: treeSha,
      reviewedTreeSha: treeSha,
    });
    assert.equal(result.accepted, false);
    assert.equal(result.reason, "STAGING_PR_NOT_OPEN_READY");
  }

  const wrongBase = evaluateIndependentReview({
    pullRequest: { ...pullRequest, base: { ref: "dev" } },
    reviews: [review()],
    expectedSha: sha,
    candidateTreeSha: treeSha,
    reviewedTreeSha: treeSha,
  });
  assert.equal(wrongBase.accepted, false);
  assert.equal(wrongBase.reason, "PR_BASE_BRANCH_MISMATCH");
});

test("rejects staging when the reviewed tree identity is missing or differs", () => {
  const missing = evaluateIndependentReview({
    pullRequest,
    reviews: [review()],
    expectedSha: sha,
  });
  assert.equal(missing.accepted, false);
  assert.equal(missing.reason, "REVIEWED_TREE_IDENTITY_MISMATCH");

  const mismatched = evaluateIndependentReview({
    pullRequest,
    reviews: [review()],
    expectedSha: sha,
    candidateTreeSha: treeSha,
    reviewedTreeSha: oldSha,
  });
  assert.equal(mismatched.accepted, false);
  assert.equal(mismatched.reason, "REVIEWED_TREE_IDENTITY_MISMATCH");
});

test("accepts production only when current main is the merged result with the reviewed tree", () => {
  const result = evaluateIndependentReview({
    pullRequest: {
      ...pullRequest,
      state: "closed",
      merged: true,
      base: { ref: "main" },
      merge_commit_sha: mergeSha,
    },
    reviews: [review()],
    expectedSha: mergeSha,
    mode: "production",
    candidateTreeSha: treeSha,
    reviewedTreeSha: treeSha,
  });
  assert.equal(result.accepted, true);
  assert.equal(result.reviewedSha, sha);
  assert.equal(result.expectedSha, mergeSha);
});

test("rejects a production merge whose tree differs from the reviewed PR head", () => {
  const result = evaluateIndependentReview({
    pullRequest: {
      ...pullRequest,
      state: "closed",
      merged: true,
      base: { ref: "main" },
      merge_commit_sha: mergeSha,
    },
    reviews: [review()],
    expectedSha: mergeSha,
    mode: "production",
    candidateTreeSha: treeSha,
    reviewedTreeSha: oldSha,
  });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "MERGED_TREE_DIFFERS_FROM_REVIEWED_HEAD");
});

test("rejects production when the PR merge commit does not match current main", () => {
  const result = evaluateIndependentReview({
    pullRequest: {
      ...pullRequest,
      state: "closed",
      merged: true,
      base: { ref: "main" },
      merge_commit_sha: oldSha,
    },
    reviews: [review()],
    expectedSha: mergeSha,
    mode: "production",
    candidateTreeSha: treeSha,
    reviewedTreeSha: treeSha,
  });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "MERGED_PR_PROVENANCE_MISMATCH");
});
