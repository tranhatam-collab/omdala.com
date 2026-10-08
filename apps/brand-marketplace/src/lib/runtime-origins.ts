import { resolvePublicOrigin } from "@omdala/core";

export function getAppWorkspaceOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  const environment = process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT;
  if (!environment && configured) {
    const local = new URL(configured);
    if (
      local.protocol === "http:" &&
      local.hostname === "127.0.0.1" &&
      !local.username &&
      !local.password
    ) {
      return local.origin;
    }
  }
  return resolvePublicOrigin("app", configured, environment);
}
