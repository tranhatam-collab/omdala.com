#!/usr/bin/env node
// Keeps every *.omdala.com surface on the shared brand system.
//   node scripts/brand-check.mjs          verify (CI)
//   node scripts/brand-check.mjs --sync   copy canonical assets into apps
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const assets = join(root, 'packages/ui/assets')
const sync = process.argv.includes('--sync')

const copies = [
  ['logo.svg', 'apps/web/public/logo.svg'],
  ['og-default.svg', 'apps/web/public/og-default.svg'],
  ...['web', 'app', 'admin', 'docs'].map((app) => ['logo.svg', `apps/${app}/app/icon.svg`]),
]

const errors = []

for (const [source, target] of copies) {
  const from = join(assets, source)
  const to = join(root, target)
  const same = existsSync(to) && readFileSync(from).equals(readFileSync(to))
  if (same) continue
  if (sync) {
    copyFileSync(from, to)
    console.log(`synced ${target}`)
  } else {
    errors.push(`${target} differs from packages/ui/assets/${source} (run: pnpm brand:sync)`)
  }
}

// Raw hex colors belong in packages/ui/src/styles/tokens.css only.
const HEX = /#[0-9a-fA-F]{6}\b/g
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(css|tsx?)$/.test(name)) {
      const hits = readFileSync(path, 'utf8').match(HEX)
      if (hits) errors.push(`${relative(root, path)} uses raw colors ${[...new Set(hits)].join(', ')} — use --omdala-* tokens`)
    }
  }
}
for (const app of ['web', 'app', 'admin', 'docs']) walk(join(root, 'apps', app, 'app'))

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('brand check ok')
