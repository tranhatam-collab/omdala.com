// OMDALA Worker (P6)
// Full implementation: BullMQ job processor, retry logic, DLQ, alert.

import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import http from 'http';

import { backupJob } from './jobs/backup.js';
import { emailJob } from './jobs/email.js';
import { aiTaskJob } from './jobs/ai-task.js';

const redis = new IORedis(process.env.REDIS_URL || 'redis://valkey:6379');

// Dead Letter Queue for failed jobs
const dlq = new Queue('omdala-dlq', { connection: redis });

// Health endpoint
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'worker',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});
healthServer.listen(3001, () => {
  console.log('Worker health server on port 3001');
});

// Job router
const jobHandlers = {
  'backup': backupJob,
  'email': emailJob,
  'ai-task': aiTaskJob,
};

const worker = new Worker('omdala-queue', async (job) => {
  const handler = jobHandlers[job.name];
  if (!handler) {
    throw new Error(`Unknown job type: ${job.name}`);
  }

  console.log(`[${new Date().toISOString()}] Processing job ${job.id} — ${job.name}`);
  const result = await handler(job);
  console.log(`[${new Date().toISOString()}] Job ${job.id} completed`);
  return result;
}, {
  connection: redis,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 5,
  limiter: { max: 100, duration: 60000 },
  stalledInterval: 30000,
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', async (job, err) => {
  console.error(`Job ${job?.id} failed (${job?.attemptsMade} attempts):`, err.message);

  // Move to DLQ after max retries
  if (job.attemptsMade >= (job.opts?.attempts || 3)) {
    await dlq.add('failed-job', {
      originalJobId: job.id,
      name: job.name,
      data: job.data,
      error: err.message,
      failedAt: new Date().toISOString(),
    });
    console.error(`Job ${job.id} moved to DLQ`);

    // Alert admin
    await fetch(process.env.ALERT_WEBHOOK_URL || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempts and moved to DLQ.`,
      }),
    }).catch(() => {}); // Don't fail if webhook is down
  }
});

worker.on('stalled', (jobId) => {
  console.warn(`Job ${jobId} stalled`);
});

console.log('OMDALA Worker started');
console.log('Registered handlers:', Object.keys(jobHandlers));
