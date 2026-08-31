import test from "node:test";
import assert from "node:assert/strict";
import { evaluateIndependentReview } from "./release-review-policy.mjs";

const sha = "a".repeat(40);
const oldSha = "b".repeat(40);
const pullRequest = { user: { login: "author" }, head: { sha } };

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
  });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "NO_INDEPENDENT_EXACT_SHA_APPROVAL");
});

test("rejects an approval attached to a stale commit", () => {
  const result = evaluateIndependentReview({
    pullRequest,
    reviews: [review({ commit_id: oldSha })],
    expectedSha: sha,
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
  });
  assert.equal(result.accepted, false);
});

test("a later comment does not erase an exact-SHA approval", () => {
  const result = evaluateIndependentReview({
    pullRequest,
    reviews: [
      review(),
      review({ id: 2, state: "COMMENTED", submitted_at: "2026-08-30T00:01:00Z" }),
    ],
    expectedSha: sha,
  });
  assert.equal(result.accepted, true);
});

test("rejects a PR whose current head differs from the candidate", () => {
  const result = evaluateIndependentReview({
    pullRequest: { ...pullRequest, head: { sha: oldSha } },
    reviews: [review()],
    expectedSha: sha,
  });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "PR_HEAD_SHA_MISMATCH");
});
