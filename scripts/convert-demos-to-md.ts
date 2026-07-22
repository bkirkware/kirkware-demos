import fs from 'node:fs'
import path from 'node:path'
import * as YAML from 'yaml'
import type {
  Callout,
  CommandStep,
  ContentBullet,
  ContentStep,
  DemoDefinition,
  DemoStep,
  DiagramDef,
  DiagramStep,
  DiscussionStep,
  QuestionStep,
  TitleStep,
} from '../src/types/demo.ts'
import { parseDemoDir } from '../content-pipeline/parseDemo.ts'

/**
 * One-off migration: serializes the TypeScript-authored demos in src/demos/
 * into the markdown + YAML format under content/demos/, then re-parses its
 * own output through the real content pipeline and deep-compares against the
 * original DemoDefinition. Exits non-zero (and prints the step/field path)
 * on any difference, so the migration is provably content-neutral.
 *
 * Serialization prefers the readable markdown sugar and falls back to the
 * step's YAML props block for any value the sugar grammar can't round-trip
 * (per-field, or whole-list for bullets) — so conversion can never fail,
 * only get less pretty.
 *
 *   npx tsx scripts/convert-demos-to-md.ts
 */

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_ROOT = path.join(ROOT, 'content', 'demos')

/** Display order in the demo picker (demo.yaml `order`), matching the old registry. */
const DEMOS: { id: string; order: number }[] = [
  { id: 'tanzu-ai-services', order: 10 },
  { id: 'application-advisor', order: 20 },
  { id: 'cf-coding-agents', order: 30 },
  { id: 'kirkwaregpt', order: 40 },
  { id: 'app-assessment', order: 50 },
]

// ---------------------------------------------------------------------------
// Safety predicates: can this value round-trip through the markdown sugar?
// ---------------------------------------------------------------------------

/** Lines the section parser treats as structure rather than paragraph text. */
function lineIsStructural(line: string): boolean {
  return /^#/.test(line) || /^>/.test(line) || /^-\s/.test(line) || /^`{3,}/.test(line) || /^---\s*$/.test(line)
}

/**
 * True if `text` survives: split into blank-line-separated blocks, each block
 * trimmed, re-joined with exactly one blank line — the parser's paragraph
 * normalization.
 */
function safeParagraphBlock(text: string | undefined): text is string {
  if (!text) return false
  const reconstructed = text
    .split(/\n[ \t]*\n+/)
    .map((p) => p.trim())
    .join('\n\n')
  if (reconstructed !== text) return false
  return text.split('\n').every((l) => !lineIsStructural(l))
}

function safeListItem(item: string): boolean {
  return item !== '' && item === item.trim() && !item.includes('\n')
}

