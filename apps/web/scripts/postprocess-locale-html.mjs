import { promises as fs } from 'node:fs'
import path from 'node:path'

const OUTPUT_DIR = path.join(process.cwd(), 'out')
const LOCALES = ['vi', 'zh', 'es', 'ja', 'ko']

async function collectHtmlFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        return collectHtmlFiles(fullPath)
      }

      return entry.isFile() && entry.name.endsWith('.html') ? [fullPath] : []
    }),
  )

  return files.flat()
}

async function patchLanguageHtml(locale) {
  const localeDirectory = path.join(OUTPUT_DIR, locale)
  // Gracefully skip locales that were not exported (e.g. zh/es/ja/ko when only en/vi build).
  try {
    await fs.access(localeDirectory)
  } catch {
    console.log(`skipped locale ${locale}: directory not present in out/`)
    return 0
  }
  const htmlFiles = await collectHtmlFiles(localeDirectory)

  await Promise.all(
    htmlFiles.map(async (filePath) => {
      const html = await fs.readFile(filePath, 'utf8')
      const nextHtml = html.replace('<html lang="en">', `<html lang="${locale}">`)

      if (nextHtml !== html) {
        await fs.writeFile(filePath, nextHtml)
      }
    }),
  )

  return htmlFiles.length
}

async function main() {
  const stats = await Promise.all(LOCALES.map(async (locale) => [locale, await patchLanguageHtml(locale)]))

  for (const [locale, count] of stats) {
    console.log(`patched ${count} locale HTML files for ${locale}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
