import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

const en = JSON.parse(readFileSync(resolve(root, "content/en.json"), "utf8"))
const vi = JSON.parse(readFileSync(resolve(root, "content/vi.json"), "utf8"))

const enPages = en.publicPages || {}
const viPages = vi.publicPages || {}

const enKeys = Object.keys(enPages)
const viKeys = Object.keys(viPages)

let exitCode = 0

for (const key of enKeys) {
  if (!viKeys.includes(key)) {
    console.error(`MISSING public page in vi.json: ${key}`)
    exitCode = 1
  }
}
for (const key of viKeys) {
  if (!enKeys.includes(key)) {
    console.log(`EXTRA public page in vi.json: ${key}`)
  }
}

console.log(`EN publicPages keys: ${enKeys.join(", ")}`)
console.log(`VI publicPages keys: ${viKeys.join(", ")}`)

if (exitCode === 0 && enKeys.length === viKeys.length) {
  console.log(`PASS: Both locales have ${enKeys.length} public pages with matching keys`)
}
process.exit(exitCode)
