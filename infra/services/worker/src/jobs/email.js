// Email Job Handler
// Sends transactional emails via mail.iai.one or configured SMTP

export async function emailJob(job) {
  const { to, subject, html, text, from } = job.data;

  const payload = {
    to,
    subject,
    html,
    text,
    from: from || process.env.EMAIL_FROM || 'noreply@omdala.com',
  };

  const response = await fetch(process.env.EMAIL_API_URL || 'https://mail.iai.one/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email failed: ${error}`);
  }

  return { success: true, messageId: await response.json().then(r => r.id) };
}
