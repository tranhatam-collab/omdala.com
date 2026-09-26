export function apiTimeout(route) {
  const endpoint = route.split("?")[0];
  if (["provider/probe", "embedding/run"].includes(endpoint)) return 130000;
  if (endpoint === "terminal") return 65000;
  if (
    ["agent/prepare", "mcp/call", "mcp/prepare", "import/skills"].includes(
      endpoint,
    )
  )
    return 60000;
  if (["provider/check", "import/providers", "mcp/check"].includes(endpoint))
    return 30000;
  if (["file", "edit/restore", "agent/apply"].includes(endpoint)) return 30000;
  return 15000;
}

// Every local request, including response body reads, has a finite deadline.
// An expired write has an unknown outcome: do not retry it automatically.
export async function requestJSON(
  route,
  body,
  {
    token = "",
    signal,
    timeoutMs = apiTimeout(route),
    fetchImpl = globalThis.fetch,
  } = {},
) {
  const controller = new AbortController();
  let timedOut = false;
  const cancelled = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancelled();
  else signal?.addEventListener("abort", cancelled, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetchImpl.call(globalThis, `/api/${route}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  } catch (error) {
    if (timedOut)
      throw new Error(
        body === undefined
          ? "OMCODE local phản hồi quá thời gian. Bạn có thể tải lại; chưa xác định nguyên nhân Documents/iCloud."
          : "Thao tác local quá thời gian; kết quả có thể đã thay đổi. Kiểm tra trạng thái trước khi thử lại, không tự gửi lại yêu cầu AI hoặc lệnh.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancelled);
  }
}
