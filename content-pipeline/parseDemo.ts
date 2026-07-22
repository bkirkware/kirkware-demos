import fs from 'node:fs'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import type { DemoDefinition, DemoMeta, DemoStep, DiagramDef } from '../src/types/demo.ts'
import { ALLOWED_COMMANDS } from '../run-live-commands.ts'
import { iconNames } from '../src/components/ui/iconNames.ts'
import { ContentError, type ContentWarning } from './errors.ts'
import { parseDiagrams } from './parseDiagrams.ts'
import { parseSection, type ParsedStep } from './parseSection.ts'
import { resolveDiagramSugar, validateSteps, type ValidateOptions } from './validate.ts'

/**
 * Orchestrator: turns one content/demos/<id>/ folder (demo.yaml +
 * diagrams.yaml + sections/*.md) into a fully validated DemoDefinition.
 * The folder name is the demo id.
 */

export interface ParsedDemo {
  demo: DemoDefinition
  warnings: ContentWarning[]
  /** Absolute paths of every file that fed this demo (for watch invalidation). */
  files: string[]
}

const DEFAULT_OPTIONS: ValidateOptions = {
  liveIds: new Set(Object.keys(ALLOWED_COMMANDS)),
  iconNames: new Set<string>(iconNames),
}

/**
 * Reads just demo.yaml — enough for the registry without parsing sections.
 * `order` sorts the demo picker (lower first, default 100, ties by title).
 */
export function parseDemoMeta(dir: string): { meta: DemoMeta; order: number } {
  const id = path.basename(dir)
  const file = path.join(dir, 'demo.yaml')
  if (!fs.existsSync(file)) throw new ContentError(relName(file), undefined, 'demo folders need a demo.yaml with at least `title:`')
  const raw = readYamlFile(file)
  const meta: DemoMeta = { id, title: expectString(file, 'title', raw['title']) }
  if (raw['subtitle'] != null) meta.subtitle = expectString(file, 'subtitle', raw['subtitle'])
  if (raw['tags'] != null) {
    if (!Array.isArray(raw['tags']) || raw['tags'].some((t) => typeof t !== 'string')) {
      throw new ContentError(relName(file), undefined, '`tags` must be a list of strings')
    }
    meta.tags = raw['tags'] as string[]
  }
  if (raw['accent'] != null) {
    const accent = expectString(file, 'accent', raw['accent'])
    if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(accent)) {
      throw new ContentError(relName(file), undefined, `\`accent\` must be a hex color like "#22d3ee", got "${accent}"`)
    }
    meta.accent = accent
  }
  let order = 100
  if (raw['order'] != null) {
    if (typeof raw['order'] !== 'number') throw new ContentError(relName(file), undefined, '`order` must be a number (lower sorts first)')
    order = raw['order']
  }
  const known = ['title', 'subtitle', 'tags', 'accent', 'sections', 'order']
  const unknown = Object.keys(raw).filter((k) => !known.includes(k))
  if (unknown.length > 0) {
    throw new ContentError(relName(file), undefined, `unknown key(s): ${unknown.join(', ')} — supported: ${known.join(', ')}`)
  }
  return { meta, order }
}

