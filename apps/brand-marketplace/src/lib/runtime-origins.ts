const PRODUCTION_APP_ORIGIN = "https://app.omdala.com";

export function getAppWorkspaceOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (!configured) return PRODUCTION_APP_ORIGIN;

  try {
    const origin = new URL(configured).origin;
    if (origin.startsWith("https://") || origin.startsWith("http://127.0.0.1")) {
      return origin;
    }
  } catch {
    // Fall through to the production-safe origin.
  }

  return PRODUCTION_APP_ORIGIN;
}
