const APP_URL = process.env.APP_URL ?? 'https://app.omdala.com';
const API_BASE = process.env.API_BASE_URL ?? 'https://api.omdala.com';

function fail(message) {
  console.error(`[smoke:fallback] ${message}`);
  process.exit(1);
}

async function run() {
  console.log(`[smoke:fallback] check app page: ${APP_URL}`);
  const appResp = await fetch(APP_URL);
  if (!appResp.ok) fail(`app page returned ${appResp.status}`);
  const html = await appResp.text();
  if (!/Om AI|OMDALA App|AI Om/i.test(html)) {
    fail('app page does not contain expected brand markers');
  }

  console.log('[smoke:fallback] request magic link');
  const magicResp = await fetch(`${API_BASE}/v1/auth/magic-link/request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'verify@app.omdala.com', redirectTo: '/dashboard' }),
  });
  if (magicResp.status < 200 || magicResp.status >= 300) {
    fail(`magic-link endpoint returned ${magicResp.status}`);
  }

  console.log('[smoke:fallback] check reality health');
  const healthResp = await fetch(`${API_BASE}/v2/reality/health`);
  if (healthResp.status !== 200) {
    fail(`reality health endpoint returned ${healthResp.status}`);
  }

  console.log('[smoke:fallback] done');
}

await run();
