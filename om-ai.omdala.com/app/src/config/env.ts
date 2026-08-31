const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.omdala.com';

export function buildApiUrl(path: string) {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}
