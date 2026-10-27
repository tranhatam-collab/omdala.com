import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRootEarly = process.cwd()

/**
 * Load optional root `.env` / `.env.local` so `pnpm deploy:*` works without
 * re-exporting secrets in every shell (files are gitignored; never commit values).
 */
function loadOptionalRootEnvFiles() {
  for (const name of ['.env', '.env.local']) {
    const envPath = path.join(repoRootEarly, name)
    if (!existsSync(envPath)) {
      continue
    }
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }
      const eq = trimmed.indexOf('=')
      if (eq === -1) {
        continue
      }
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) {
        process.env[key] = val
      }
    }
  }
}

loadOptionalRootEnvFiles()

const surface = process.argv[2]
const branch = process.argv[3] ?? 'preview'

const SURFACES = {
  web: {
    packageName: '@omdala/web',
    appDir: 'apps/web',
    projectName: process.env.CLOUDFLARE_PAGES_PROJECT_WEB ?? 'omdala-web',
  },
  app: {
    packageName: '@omdala/app',
    appDir: 'apps/app',
    projectName: process.env.CLOUDFLARE_PAGES_PROJECT_APP ?? 'omdala-app',
  },
  admin: {
    packageName: '@omdala/admin',
    appDir: 'apps/admin',
    projectName: process.env.CLOUDFLARE_PAGES_PROJECT_ADMIN ?? 'omdala-admin',
  },
  docs: {
    packageName: '@omdala/docs',
    appDir: 'apps/docs',
    projectName: process.env.CLOUDFLARE_PAGES_PROJECT_DOCS ?? 'omdala-docs',
  },
}

if (!surface || !(surface in SURFACES)) {
  console.error('Usage: node scripts/cloudflare-pages-deploy.mjs <web|app|admin|docs> [branch]')
  process.exit(1)
}

const target = SURFACES[surface]
const repoRoot = repoRootEarly
const outDir = path.join(repoRoot, target.appDir, 'out')

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: repoRoot,
    env: process.env,
    ...options,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function isProductionBranch(value) {
  return value === 'main' || value === 'production'
}

function shouldNoindexSurface(valueSurface, valueBranch) {
  if (valueSurface === 'app' || valueSurface === 'admin') {
    return true
  }

  return !isProductionBranch(valueBranch)
}

function verifyRobotsOutput(valueSurface, expectedNoindex) {
  const robotsPath = path.join(outDir, 'robots.txt')
  if (!existsSync(robotsPath)) {
    console.error(`Expected robots.txt at ${robotsPath}, but it was not found.`)
    process.exit(1)
  }

  const robots = readFileSync(robotsPath, 'utf8')
  const hasDisallowAll = /Disallow:\s*\/\s*$/m.test(robots)
  const hasAllowAll = /Allow:\s*\/\s*$/m.test(robots)

  if (expectedNoindex && !hasDisallowAll) {
    console.error(`Expected noindex robots policy for ${valueSurface} (${branch}), but robots.txt allows indexing.`)
    process.exit(1)
  }

  if (!expectedNoindex && !hasAllowAll) {
    console.error(`Expected indexable robots policy for ${valueSurface} (${branch}), but robots.txt is not allow-all.`)
    process.exit(1)
  }
}

function getCommitHash() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim()
  } catch {
    return undefined
  }
}

const expectedNoindex = shouldNoindexSurface(surface, branch)
const buildEnv = {
  ...process.env,
  CLOUDFLARE_PAGES_BRANCH: branch,
  OMDALA_NOINDEX: expectedNoindex ? 'true' : 'false',
}

run('pnpm', ['--filter', target.packageName, 'build'], { env: buildEnv })

if (!existsSync(outDir)) {
  console.error(`Expected static export output at ${outDir}, but it was not found.`)
  process.exit(1)
}

verifyRobotsOutput(surface, expectedNoindex)

const deployArgs = [
  'pages',
  'deploy',
  outDir,
  '--project-name',
  target.projectName,
  '--branch',
  branch,
  '--commit-dirty',
  'true',
]

const commitHash = process.env.GITHUB_SHA ?? getCommitHash()
if (commitHash) {
  deployArgs.push('--commit-hash', commitHash)
}

const commitMessage =
  process.env.GITHUB_COMMIT_MESSAGE ?? `Deploy ${surface} from OMDALA monorepo`
deployArgs.push('--commit-message', commitMessage)

run('wrangler', deployArgs)
