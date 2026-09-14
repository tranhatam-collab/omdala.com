const fragment = location.hash.slice(1);
if (/^[a-f0-9]{64}$/.test(fragment)) {
  sessionStorage.setItem("omcode-token", fragment);
  history.replaceState(null, "", location.pathname);
}
export async function api(route, body, options = {}) {
  const response = await fetch(`/api/${route}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("omcode-token") || ""}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
export const query = (values) => new URLSearchParams(values).toString();
