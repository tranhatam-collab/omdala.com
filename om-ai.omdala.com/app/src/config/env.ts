import { buildOmdalaApiUrl, resolveOmdalaApiOrigin } from '../../../shared/api-origin-policy';

const API_BASE_URL = resolveOmdalaApiOrigin(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.omdala.com',
);

export function buildApiUrl(path: string) {
  return buildOmdalaApiUrl(path, API_BASE_URL);
}
