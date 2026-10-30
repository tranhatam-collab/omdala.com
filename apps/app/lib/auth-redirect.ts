import {
  normalizePublicPath,
  resolvePublicOrigin,
  type OmdalaLanguage,
} from "@omdala/core";

/** The auth host login URL for this release, carrying the language and where to return to. */
export function buildAuthLoginUrl(language: OmdalaLanguage, nextPath: string): string {
  const authOrigin = resolvePublicOrigin(
    "auth",
    process.env.NEXT_PUBLIC_AUTH_ORIGIN,
    process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT,
  );
  const authUrl = new URL("/login", `${authOrigin}/`);
  authUrl.searchParams.set("lang", language);
  authUrl.searchParams.set("next", normalizePublicPath(nextPath, "/dashboard"));
  return authUrl.toString();
}
