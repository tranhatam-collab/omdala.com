import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const trustedAssociations = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

function normalizedLogin(review) {
  return review?.user?.login?.trim().toLowerCase() ?? "";
}

function chronological(reviews) {
  return [...reviews].sort((a, b) => {
    const aTime = Date.parse(a?.submitted_at ?? "") || 0;
    const bTime = Date.parse(b?.submitted_at ?? "") || 0;
    return aTime - bTime || Number(a?.id ?? 0) - Number(b?.id ?? 0);
  });
}

export function evaluateIndependentReview({ pullRequest, reviews, expectedSha }) {
  const author = pullRequest?.user?.login?.trim().toLowerCase() ?? "";
  const headSha = pullRequest?.head?.sha ?? "";

  if (!expectedSha || headSha !== expectedSha) {
    return {
      accepted: false,
      reason: "PR_HEAD_SHA_MISMATCH",
      author,
      expectedSha,
      headSha,
    };
  }

  const approvals = new Map();
  for (const review of chronological(reviews)) {
    const login = normalizedLogin(review);
    if (!login || login === author || login.endsWith("[bot]")) continue;
    if (!trustedAssociations.has(review?.author_association ?? "")) continue;

    const state = String(review?.state ?? "").toUpperCase();
    if (state === "APPROVED") {
      approvals.set(login, review);
    } else if (state === "CHANGES_REQUESTED" || state === "DISMISSED") {
      approvals.delete(login);
    }
  }

  const exactApproval = [...approvals.values()].find(
    (review) => review?.commit_id === expectedSha,
  );
  if (!exactApproval) {
    return {
      accepted: false,
      reason: "NO_INDEPENDENT_EXACT_SHA_APPROVAL",
      author,
      expectedSha,
      headSha,
      independentApprovals: [...approvals.values()].map((review) => ({
        reviewer: review.user.login,
        commitId: review.commit_id,
        submittedAt: review.submitted_at,
      })),
    };
  }

  return {
    accepted: true,
    reason: "INDEPENDENT_EXACT_SHA_APPROVED",
    author,
    expectedSha,
    headSha,
    reviewer: exactApproval.user.login,
    reviewId: Number(exactApproval.id),
    submittedAt: exactApproval.submitted_at,
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function githubJson(path, token) {
  const response = await fetch(`${process.env.GITHUB_API_URL ?? "https://api.github.com"}${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${path} returned ${response.status}`);
  }
  return response.json();
}

async function fetchReviews(repository, pullNumber, token) {
  const reviews = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await githubJson(
      `/repos/${repository}/pulls/${pullNumber}/reviews?per_page=100&page=${page}`,
      token,
    );
    reviews.push(...batch);
    if (batch.length < 100) return reviews;
  }
  throw new Error("Review pagination exceeded the 1,000-review safety limit");
}

async function main() {
  const repository = option("--repository") ?? process.env.GITHUB_REPOSITORY;
  const pullNumber = option("--pull-request") ?? process.env.PR_NUMBER;
  const expectedSha = option("--sha") ?? process.env.EXPECTED_SHA;
  const receiptPath = option("--receipt") ?? "independent-review-receipt.json";
  const token = process.env.GITHUB_TOKEN;

  if (!repository || !/^[-\w.]+\/[-\w.]+$/.test(repository)) {
    throw new Error("A valid --repository owner/name is required");
  }
  if (!pullNumber || !/^\d+$/.test(String(pullNumber))) {
    throw new Error("A numeric --pull-request is required");
  }
  if (!expectedSha || !/^[0-9a-f]{40}$/.test(expectedSha)) {
    throw new Error("An exact 40-character --sha is required");
  }
  if (!token) throw new Error("GITHUB_TOKEN is required");

  const pullRequest = await githubJson(
    `/repos/${repository}/pulls/${pullNumber}`,
    token,
  );
  const reviews = await fetchReviews(repository, pullNumber, token);
  const result = evaluateIndependentReview({ pullRequest, reviews, expectedSha });
  const receipt = {
    schemaVersion: 1,
    verdict: result.accepted ? "INDEPENDENT_REVIEW_ACCEPTED" : "INDEPENDENT_REVIEW_BLOCKED",
    repository,
    pullRequest: Number(pullNumber),
    candidateSha: expectedSha,
    checkedAt: new Date().toISOString(),
    ...result,
  };

  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);

  if (process.env.GITHUB_OUTPUT && result.accepted) {
    writeFileSync(
      process.env.GITHUB_OUTPUT,
      `reviewer=${result.reviewer}\nreview_id=${result.reviewId}\nreviewed_sha=${expectedSha}\n`,
      { flag: "a" },
    );
  }

  if (!result.accepted) process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