/** Renders a ContentBullet as a card-sugar line, or null if it can't round-trip. */
function cardLine(bullet: ContentBullet): string | null {
  const { title, titleUrl, description, icon } = bullet
  if (icon != null && !/^[a-z0-9-]+$/.test(icon)) return null
  if (title === '' || title !== title.trim() || title.includes('\n') || title.includes('**')) return null
  if (description != null && (description.includes('\n') || description === '')) return null
  if (titleUrl != null && (/\s/.test(titleUrl) || titleUrl.includes(')') || title.includes('[') || title.includes(']'))) return null

  const prefix = icon ? `icon:${icon} ` : ''
  if (titleUrl == null && description == null) {
    // Plain form: `- title` (parser requires it not to look like other sugar).
    if (title.startsWith('icon:') || /^\[!/.test(title)) return null
    return `- ${prefix}${title}`
  }
  const bold = titleUrl ? `**[${title}](${titleUrl})**` : `**${title}**`
  return description != null ? `- ${prefix}${bold} — ${description}` : `- ${prefix}${bold}`
}

function safeCallout(callout: Callout): boolean {
  return (
    callout.tone != null &&
    callout.label !== '' &&
    callout.label === callout.label.trim() &&
    !callout.label.includes('\n') &&
    callout.body !== '' &&
    callout.body === callout.body.trim()
  )
}

function safeHeading(heading: string): boolean {
  return heading !== '' && heading === heading.trim() && !heading.includes('\n')
}

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/
/** Sidebar titles must survive the `## type: Title {#id}` header line. */
function safeSidebarTitle(title: string): boolean {
  return title !== '' && title === title.trim() && !title.includes('\n') && !title.includes('{#')
}

// ---------------------------------------------------------------------------
// Step emission
// ---------------------------------------------------------------------------

/** Fields serialized via sugar are deleted from `props`; the rest go to YAML. */
function emitStep(step: DemoStep): string {
  const out: string[] = []
  const props: Record<string, unknown> = {}

  const headerTitle = safeSidebarTitle(step.title) ? step.title : 'step'
  if (!safeSidebarTitle(step.title)) props['title'] = step.title
  const idSuffix = ID_RE.test(step.id) ? ` {#${step.id}}` : ''
  if (!idSuffix) props['id'] = step.id
  out.push(`## ${step.type}: ${headerTitle}${idSuffix}`)

  const body: string[] = []
  const pushHeading = (heading: string) => {
    if (safeHeading(heading)) body.push('', `### ${heading}`)
    else props['heading'] = heading
  }
  const pushParagraphs = (key: string, text: string | undefined) => {
    if (text == null) return
    if (safeParagraphBlock(text)) body.push('', text)
    else props[key] = text
  }
  const pushPlainList = (key: string, items: string[] | undefined) => {
    if (items == null) return
    if (items.length > 0 && items.every(safeListItem)) body.push('', ...items.map((i) => `- ${i}`))
    else props[key] = items
  }
  const pushSource = (sourceUrl: string | undefined) => {
    if (sourceUrl != null) props['source'] = sourceUrl
  }

  switch (step.type) {
    case 'title': {
      const s = step as TitleStep
      if (s.eyebrow != null) props['eyebrow'] = s.eyebrow
      pushHeading(s.heading)
      pushParagraphs('subheading', s.subheading)
      pushPlainList('bullets', s.bullets)
      break
    }
    case 'content': {
      const s = step as ContentStep
      pushHeading(s.heading)
      pushParagraphs('body', s.body)
      if (s.bullets != null) {
        const lines = s.bullets.map(cardLine)
        if (s.bullets.length > 0 && lines.every((l): l is string => l != null)) body.push('', ...lines)
        else props['bullets'] = s.bullets
      }
      if (s.callout != null) {
        if (safeCallout(s.callout)) {
          body.push('', `> [!${s.callout.tone}] ${s.callout.label}`, ...s.callout.body.split('\n').map((l) => (l === '' ? '>' : `> ${l}`)))
        } else props['callout'] = s.callout
      }
      pushSource(s.sourceUrl)
      break
    }
    case 'discussion': {
      const s = step as DiscussionStep
      pushParagraphs('prompt', s.prompt)
      pushPlainList('talkingPoints', s.talkingPoints)
      break
    }
    case 'question': {
      const s = step as QuestionStep
      pushParagraphs('prompt', s.prompt)
      pushPlainList('hints', s.hints)
      break
    }
    case 'command': {
      const s = step as CommandStep
      pushHeading(s.heading)
      pushParagraphs('description', s.description)
      const fences: string[] = []
      let fencesOk = true
      for (const cmd of s.commands) {
        const attrs: string[] = []
        for (const [key, value] of [
          ['label', cmd.label],
          ['live', cmd.liveId],
        ] as const) {
          if (value == null) continue
          if (/^[^\s"]+$/.test(value)) attrs.push(`${key}=${value}`)
          else if (!value.includes('"') && !value.includes('\n')) attrs.push(`${key}="${value}"`)
          else fencesOk = false
        }
        if (!/^\S+$/.test(cmd.lang) || cmd.lang === 'output') fencesOk = false
        if (!fencesOk) break
        fences.push('', `${fence(cmd.code)}${cmd.lang}${attrs.length > 0 ? ' ' + attrs.join(' ') : ''}`, cmd.code, fence(cmd.code))
        if (cmd.output != null) fences.push('', `${fence(cmd.output)}output`, cmd.output, fence(cmd.output))
      }
      if (fencesOk && s.commands.length > 0) body.push(...fences)
      else props['commands'] = s.commands
      if (s.impact != null) {
        if (s.impact !== '' && s.impact === s.impact.trim()) {
          body.push('', '> [!impact]', ...s.impact.split('\n').map((l) => (l === '' ? '>' : `> ${l}`)))
        } else props['impact'] = s.impact
      }
      pushSource(s.sourceUrl)
      break
    }
    case 'diagram': {
      const s = step as DiagramStep
      props['diagram'] = s.diagramId
      props['visibleNodeIds'] = s.visibleNodeIds
      props['visibleEdgeIds'] = s.visibleEdgeIds
      if (s.activeNodeIds != null) props['activeNodeIds'] = s.activeNodeIds
      if (s.activeEdgeIds != null) props['activeEdgeIds'] = s.activeEdgeIds
      pushHeading(s.heading)
      pushParagraphs('narrative', s.narrative)
      pushSource(s.sourceUrl)
      break
    }
  }

  if (Object.keys(props).length > 0) {
    out.push('---', YAML.stringify(props, { lineWidth: 0 }).trimEnd(), '---')
  }
  out.push(...body)
  return out.join('\n')
}

/** A fence long enough that no line of `code` can close it early. */
function fence(code: string): string {
  let max = 2
  for (const line of code.split('\n')) {
    const m = /^(`{3,})\s*$/.exec(line)
    if (m) max = Math.max(max, m[1].length)
  }
  return '`'.repeat(max + 1)
}

// ---------------------------------------------------------------------------
// Demo-level serialization
// ---------------------------------------------------------------------------

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  )
}

function writeDemo(demo: DemoDefinition, order: number): void {
  const dir = path.join(OUT_ROOT, demo.meta.id)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(path.join(dir, 'sections'), { recursive: true })

  const metaOut: Record<string, unknown> = { title: demo.meta.title }
  if (demo.meta.subtitle != null) metaOut['subtitle'] = demo.meta.subtitle
  if (demo.meta.tags != null) metaOut['tags'] = demo.meta.tags
  if (demo.meta.accent != null) metaOut['accent'] = demo.meta.accent
  metaOut['order'] = order
  fs.writeFileSync(path.join(dir, 'demo.yaml'), YAML.stringify(metaOut, { lineWidth: 0 }))

  if (demo.diagrams != null && demo.diagrams.length > 0) {
    fs.writeFileSync(path.join(dir, 'diagrams.yaml'), serializeDiagrams(demo.diagrams))
  }

  // Group consecutive steps by section into one file per run.
  const runs: { section: string; steps: DemoStep[] }[] = []
  for (const step of demo.steps) {
    const last = runs[runs.length - 1]
    if (last && last.section === step.section) last.steps.push(step)
    else runs.push({ section: step.section, steps: [step] })
  }
  const usedNames = new Set<string>()
  runs.forEach((run, i) => {
    let name = slug(run.section)
    for (let n = 2; usedNames.has(name); n++) name = `${slug(run.section)}-${n}`
    usedNames.add(name)
    const file = path.join(dir, 'sections', `${String((i + 1) * 10).padStart(3, '0')}-${name}.md`)
    const content = [
      '---',
      YAML.stringify({ section: run.section }, { lineWidth: 0 }).trimEnd(),
      '---',
      '',
      run.steps.map(emitStep).join('\n\n'),
      '',
    ].join('\n')
    fs.writeFileSync(file, content)
  })
}

/** diagrams.yaml with { x, y } / { width, height } maps inlined for readability. */
function serializeDiagrams(diagrams: DiagramDef[]): string {
  const byId: Record<string, unknown> = {}
  for (const d of diagrams) {
    const entry: Record<string, unknown> = {}
    if (d.groups != null) entry['groups'] = d.groups
    entry['nodes'] = d.nodes
    entry['edges'] = d.edges
    byId[d.id] = entry
  }
  const doc = new YAML.Document(byId)
  YAML.visit(doc, {
    Map(_, node) {
      const keys = node.items.map((item) => String((item.key as YAML.Scalar).value))
      const inline =
        (keys.length === 2 && keys.includes('x') && keys.includes('y')) ||
        (keys.length === 2 && keys.includes('width') && keys.includes('height'))
      if (inline) node.flow = true
    },
  })
  return doc.toString({ lineWidth: 0 })
}

// ---------------------------------------------------------------------------
// Round-trip verification
// ---------------------------------------------------------------------------

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

/** Drops undefined values / keys the way JSON does, for order-insensitive compare. */
function normalize(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

function diffPaths(a: Json, b: Json, at: string, out: string[]): void {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      out.push(`${at}: array length ${a.length} != ${b.length}`)
      return
    }
    a.forEach((item, i) => diffPaths(item, b[i], `${at}[${i}]`, out))
    return
  }
  if (a != null && b != null && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      diffPaths((a as Record<string, Json>)[key] ?? null, (b as Record<string, Json>)[key] ?? null, `${at}.${key}`, out)
    }
    return
  }
  if (a !== b) out.push(`${at}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`)
}

// ---------------------------------------------------------------------------

let failed = false
for (const { id, order } of DEMOS) {
  const mod = (await import(`../src/demos/${id}/index.ts`)) as { default: DemoDefinition }
  const original = mod.default
  writeDemo(original, order)

  const { demo: reparsed, warnings } = parseDemoDir(path.join(OUT_ROOT, id))
  for (const w of warnings) console.warn(`  warn ${w.file}${w.line != null ? `:${w.line}` : ''} — ${w.message}`)

  const diffs: string[] = []
  diffPaths(normalize(original), normalize(reparsed), id, diffs)
  if (diffs.length > 0) {
    failed = true
    console.error(`  FAIL ${id}: ${diffs.length} difference(s) after round-trip:`)
    for (const d of diffs.slice(0, 20)) console.error(`    ${d}`)
    if (diffs.length > 20) console.error(`    … and ${diffs.length - 20} more`)
  } else {
    console.log(`  ok   ${id}: ${original.steps.length} steps round-trip exactly`)
  }
}
process.exit(failed ? 1 : 0)
