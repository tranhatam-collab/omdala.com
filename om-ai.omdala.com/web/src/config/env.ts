import { buildOmdalaApiUrl, resolveOmdalaApiOrigin } from '../../../shared/api-origin-policy';

const API_BASE_URL = resolveOmdalaApiOrigin(import.meta.env.VITE_API_BASE_URL, {
  allowSameOrigin: true,
});

export function buildApiUrl(path: string) {
  return buildOmdalaApiUrl(path, API_BASE_URL);
}
