import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

const en = JSON.parse(readFileSync(resolve(root, "content/en.json"), "utf8"))
const vi = JSON.parse(readFileSync(resolve(root, "content/vi.json"), "utf8"))

const localePages = ["home", ...Object.keys(en.publicPages || [])]
const publicPageKeys = Object.keys(en.publicPages || {})

console.log("=== BILINGUAL SOURCE FOUNDER REPORT ===")
console.log(`Generated: ${new Date().toISOString().split("T")[0]}`)
console.log()
console.log(`Locale pages (EN): ${localePages.length}`)
console.log(`Public page bodies (EN): ${publicPageKeys.length}`)
console.log(`Public page bodies (VI): ${Object.keys(vi.publicPages || {}).length}`)
console.log()
console.log("Public page keys:")
for (const key of publicPageKeys) {
  const enHero = en.publicPages[key]?.hero?.title?.substring(0, 40) || "(no hero)"
  const viHero = vi.publicPages[key]?.hero?.title?.substring(0, 40) || "(no hero)"
  const match = enHero === viHero ? "SAME" : "DIFF"
  console.log(`  ${key}: EN="${enHero}" VI="${viHero}" [${match}]`)
}
console.log()
console.log("Chrome sections:", Object.keys(en.site?.chrome || {}).join(", "))
console.log()
console.log("Build status: rebuild web to verify -> npm run build:web")
