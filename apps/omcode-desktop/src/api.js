import { requestJSON } from "./request.mjs";

const fragment = location.hash.slice(1);
if (/^[a-f0-9]{64}$/.test(fragment)) {
  sessionStorage.setItem("omcode-token", fragment);
  history.replaceState(null, "", location.pathname);
}
export async function api(route, body, options = {}) {
  return requestJSON(route, body, {
    ...options,
    token: sessionStorage.getItem("omcode-token") || "",
  });
}
export const query = (values) => new URLSearchParams(values).toString();
