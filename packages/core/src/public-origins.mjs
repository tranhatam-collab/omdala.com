const SURFACE_ORIGINS = Object.freeze({
  web: {
    production: "https://omdala.com",
    staging: "https://staging.omdala.com",
  },
  app: {
    production: "https://app.omdala.com",
    staging: "https://app-staging.omdala.com",
  },
  auth: {
    production: "https://auth.omdala.com",
    staging: "https://auth-staging.omdala.com",
  },
  api: {
    production: "https://api.omdala.com",
    staging: "https://api-staging.omdala.com",
  },
  brand: {
    production: "https://brand.omdala.com",
    staging: "https://brand-staging.omdala.com",
  },
});

const RELATIVE_URL_BASE = "https://relative.invalid";

/**
 * @typedef {keyof typeof SURFACE_ORIGINS} PublicSurface
 * @typedef {"staging" | "production"} ReleaseEnvironment
 */

/**
 * @param {unknown} value
 * @returns {ReleaseEnvironment}
 */
function requireReleaseEnvironment(value) {
  if (value !== "staging" && value !== "production") {
    throw new Error(
      "NEXT_PUBLIC_RELEASE_ENVIRONMENT must be staging or production.",
    );
  }
  return value;
}

/**
 * @param {PublicSurface} surface
 */
function requireSurface(surface) {
  const specification = SURFACE_ORIGINS[surface];
  if (!specification) {
    throw new Error(`Unsupported public surface: ${String(surface)}`);
  }
  return specification;
}

/**
 * Validate a protected-release origin. Staging can never resolve to the
 * production origin, and a production release can only use its canonical
 * production origin.
 *
 * @param {PublicSurface} surface
 * @param {unknown} rawOrigin
 * @param {unknown} rawEnvironment
 */
export function validatePublicOrigin(surface, rawOrigin, rawEnvironment) {
  const specification = requireSurface(surface);
  const environment = requireReleaseEnvironment(rawEnvironment);
  if (typeof rawOrigin !== "string" || rawOrigin.trim() === "") {
    throw new Error(`Configured ${surface} public origin is required.`);
  }

  let parsed;
  try {
    parsed = new URL(rawOrigin);
  } catch {
    throw new Error(`${surface} public origin must be an absolute URL.`);
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      `${surface} public origin must be an HTTPS origin without credentials, port, path, query, or fragment.`,
    );
  }

  if (environment === "production") {
    if (parsed.origin !== specification.production) {
      throw new Error(
        `Production ${surface} origin must be ${specification.production}.`,
      );
    }
  } else if (parsed.origin !== specification.staging) {
    throw new Error(
      `Staging ${surface} origin must be ${specification.staging}.`,
    );
  }

  return parsed.origin;
}

/**
 * Keep ordinary unconfigured local/CI builds compatible with their historical
 * production links. Protected staging and production builds always provide an
 * explicit environment and are validated strictly.
 *
 * @param {PublicSurface} surface
 * @param {unknown} rawOrigin
 * @param {unknown} rawEnvironment
 */
export function resolvePublicOrigin(surface, rawOrigin, rawEnvironment) {
  const specification = requireSurface(surface);
  if (rawOrigin === undefined && rawEnvironment === undefined) {
    return specification.production;
  }
  return validatePublicOrigin(surface, rawOrigin, rawEnvironment);
}

/**
 * @param {unknown} value
 * @param {string} [fallback]
 */
export function normalizePublicPath(value, fallback = "/") {
  const candidate = typeof value === "string" ? value : "";
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return fallback;
  }

  const parsed = new URL(candidate, RELATIVE_URL_BASE);
  if (parsed.origin !== RELATIVE_URL_BASE) {
    return fallback;
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
