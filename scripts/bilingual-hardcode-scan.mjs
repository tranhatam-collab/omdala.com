import { readFileSync, readdirSync, statSync } from "fs"
import { resolve, extname, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")
const APP_DIR = resolve(root, "apps/web/app")

const SUSPICIOUS_PATTERNS = [
  /["'](Home|About|Contact|FAQ|Vision|Trust|Get Started|Learn More|Sign Up|Log In)["']/g,
  /children:\s*["'][A-Z][a-z]/,
]

let hasIssues = false

function scanFile(filePath) {
  const content = readFileSync(filePath, "utf8")
  const ext = extname(filePath)
  if (![".tsx", ".ts", ".jsx", ".js"].includes(ext)) return

  for (const pattern of SUSPICIOUS_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      console.warn(`POTENTIAL HARDCODE: ${filePath.replace(root, ".")} -> ${matches.join(", ")}`)
      hasIssues = true
    }
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry)
    if (entry === "node_modules" || entry.startsWith(".")) continue
    if (statSync(full).isDirectory()) {
      walk(full)
    } else {
      scanFile(full)
    }
  }
}

walk(APP_DIR)

if (!hasIssues) {
  console.log("PASS: No obvious hardcoded strings found in apps/web/app")
}
