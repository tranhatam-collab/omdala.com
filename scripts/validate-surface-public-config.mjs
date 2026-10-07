import { validatePublicOrigin } from "../packages/core/src/public-origins.mjs";

const environment = process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT;
const webOrigin = validatePublicOrigin(
  "web",
  process.env.NEXT_PUBLIC_WEB_ORIGIN,
  environment,
);
const appOrigin = validatePublicOrigin(
  "app",
  process.env.NEXT_PUBLIC_APP_ORIGIN,
  environment,
);
const authOrigin = validatePublicOrigin(
  "auth",
  process.env.NEXT_PUBLIC_AUTH_ORIGIN,
  environment,
);
const apiOrigin = validatePublicOrigin(
  "api",
  process.env.NEXT_PUBLIC_AUTH_API_BASE ?? process.env.NEXT_PUBLIC_API_URL,
  environment,
);
const brandOrigin = validatePublicOrigin(
  "brand",
  process.env.NEXT_PUBLIC_BRAND_ORIGIN,
  environment,
);

process.stdout.write(
  `${JSON.stringify({
    validated: true,
    environment,
    origins: {
      web: webOrigin,
      app: appOrigin,
      auth: authOrigin,
      api: apiOrigin,
      brand: brandOrigin,
    },
  })}\n`,
);
