import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

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
const repoRoot = process.cwd()
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

run('pnpm', ['--filter', target.packageName, 'build'])

if (!existsSync(outDir)) {
  console.error(`Expected static export output at ${outDir}, but it was not found.`)
  process.exit(1)
}

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
