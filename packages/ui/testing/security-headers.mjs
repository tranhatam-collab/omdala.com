// Parser and per-app policy for the Cloudflare `_headers` files the static surfaces ship.
export function parseHeaders(text) {
  const rules = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    if (!/^\s/.test(raw)) {
      current = { path: raw.trim(), headers: [] };
      rules.push(current);
    } else if (current) {
      const index = raw.indexOf(":");
      current.headers.push([raw.slice(0, index).trim().toLowerCase(), raw.slice(index + 1).trim()]);
    }
  }
  return rules;
}

export function parseCsp(value) {
  const directives = {};
  for (const part of value.split(";")) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length) directives[tokens[0].toLowerCase()] = tokens.slice(1);
  }
  return directives;
}

export const PRODUCTION_API_ORIGIN = "https://api.omdala.com";

/** What each surface must ship. `api`: it calls the API; `private`: not a public page. */
export const APP_POLICY = {
  web: { api: true, private: false, frameAncestors: "'self'" },
  docs: { api: false, private: false, frameAncestors: "'self'" },
  app: { api: true, private: true, frameAncestors: "'none'", allowUnsafeEval: true },
  admin: { api: true, private: true, frameAncestors: "'none'" },
  auth: { api: true, private: true, frameAncestors: "'none'" },
  "brand-marketplace": { api: false, private: false, frameAncestors: "'none'" },
};

/** Every problem found in one app's `_headers`; an empty list means it conforms. */
export function headerProblems(app, text) {
  const policy = APP_POLICY[app];
  const problems = [];
  const rules = parseHeaders(text);
  const globalRule = rules.find((rule) => rule.path === "/*");
  if (!globalRule) return [`${app}: no /* rule`];
  const headers = globalRule.headers;
  const all = (name) => headers.filter(([key]) => key === name).map(([, value]) => value);
  const once = (name) => {
    const values = all(name);
    if (values.length !== 1) problems.push(`${app}: ${name} appears ${values.length} times in /*`);
    return values[0] ?? "";
  };

  // A header repeated in a more specific rule is sent twice (values are merged).
  for (const rule of rules) {
    if (rule.path === "/*") continue;
    for (const [name] of rule.headers) {
      if (headers.some(([key]) => key === name) && name !== "cache-control") {
        problems.push(`${app}: ${name} is set in both /* and ${rule.path}`);
      }
    }
  }

  const hsts = once("strict-transport-security");
  if (!/max-age=(\d{8,})/.test(hsts) || Number(/max-age=(\d+)/.exec(hsts)?.[1]) < 31536000 || !/includeSubDomains/.test(hsts) || !/preload/.test(hsts)) {
    problems.push(`${app}: HSTS must be max-age>=31536000; includeSubDomains; preload`);
  }
  if (once("x-content-type-options") !== "nosniff") problems.push(`${app}: X-Content-Type-Options must be nosniff`);
  const referrer = once("referrer-policy");
  const wantReferrer = policy.private ? "no-referrer" : "strict-origin-when-cross-origin";
  if (referrer !== wantReferrer) problems.push(`${app}: Referrer-Policy is ${referrer}, expected ${wantReferrer}`);
  const permissions = once("permissions-policy");
  for (const feature of ["camera", "microphone", "geolocation"]) {
    if (!permissions.includes(`${feature}=()`)) problems.push(`${app}: Permissions-Policy does not disable ${feature}`);
  }

  const frameOptions = once("x-frame-options");
  const wantFrame = policy.frameAncestors === "'none'" ? "DENY" : "SAMEORIGIN";
  if (frameOptions !== wantFrame) problems.push(`${app}: X-Frame-Options is ${frameOptions}, expected ${wantFrame}`);

  const robots = all("x-robots-tag");
  if (policy.private && !(robots.length === 1 && /^noindex,\s*nofollow$/i.test(robots[0]))) {
    problems.push(`${app}: private surface needs X-Robots-Tag: noindex, nofollow`);
  }
  if (!policy.private && robots.length) problems.push(`${app}: public surface must not send X-Robots-Tag`);

  const csp = parseCsp(once("content-security-policy"));
  const sources = (name) => csp[name] ?? [];
  if (sources("default-src").join(" ") !== "'self'") problems.push(`${app}: default-src must be 'self'`);
  if (sources("object-src").join(" ") !== "'none'") problems.push(`${app}: object-src must be 'none'`);
  if (sources("base-uri").join(" ") !== "'self'") problems.push(`${app}: base-uri must be 'self'`);
  if (sources("form-action").join(" ") !== "'self'") problems.push(`${app}: form-action must be 'self'`);
  if (sources("font-src").join(" ") !== "'self'") problems.push(`${app}: font-src must be 'self' (fonts are self-hosted)`);
  if (sources("frame-ancestors").join(" ") !== policy.frameAncestors) problems.push(`${app}: frame-ancestors must be ${policy.frameAncestors}`);
  if (!("upgrade-insecure-requests" in csp)) problems.push(`${app}: CSP needs upgrade-insecure-requests`);
  for (const [directive, values] of Object.entries(csp)) {
    for (const value of values) {
      if (value === "*" || value.startsWith("http:") || value === "data:" && directive === "script-src") {
        problems.push(`${app}: ${directive} allows ${value}`);
      }
      if (/fonts\.(googleapis|gstatic)\.com/.test(value)) problems.push(`${app}: ${directive} still allows Google Fonts`);
    }
  }
  const script = sources("script-src");
  if (!policy.allowUnsafeEval && script.includes("'unsafe-eval'")) problems.push(`${app}: script-src allows 'unsafe-eval'`);
  if (script.some((value) => /^https?:/.test(value))) problems.push(`${app}: script-src allows a remote origin`);
  const connect = sources("connect-src");
  if (!connect.includes("'self'")) problems.push(`${app}: connect-src must include 'self'`);
  const remoteConnect = connect.filter((value) => /^https?:/.test(value));
  if (policy.api) {
    if (remoteConnect.join(" ") !== PRODUCTION_API_ORIGIN) problems.push(`${app}: connect-src must allow only ${PRODUCTION_API_ORIGIN}`);
  } else if (remoteConnect.length) {
    problems.push(`${app}: connect-src allows ${remoteConnect.join(" ")} but the app makes no API calls`);
  }

  const cache = rules.find((rule) => rule.path === "/_next/static/*");
  if (!cache || !cache.headers.some(([key, value]) => key === "cache-control" && /immutable/.test(value) && /max-age=31536000/.test(value))) {
    problems.push(`${app}: /_next/static/* must be cached immutable for a year`);
  }
  return problems;
}
