// Endpoint policy shared by providers, gateway, MCP and live scripts.
//
// AIAGENT is the only remote AI provider OMCODE may talk to (Founder rule:
// "API của Aiagent.iai.one không lấy nguồn khác"). Local model servers stay
// allowed over plain HTTP on loopback only.
//
// validateUrl      — generic URL hygiene: no credentials, query or hash;
//                    HTTPS, or HTTP on loopback. Used for MCP tool servers,
//                    which are not AI providers and are outside the rule.
// validateEndpoint — validateUrl plus the AIAGENT host allowlist. Used for
//                    every AI provider endpoint, both on user input and on
//                    records already persisted in the store.
export const AIAGENT_HOSTS = Object.freeze([
  "api.aiagent.iai.one",
  "staging-api.aiagent.iai.one",
]);
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];
export class EndpointPolicyError extends Error {
  constructor(message) {
    super(message);
    this.name = "EndpointPolicyError";
    this.code = "ENDPOINT_POLICY";
  }
}
export function isAiagentHost(hostname) {
  return AIAGENT_HOSTS.includes(hostname);
}
export function isLocalHost(hostname) {
  return LOCAL_HOSTS.includes(hostname);
}
export function validateUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new EndpointPolicyError("URL kết nối không hợp lệ.");
  }
  if (url.username || url.password || url.search || url.hash)
    throw new EndpointPolicyError(
      "URL kết nối không được chứa thông tin đăng nhập, query hoặc fragment.",
    );
  const local = isLocalHost(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local))
    throw new EndpointPolicyError(
      "Kết nối từ xa cần HTTPS; HTTP chỉ dành cho loopback local.",
    );
  return url.toString().replace(/\/$/, "");
}
export function validateEndpoint(value) {
  const normalized = validateUrl(value);
  const { hostname } = new URL(normalized);
  if (!isLocalHost(hostname) && !isAiagentHost(hostname))
    throw new EndpointPolicyError(
      "OMCODE chỉ kết nối AIAGENT (api.aiagent.iai.one, staging-api.aiagent.iai.one) hoặc model local; không dùng nguồn AI khác.",
    );
  return normalized;
}