export function parseDemoDir(dir: string, options: ValidateOptions = DEFAULT_OPTIONS): ParsedDemo {
  const { meta } = parseDemoMeta(dir)
  const files: string[] = [path.join(dir, 'demo.yaml')]
  const warnings: ContentWarning[] = []

  let diagrams: DiagramDef[] = []
  const diagramsFile = path.join(dir, 'diagrams.yaml')
  if (fs.existsSync(diagramsFile)) {
    diagrams = parseDiagrams(relName(diagramsFile), fs.readFileSync(diagramsFile, 'utf-8'))
    files.push(diagramsFile)
  }

  const sectionFiles = listSectionFiles(dir)
  files.push(...sectionFiles)

  const parsedSteps: ParsedStep[] = []
  const sections: { file: string; section: string }[] = []
  for (const sectionFile of sectionFiles) {
    const parsed = parseSection(relName(sectionFile), fs.readFileSync(sectionFile, 'utf-8'))
    sections.push({ file: relName(sectionFile), section: parsed.section })
    if (parsed.steps.length === 0) {
      warnings.push({ file: relName(sectionFile), message: 'section file has no steps' })
    }
    for (const step of parsed.steps) {
      parsedSteps.push({ ...step, fields: { ...step.fields, __section: parsed.section } })
    }
  }

  resolveDiagramSugar(parsedSteps, new Map(diagrams.map((d) => [d.id, d])), warnings)

  // Assign ids: explicit ones win; generated ones are slugs of section+title,
  // deduped with a numeric suffix so reordering steps doesn't shift ids.
  const usedIds = new Set(parsedSteps.map((s) => s.id).filter((id): id is string => id != null))
  const steps: (DemoStep & { __file?: string; __line?: number })[] = parsedSteps.map((parsed) => {
    const section = parsed.fields['__section'] as string
    delete parsed.fields['__section']
    let id = parsed.id
    if (!id) {
      const base = slug(`${section}-${parsed.title}`)
      id = base
      for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`
      usedIds.add(id)
    }
    return {
      id,
      type: parsed.type,
      section,
      title: parsed.title,
      ...parsed.fields,
      __file: parsed.file,
      __line: parsed.line,
    } as DemoStep & { __file?: string; __line?: number }
  })

  validateSteps(meta.id, steps, diagrams, options, warnings)
  for (const step of steps) {
    delete step.__file
    delete step.__line
  }

  const demo: DemoDefinition = { meta, steps: steps as DemoStep[] }
  if (diagrams.length > 0) demo.diagrams = diagrams
  return { demo, warnings, files }
}

function listSectionFiles(dir: string): string[] {
  const sectionsDir = path.join(dir, 'sections')
  if (!fs.existsSync(sectionsDir)) {
    throw new ContentError(path.basename(dir), undefined, 'demo folders need a sections/ directory with at least one .md file')
  }
  const all = fs
    .readdirSync(sectionsDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
  if (all.length === 0) throw new ContentError(path.basename(dir), undefined, 'sections/ has no .md files')

  const demoYaml = readYamlFile(path.join(dir, 'demo.yaml'))
  const explicit = demoYaml['sections']
  if (explicit == null) return all.map((f) => path.join(sectionsDir, f))
  if (!Array.isArray(explicit) || explicit.some((s) => typeof s !== 'string')) {
    throw new ContentError(relName(path.join(dir, 'demo.yaml')), undefined, '`sections` must be a list of filenames in sections/')
  }
  const names = explicit as string[]
  for (const name of names) {
    if (!all.includes(name)) {
      throw new ContentError(relName(path.join(dir, 'demo.yaml')), undefined, `\`sections\` lists "${name}" but sections/${name} does not exist`)
    }
  }
  const missing = all.filter((f) => !names.includes(f))
  if (missing.length > 0) {
    throw new ContentError(
      relName(path.join(dir, 'demo.yaml')),
      undefined,
      `sections/ contains files not listed in \`sections\`: ${missing.join(', ')} — list them or delete them`,
    )
  }
  return names.map((f) => path.join(sectionsDir, f))
}

function readYamlFile(file: string): Record<string, unknown> {
  let value: unknown
  try {
    value = parseYaml(fs.readFileSync(file, 'utf-8'))
  } catch (err) {
    throw new ContentError(relName(file), undefined, `invalid YAML: ${err instanceof Error ? err.message : String(err)}`)
  }
  if (value == null) return {}
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ContentError(relName(file), undefined, 'expected a YAML mapping (key: value pairs)')
  }
  return value as Record<string, unknown>
}

function expectString(file: string, key: string, value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ContentError(relName(file), undefined, `\`${key}\` must be a non-empty string`)
  }
  return value
}

/** Shortens an absolute path to something readable in error messages. */
function relName(file: string): string {
  const rel = path.relative(process.cwd(), file)
  return rel.startsWith('..') ? file : rel
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
