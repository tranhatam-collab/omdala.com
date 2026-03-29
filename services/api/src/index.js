const jsonHeaders = {
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-OMDALA-Demo-User",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, init = {}) {
  const responseHeaders = new Headers(jsonHeaders);

  if (init.headers) {
    const suppliedHeaders = new Headers(init.headers);

    suppliedHeaders.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
  }

  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: responseHeaders
  });
}

function notFound(pathname) {
  return json(
    {
      error: "Not Found",
      pathname
    },
    {
      status: 404
    }
  );
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function buildSession(url, request) {
  const demoMode = url.searchParams.get("demo") === "1";
  const demoUser = request.headers.get("x-omdala-demo-user");

  if (!demoMode && !demoUser) {
    return {
      authenticated: false,
      authMode: "magic-link",
      user: null,
      availableMethods: ["magic-link", "invite", "wallet"]
    };
  }

  return {
    authenticated: true,
    authMode: "magic-link",
    user: {
      id: "user_demo_operator",
      email: demoUser ?? "operator@omdala.local",
      role: "operator"
    }
  };
}

async function handleMagicLink(request) {
  const payload = await readJson(request);
  const email = payload?.email?.trim?.().toLowerCase?.();

  if (!email) {
    return json(
      {
        error: "Email is required."
      },
      {
        status: 400
      }
    );
  }

  const requestId = crypto.randomUUID();

  return json({
    ok: true,
    requestId,
    channel: "email",
    expiresInMinutes: 15,
    message: `Magic link request accepted for ${email}.`,
    next: "Delivery is mocked for now; persistence and provider wiring come later."
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: jsonHeaders
      });
    }

    if (request.method === "GET" && pathname === "/api/health") {
      return json({
        ok: true,
        service: "api.omdala.com",
        status: "healthy",
        runtime: "cloudflare-workers",
        timestamp: new Date().toISOString(),
        version: "0.1.0"
      });
    }

    if (request.method === "GET" && pathname === "/api/session") {
      return json(buildSession(url, request));
    }

    if (request.method === "POST" && pathname === "/api/auth/magic-link") {
      return handleMagicLink(request);
    }

    return notFound(pathname);
  }
};
