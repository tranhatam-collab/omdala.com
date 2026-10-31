import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const MARKER = 'x-om-ai-e2e-transport';

function bundleText(mode: string): string {
  const outDir = mkdtempSync(join(tmpdir(), 'om-ai-web-'));
  try {
    execFileSync('npx', ['vite', 'build', '--mode', mode, '--outDir', outDir, '--emptyOutDir'], { stdio: 'pipe' });
    const assets = join(outDir, 'assets');
    return readdirSync(assets)
      .filter((name) => name.endsWith('.js'))
      .map((name) => readFileSync(join(assets, name), 'utf8'))
      .join('\n');
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

test('production bundle keeps the fail-closed client and contains no e2e transport', () => {
  const text = bundleText('production');
  assert.ok(text.includes('canonical_session_bridge_unavailable'));
  assert.ok(!text.includes(MARKER));
});

test('the e2e transport exists only in an explicit e2e-mode bundle', () => {
  assert.ok(bundleText('e2e').includes(MARKER));
});
