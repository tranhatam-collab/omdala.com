const CANONICAL_PRODUCTION_ORIGINS = Object.freeze({
  web: "https://omdala.com",
  app: "https://app.omdala.com",
  auth: "https://auth.omdala.com",
  api: "https://api.omdala.com",
  brand: "https://brand.omdala.com",
});

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const FULL_SHA = /^[a-f0-9]{40}$/;
const RELEASE_ID = /^[A-Za-z0-9._-]{8,160}$/;

function required(environment, name) {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error(`Missing required production acceptance variable: ${name}`);
  }
  return value;
}

function requireCanonicalOrigin(environment, name, expected) {
  const value = required(environment, name);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
  if (
    parsed.origin !== expected ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`${name} must be the canonical production origin ${expected}`);
  }
  return parsed.origin;
}

export function validateProductionE2EEnvironment(environment = process.env) {
  const releaseSha = required(environment, "E2E_RELEASE_SHA");
  if (!FULL_SHA.test(releaseSha)) {
    throw new Error("E2E_RELEASE_SHA must be a full lowercase Git SHA");
  }

  const apiVersionId = required(environment, "E2E_API_VERSION_ID");
  if (!UUID.test(apiVersionId)) {
    throw new Error("E2E_API_VERSION_ID must be a UUID");
  }

  const apiDeploymentId = required(environment, "E2E_API_DEPLOYMENT_ID");
  if (!UUID.test(apiDeploymentId)) {
    throw new Error("E2E_API_DEPLOYMENT_ID must be a UUID");
  }

  const surfaceReleaseId = required(environment, "E2E_SURFACE_RELEASE_ID");
  if (!RELEASE_ID.test(surfaceReleaseId)) {
    throw new Error("E2E_SURFACE_RELEASE_ID is invalid");
  }

  const magicLinkToken = required(
    environment,
    "E2E_PRODUCTION_SMOKE_MAGIC_LINK_TOKEN",
  );
  if (magicLinkToken.length < 32 || /\s|[\u0000-\u001f\u007f]/.test(magicLinkToken)) {
    throw new Error(
      "E2E_PRODUCTION_SMOKE_MAGIC_LINK_TOKEN must be a non-whitespace token of at least 32 characters",
    );
  }

  return Object.freeze({
    webUrl: requireCanonicalOrigin(
      environment,
      "E2E_PRODUCTION_WEB_URL",
      CANONICAL_PRODUCTION_ORIGINS.web,
    ),
    appUrl: requireCanonicalOrigin(
      environment,
      "E2E_PRODUCTION_APP_URL",
      CANONICAL_PRODUCTION_ORIGINS.app,
    ),
    authUrl: requireCanonicalOrigin(
      environment,
      "E2E_PRODUCTION_AUTH_URL",
      CANONICAL_PRODUCTION_ORIGINS.auth,
    ),
    apiUrl: requireCanonicalOrigin(
      environment,
      "E2E_PRODUCTION_API_URL",
      CANONICAL_PRODUCTION_ORIGINS.api,
    ),
    brandUrl: requireCanonicalOrigin(
      environment,
      "E2E_PRODUCTION_BRAND_URL",
      CANONICAL_PRODUCTION_ORIGINS.brand,
    ),
    releaseSha,
    apiVersionId,
    apiDeploymentId,
    surfaceReleaseId,
    magicLinkToken,
  });
}

export { CANONICAL_PRODUCTION_ORIGINS };
