// Fetch raw shadcn components into backend/templates/<name>/, untouched.
// Usage: pnpm --filter backend templates:sync button input label
//
// Templates are the pristine registry source. Token rewriting happens at
// generation time, never here, so a template can always be re-synced and diffed.

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const STYLE = 'base-vega'
const REGISTRY = `https://ui.shadcn.com/r/styles/${STYLE}`
const TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates')

interface RegistryFile {
  path: string
  type: string
  content: string
}
interface RegistryItem {
  name: string
  type: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: RegistryFile[]
}

/** Bare import specifiers → npm package names ("@base-ui/react/button" → "@base-ui/react"). */
function npmImports(source: string): string[] {
  const sf = ts.createSourceFile('x.tsx', source, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX)
  const names = new Set<string>()
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue
    const spec = stmt.moduleSpecifier.text
    if (spec.startsWith('.') || spec.startsWith('@/')) continue
    const parts = spec.split('/')
    names.add(spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0])
  }
  return [...names].sort()
}

async function sync(name: string): Promise<void> {
  const url = `${REGISTRY}/${name}.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${name}: ${res.status} ${res.statusText} (${url})`)
  const item = (await res.json()) as RegistryItem

  const dir = join(TEMPLATES_DIR, name)
  await mkdir(dir, { recursive: true })

  const files = item.files.filter((f) => f.type === 'registry:ui')
  if (files.length === 0) throw new Error(`${name}: registry item has no registry:ui files`)

  const written = []
  for (const file of files) {
    const fileName = basename(file.path)
    await writeFile(join(dir, fileName), file.content)
    written.push({
      file: fileName,
      sha256: createHash('sha256').update(file.content).digest('hex'),
      npmImports: npmImports(file.content),
    })
  }

  const meta = {
    name: item.name,
    style: STYLE,
    sourceUrl: url,
    fetchedAt: new Date().toISOString(),
    registryDependencies: item.registryDependencies ?? [],
    registryNpmDependencies: item.dependencies ?? [],
    files: written,
  }
  await writeFile(join(dir, 'template.json'), JSON.stringify(meta, null, 2) + '\n')
  console.log(`synced ${name}: ${written.map((w) => w.file).join(', ')} (imports: ${written.flatMap((w) => w.npmImports).join(', ')})`)
}

const names = process.argv.slice(2)
if (names.length === 0) {
  console.error('Usage: templates-sync <registry-name> [...]')
  process.exit(1)
}
for (const name of names) await sync(name)
