export const BROWSER_ENGINES = ["chromium", "webkit"];

export const BROWSER_CHECKS = [
  "file-timeout-recovery-without-auto-retry",
  "edit-save-real-file",
  "draft-recovery-after-reload",
  "real-terminal",
  "cancel-consent-zero-egress",
  "agent-proposal-approval-disk",
  "execute-agent-produced-file",
  "skill-library",
  "aiagent-isolated-staging-connection-form",
  "provider-controls-recover-after-local-failure",
  "provider-model-health",
  "gateway-catalog-17-chat-models",
  "embedding-explicit-consent",
  "gateway-model-selector-17",
  "gateway-billing-readback",
  "session-history-after-navigation",
  "mobile-editor-agent-navigation-no-overflow",
  "theme-and-no-uncaught-errors",
];

export const BROWSER_CHECK_COUNT = BROWSER_ENGINES.length * BROWSER_CHECKS.length;

export function assertBrowserCoverage(results) {
  if (!Array.isArray(results) || results.length !== BROWSER_CHECK_COUNT) {
    throw new Error(`Browser E2E must contain exactly ${BROWSER_CHECK_COUNT} checks.`);
  }
  const expected = new Set(
    BROWSER_ENGINES.flatMap((engine) =>
      BROWSER_CHECKS.map((check) => `${engine}:${check}`),
    ),
  );
  for (const result of results) {
    const key = `${result?.engine}:${result?.check}`;
    if (result?.ok !== true || !expected.delete(key)) {
      throw new Error(`Browser E2E contains a failed, duplicate, or unknown check: ${key}`);
    }
  }
  if (expected.size) {
    throw new Error(`Browser E2E is missing checks: ${[...expected].join(", ")}`);
  }
  return true;
}
