async function readJson(response) {
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    const message = payload?.error?.message || "Request failed";
    throw new Error(message);
  }

  return payload.data;
}

export async function loginToRoomState({
  apiBaseUrl,
  email,
  password,
  roomId,
}) {
  const loginResponse = await fetch(`${apiBaseUrl}/v2/omniverse/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = await readJson(loginResponse);

  const roomResponse = await fetch(
    `${apiBaseUrl}/v2/omniverse/rooms/${encodeURIComponent(roomId)}/state`,
    {
      method: "GET",
      headers: { authorization: `Bearer ${session.accessToken}` },
    },
  );
  const roomData = await readJson(roomResponse);

  return {
    session,
    roomState: roomData.roomState,
  };
}
