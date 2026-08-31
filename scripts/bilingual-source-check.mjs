import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

function loadJSON(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"))
}

function deepKeys(obj, prefix = "") {
  const keys = new Set()
  for (const key of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      const sub = deepKeys(obj[key], full)
      sub.forEach((k) => keys.add(k))
    } else {
      keys.add(full)
    }
  }
  return keys
}

const en = loadJSON("content/en.json")
const vi = loadJSON("content/vi.json")

const enKeys = deepKeys(en)
const viKeys = deepKeys(vi)

let exitCode = 0

for (const key of enKeys) {
  if (!viKeys.has(key)) {
    console.error(`MISSING in vi.json: ${key}`)
    exitCode = 1
  }
}
for (const key of viKeys) {
  if (!enKeys.has(key)) {
    console.error(`EXTRA in vi.json: ${key}`)
    exitCode = 1
  }
}

if (exitCode === 0) {
  console.log(`PASS: en.json and vi.json have identical structure (${enKeys.size} keys)`)
}
process.exit(exitCode)
