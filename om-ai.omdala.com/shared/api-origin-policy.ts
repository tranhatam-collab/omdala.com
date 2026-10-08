const OMDALA_API_ORIGINS = new Set([
  'https://api.omdala.com',
  'https://api-staging.omdala.com',
]);

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export type ResolveApiOriginOptions = {
  allowSameOrigin?: boolean;
};

export function resolveOmdalaApiOrigin(
  rawOrigin: string | undefined,
  options: ResolveApiOriginOptions = {},
): string {
  const candidate = rawOrigin?.trim() ?? '';
  if (!candidate) {
    if (options.allowSameOrigin) return '';
    throw new Error('OMDALA_API_ORIGIN_REQUIRED');
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('OMDALA_API_ORIGIN_INVALID');
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname !== '' && parsed.pathname !== '/')
  ) {
    throw new Error('OMDALA_API_ORIGIN_INVALID');
  }

  const origin = parsed.origin;
  if (OMDALA_API_ORIGINS.has(origin)) return origin;

  if (
    LOOPBACK_HOSTS.has(parsed.hostname) &&
    (parsed.protocol === 'http:' || parsed.protocol === 'https:')
  ) {
    return origin;
  }

  throw new Error('OMDALA_API_ORIGIN_NOT_ALLOWED');
}

export function buildOmdalaApiUrl(path: string, apiOrigin: string): string {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    /[\r\n\0]/u.test(path)
  ) {
    throw new Error('OMDALA_API_PATH_INVALID');
  }

  if (!apiOrigin) return path;
  const origin = resolveOmdalaApiOrigin(apiOrigin);
  const resolved = new URL(path, `${origin}/`);
  if (resolved.origin !== origin) {
    throw new Error('OMDALA_API_DESTINATION_CHANGED');
  }
  return resolved.toString();
}
