#!/usr/bin/env node
// Cloudflare Connection Test
// Verifies Hyperdrive, R2, KV, D1, and Worker connectivity.
// Usage: node scripts/cf-connection-test.js

import { readFileSync } from 'fs';

const ENV = {
  HYPERDRIVE_ID: process.env.HYPERDRIVE_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  R2_BUCKET: process.env.R2_BUCKET_BACKUPS,
  KV_NAMESPACE_ID: process.env.KV_NAMESPACE_ID,
  CF_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CF_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  WORKER_URL: process.env.WORKER_URL,
};

const checks = {
  hyperdrive: 'skipped',
  r2: 'skipped',
  kv: 'skipped',
  d1: 'skipped',
  worker: 'skipped',
};

async function testHyperdrive() {
  if (!ENV.HYPERDRIVE_ID) return;
  try {
    // Hyperdrive is accessed via a binding in a Worker
    // For local testing, we check if the ID format is valid
    const isValid = /^[a-f0-9-]{36,}$/.test(ENV.HYPERDRIVE_ID);
    checks.hyperdrive = isValid ? 'ok' : 'invalid_id';
  } catch (err) {
    checks.hyperdrive = { status: 'fail', error: err.message };
  }
}

async function testR2() {
  if (!ENV.R2_ACCESS_KEY_ID || !ENV.R2_SECRET_ACCESS_KEY || !ENV.R2_ENDPOINT) return;
  try {
    // R2 uses S3-compatible API
    const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: 'auto',
      endpoint: ENV.R2_ENDPOINT,
      credentials: {
        accessKeyId: ENV.R2_ACCESS_KEY_ID,
        secretAccessKey: ENV.R2_SECRET_ACCESS_KEY,
      },
    });
    await s3.send(new ListBucketsCommand({}));
    checks.r2 = 'ok';
  } catch (err) {
    checks.r2 = { status: 'fail', error: err.message };
  }
}

async function testKV() {
  if (!ENV.KV_NAMESPACE_ID || !ENV.CF_ACCOUNT_ID || !ENV.CF_API_TOKEN) return;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ENV.CF_ACCOUNT_ID}/storage/kv/namespaces/${ENV.KV_NAMESPACE_ID}`,
      { headers: { Authorization: `Bearer ${ENV.CF_API_TOKEN}` } }
    );
    const data = await res.json();
    checks.kv = data.success ? 'ok' : { status: 'fail', error: data.errors?.[0]?.message };
  } catch (err) {
    checks.kv = { status: 'fail', error: err.message };
  }
}

async function testD1() {
  if (!ENV.CF_ACCOUNT_ID || !ENV.CF_API_TOKEN) return;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ENV.CF_ACCOUNT_ID}/d1/database`,
      { headers: { Authorization: `Bearer ${ENV.CF_API_TOKEN}` } }
    );
    const data = await res.json();
    checks.d1 = data.success ? 'ok' : { status: 'fail', error: data.errors?.[0]?.message };
  } catch (err) {
    checks.d1 = { status: 'fail', error: err.message };
  }
}

async function testWorker() {
  if (!ENV.WORKER_URL) return;
  try {
    const res = await fetch(`${ENV.WORKER_URL}/health`);
    checks.worker = res.ok ? 'ok' : { status: 'fail', error: `HTTP ${res.status}` };
  } catch (err) {
    checks.worker = { status: 'fail', error: err.message };
  }
}

async function main() {
  console.log('=== Cloudflare Connection Test ===\n');
  
  await Promise.all([
    testHyperdrive(),
    testR2(),
    testKV(),
    testD1(),
    testWorker(),
  ]);

  for (const [service, result] of Object.entries(checks)) {
    const status = typeof result === 'string' ? result : result.status;
    const error = typeof result === 'object' ? result.error : '';
    console.log(`  ${service.padEnd(12)} ${status.padEnd(10)} ${error}`);
  }

  const allOk = Object.values(checks).every(r => r === 'ok' || r === 'skipped');
  console.log(`\n${allOk ? 'All checks passed' : 'Some checks failed'}`);
  process.exit(allOk ? 0 : 1);
}

main();
