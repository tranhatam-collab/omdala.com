export const API_BASE_URL =
  process.env.NEXT_PUBLIC_OMDALA_API_BASE_URL ?? "http://127.0.0.1:8789";

export function createApiUrl(pathname) {
  return `${API_BASE_URL}${pathname}`;
}
