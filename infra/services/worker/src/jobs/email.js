// Email Job Handler
// Staging delivery is limited to its explicitly configured sink.

const EMAIL_ADDRESS = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

function configuredEmail(env) {
  if (env.NODE_ENV !== 'staging' && env.NODE_ENV !== 'production') {
    throw new Error('EMAIL_ENVIRONMENT_INVALID');
  }
  let url;
  try {
    url = new URL(String(env.EMAIL_API_URL || ''));
  } catch {
    throw new Error('EMAIL_API_URL_INVALID');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('EMAIL_API_URL_INVALID');
  }

  const apiKey = String(env.EMAIL_API_KEY || '').trim();
  const sender = String(env.EMAIL_FROM || '').trim().toLowerCase();
  if (!apiKey || /[<>]/.test(apiKey)) throw new Error('EMAIL_API_KEY_MISSING');
  if (!EMAIL_ADDRESS.test(sender)) throw new Error('EMAIL_FROM_INVALID');

  let sink = null;
  if (env.NODE_ENV === 'staging') {
    sink = String(env.EMAIL_STAGING_SINK_ADDRESS || '').trim().toLowerCase();
    if (!EMAIL_ADDRESS.test(sink)) throw new Error('EMAIL_STAGING_SINK_MISSING');
  }
  return { url: url.toString(), apiKey, sender, sink };
}

export async function emailJob(job, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const config = configuredEmail(env);
  const { to, subject, html, text, from } = job.data;
  const recipient = String(to || '').trim().toLowerCase();
  if (!EMAIL_ADDRESS.test(recipient)) throw new Error('EMAIL_RECIPIENT_INVALID');
  if (config.sink && recipient !== config.sink) throw new Error('EMAIL_STAGING_RECIPIENT_REJECTED');
  const sender = String(from || config.sender).trim().toLowerCase();
  if (!EMAIL_ADDRESS.test(sender) || (config.sink && sender !== config.sender)) {
    throw new Error('EMAIL_SENDER_REJECTED');
  }

  const payload = {
    to: recipient,
    subject,
    html,
    text,
    from: sender,
  };

  const response = await fetchImpl(config.url, {
    method: 'POST',
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email failed: ${error}`);
  }

  return { success: true, messageId: await response.json().then(r => r.id) };
}
