import { parse as parseYaml } from 'yaml'
import type { CommandBlock, Callout, ContentBullet, StepType } from '../src/types/demo.ts'
import { ContentError } from './errors.ts'

/**
 * Line-oriented parser for a demo section markdown file.
 *
 * A section file is:
 *
 *   ---
 *   section: Sidebar Group Label
 *   ---
 *
 *   ## <type>: <sidebar title> {#optional-step-id}
 *   ---                        <- optional YAML props block; any typed field
 *   source: https://…             set here overrides the sugar below
 *   ---
 *
 *   ### Display Heading
 *
 *   Loose paragraphs (markdown). Meaning depends on step type: body /
 *   subheading / prompt / description / narrative.
 *
 *   - list items (bullets / talkingPoints / hints / content cards)
 *
 *   > [!info] Label          <- callout (content steps)
 *   > callout body
 *
 *   > [!impact]              <- impact note (command steps)
 *   > what just happened
 *
 *   ```bash label=x.sh live=allowlist-id
 *   cf marketplace
 *   ```
 *   ```output
 *   simulated output for the fence above
 *   ```
 *
 * The parser is deliberately hand-rolled (not remark): the grammar is
 * line-oriented and every error must carry a file:line an author can jump to.
 */

const STEP_TYPES: readonly string[] = ['title', 'content', 'discussion', 'question', 'command', 'diagram']

/** Diagram-step reveal sugar, resolved against the DiagramDef in parseDemo. */
export interface DiagramSugar {
  diagramId?: string
  show?: string[]
  add?: string[]
  remove?: string[]
  active?: string[]
}

/**
 * A parsed step before demo-level assembly: `fields` holds the typed step
 * fields built from the markdown sugar with props-block overrides already
 * applied; `id` may still be missing (generated later from section + title).
 */
export interface ParsedStep {
  file: string
  line: number
  type: StepType
  title: string
  id?: string
  fields: Record<string, unknown>
  diagram: DiagramSugar
}

export interface ParsedSection {
  file: string
  section: string
  steps: ParsedStep[]
}

interface RawStep {
  type: StepType
  title: string
  id?: string
  line: number
  props: Record<string, unknown>
  heading?: string
  headingLine?: number
  paragraphs: string[]
  listItems: { text: string; line: number }[]
  admonitions: { tone: string; label: string; body: string; line: number }[]
  fences: { lang: string; attrs: Record<string, string>; code: string; line: number }[]
}

const STEP_HEADER_RE = /^##\s+([a-z]+):\s*(.*?)(?:\s*\{#([A-Za-z0-9][A-Za-z0-9_-]*)\})?\s*$/
const FENCE_OPEN_RE = /^(`{3,})\s*(.*)$/
const ADMONITION_RE = /^\[!([a-z]+)\]\s*(.*)$/

export function parseSection(file: string, source: string): ParsedSection {
  const lines = source.split(/\r?\n/)

  // --- File frontmatter -----------------------------------------------------
  if (lines[0]?.trim() !== '---') {
    throw new ContentError(file, 1, `section files must start with YAML frontmatter ("---" … "section: …" … "---")`)
  }
  const fmEnd = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
  if (fmEnd === -1) throw new ContentError(file, 1, 'unterminated frontmatter — missing closing "---"')
  const frontmatter = parseYamlBlock(file, 2, lines.slice(1, fmEnd).join('\n'))
  const section = frontmatter['section']
  if (typeof section !== 'string' || section.trim() === '') {
    throw new ContentError(file, 1, 'frontmatter must set `section:` to the sidebar group label for this file')
  }
  const unknownFm = Object.keys(frontmatter).filter((k) => k !== 'section')
  if (unknownFm.length > 0) {
    throw new ContentError(file, 1, `unknown frontmatter key(s): ${unknownFm.join(', ')} (only \`section\` is allowed)`)
  }

  // --- Split into raw steps -------------------------------------------------
  const raws: RawStep[] = []
  let current: RawStep | null = null
  let openFence: { size: number; lang: string; attrs: Record<string, string>; line: number; buf: string[] } | null = null
  let quoteRun: { lines: string[]; line: number } | null = null
  let paragraph: { lines: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph && current) {
      const text = paragraph.lines.join('\n').trim()
      if (text) current.paragraphs.push(text)
    }
    paragraph = null
  }
  const flushQuote = () => {
    if (quoteRun && current) {
      const stripped = quoteRun.lines.map((l) => l.replace(/^>\s?/, ''))
      const first = stripped[0] ?? ''
      const adm = ADMONITION_RE.exec(first.trim())
      if (adm) {
        current.admonitions.push({
          tone: adm[1],
          label: adm[2].trim(),
          body: stripped.slice(1).join('\n').trim(),
          line: quoteRun.line,
        })
      } else {
        // A plain blockquote is ordinary markdown — keep it in the body.
        if (!paragraph) paragraph = { lines: [] }
        paragraph.lines.push(...quoteRun.lines)
        flushParagraph()
      }
    }
    quoteRun = null
  }

  let inComment = false
  for (let i = fmEnd + 1; i < lines.length; i++) {
    const line = lines[i]
    const lineNo = i + 1

    // HTML comments (outside fences) are author notes — skipped entirely.
    // Only line-anchored comments are recognized: `<!--` at the start of a
    // line through the next line containing `-->`.
    if (!openFence) {
      if (inComment) {
        if (line.includes('-->')) inComment = false
        continue
      }
      if (line.trimStart().startsWith('<!--')) {
        if (!line.includes('-->')) inComment = true
        continue
      }
    }

    if (openFence) {
      const close = /^(`{3,})\s*$/.exec(line)
      if (close && close[1].length >= openFence.size) {
        if (!current) throw new ContentError(file, openFence.line, 'code fence outside of a step')
        if (openFence.lang === 'output') {
          const target = current.fences[current.fences.length - 1]
          if (!target || target.lang === 'output') {
            throw new ContentError(file, openFence.line, 'an ```output fence must directly follow the command fence it belongs to')
          }
          target.attrs['__output'] = openFence.buf.join('\n')
        } else {
          current.fences.push({ lang: openFence.lang, attrs: openFence.attrs, code: openFence.buf.join('\n'), line: openFence.line })
        }
        openFence = null
      } else {
        openFence.buf.push(line)
      }
      continue
    }

    const header = STEP_HEADER_RE.exec(line)
    if (header) {
      flushQuote()
      flushParagraph()
      const [, type, title, id] = header
      if (!STEP_TYPES.includes(type)) {
        throw new ContentError(file, lineNo, `unknown step type "${type}" — expected one of: ${STEP_TYPES.join(', ')}`)
      }
      if (!title.trim()) throw new ContentError(file, lineNo, 'step header needs a sidebar title: `## type: Title`')
      current = {
        type: type as StepType,
        title: title.trim(),
        id,
        line: lineNo,
        props: {},
        paragraphs: [],
        listItems: [],
        admonitions: [],
        fences: [],
      }
      raws.push(current)

      // Optional props block: the first non-blank line after the header is `---`.
      let j = i + 1
      while (j < lines.length && lines[j].trim() === '') j++
      if (j < lines.length && lines[j].trim() === '---') {
        const end = lines.findIndex((l, k) => k > j && l.trim() === '---')
        if (end === -1) throw new ContentError(file, j + 1, 'unterminated props block — missing closing "---"')
        current.props = parseYamlBlock(file, j + 2, lines.slice(j + 1, end).join('\n'))
        i = end
      }
      continue
    }

    if (!current) {
      if (line.trim() === '') continue
      throw new ContentError(file, lineNo, 'content before the first step header — every step starts with `## type: Title`')
    }

    const fence = FENCE_OPEN_RE.exec(line)
    if (fence) {
      flushQuote()
      flushParagraph()
      const info = fence[2].trim()
      const { lang, attrs } = parseFenceInfo(file, lineNo, info)
      openFence = { size: fence[1].length, lang, attrs, line: lineNo, buf: [] }
      continue
    }

    if (line.startsWith('>')) {
      flushParagraph()
      if (!quoteRun) quoteRun = { lines: [], line: lineNo }
      quoteRun.lines.push(line)
      continue
    }
    flushQuote()

    if (/^-\s+/.test(line)) {
      flushParagraph()
      current.listItems.push({ text: line.replace(/^-\s+/, '').trim(), line: lineNo })
      continue
    }

    if (line.startsWith('### ')) {
      flushParagraph()
      if (current.heading != null) {
        throw new ContentError(file, lineNo, 'a step can only have one `### heading` — move extra structure into the body or a props block')
      }
      current.heading = line.slice(4).trim()
      current.headingLine = lineNo
      continue
    }

    if (line.trim() === '') {
      flushQuote()
      flushParagraph()
      continue
    }

    if (!paragraph) paragraph = { lines: [] }
    paragraph.lines.push(line)
  }
  if (openFence) throw new ContentError(file, openFence.line, 'unterminated code fence')
  flushQuote()
  flushParagraph()

  return { file, section, steps: raws.map((raw) => mapStep(file, raw)) }
}

function parseYamlBlock(file: string, startLine: number, text: string): Record<string, unknown> {
  if (text.trim() === '') return {}
  let value: unknown
  try {
    value = parseYaml(text)
  } catch (err) {
    throw new ContentError(file, startLine, `invalid YAML: ${err instanceof Error ? err.message : String(err)}`)
  }
  if (value == null) return {}
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ContentError(file, startLine, 'expected a YAML mapping (key: value pairs)')
  }
  return value as Record<string, unknown>
}

function parseFenceInfo(file: string, line: number, info: string): { lang: string; attrs: Record<string, string> } {
  if (info === '') throw new ContentError(file, line, 'code fences need a language, e.g. ```bash (or ```output for simulated output)')
  const spaceAt = info.search(/\s/)
  const lang = spaceAt === -1 ? info : info.slice(0, spaceAt)
  let rest = spaceAt === -1 ? '' : info.slice(spaceAt)
  const attrs: Record<string, string> = {}
  // key=value attributes; values with spaces are double-quoted.
  const attrRe = /^\s+([a-z]+)=(?:"([^"]*)"|(\S+))/
  for (;;) {
    if (rest.trim() === '') break
    const m = attrRe.exec(rest)
    if (!m) throw new ContentError(file, line, `malformed fence attributes "${rest.trim()}" — expected key=value or key="quoted value"`)
    const key = m[1]
    if (key !== 'label' && key !== 'live') {
      throw new ContentError(file, line, `unknown fence attribute "${key}" — supported: label=, live=`)
    }
    attrs[key] = m[2] ?? m[3]
    rest = rest.slice(m[0].length)
  }
  return { lang, attrs }
}

// ---------------------------------------------------------------------------
// Raw step -> typed step fields
// ---------------------------------------------------------------------------

const CALLOUT_TONES = ['info', 'success', 'warning'] as const

/** Props keys accepted per step type (in addition to `id`, `title`, `links`). */
const ALLOWED_PROPS: Record<StepType, readonly string[]> = {
  title: ['eyebrow', 'heading', 'subheading', 'bullets', 'variant'],
  content: ['heading', 'body', 'bullets', 'callout', 'source', 'variant'],
  discussion: ['prompt', 'talkingPoints'],
  question: ['prompt', 'hints'],
  command: ['heading', 'description', 'commands', 'impact', 'source'],
  diagram: [
    'heading',
    'narrative',
    'diagram',
    'show',
    'add',
    'remove',
    'active',
    'visibleNodeIds',
    'visibleEdgeIds',
    'activeNodeIds',
    'activeEdgeIds',
    'source',
  ],
}

/** Fields where the `source:` prop key maps onto the typed `sourceUrl`. */
const SOURCEABLE: readonly StepType[] = ['content', 'command', 'diagram']

/** Legal `variant:` values per step type (see src/types/demo.ts). */
const VARIANTS: Partial<Record<StepType, readonly string[]>> = {
  title: ['section'],
  content: ['split', 'stats', 'quote'],
}

function mapStep(file: string, raw: RawStep): ParsedStep {
  const { type } = raw
  const fields: Record<string, unknown> = {}
  const diagram: DiagramSugar = {}

  const paragraphsJoined = raw.paragraphs.join('\n\n') || undefined
  const plainList = raw.listItems.map((item) => item.text)

  const requireHeading = () => {
    if (raw.heading == null && raw.props['heading'] == null) {
      throw new ContentError(file, raw.line, `${type} steps need a display heading — add a \`### Heading\` line`)
    }
    if (raw.heading != null) fields['heading'] = raw.heading
  }
  const forbid = (what: 'fences' | 'admonitions' | 'listItems' | 'heading', label: string) => {
    if (what === 'heading' ? raw.heading != null : (raw[what] as unknown[]).length > 0) {
      const line = what === 'heading' ? raw.headingLine : (raw[what] as { line: number }[])[0]?.line
      throw new ContentError(file, line ?? raw.line, `${type} steps don't support ${label}`)
    }
  }

  switch (type) {
    case 'title': {
      requireHeading()
      forbid('fences', 'code fences')
      forbid('admonitions', 'callouts')
      if (paragraphsJoined) fields['subheading'] = paragraphsJoined
      if (plainList.length > 0) fields['bullets'] = plainList
      break
    }
    case 'content': {
      requireHeading()
      forbid('fences', 'code fences (use a command step)')
      if (paragraphsJoined) fields['body'] = paragraphsJoined
      if (raw.listItems.length > 0) {
        fields['bullets'] = raw.listItems.map((item) => parseCardBullet(file, item.line, item.text))
      }
      const callouts = raw.admonitions
      if (callouts.length > 1) {
        throw new ContentError(file, callouts[1].line, 'content steps support a single callout')
      }
      if (callouts.length === 1) {
        const c = callouts[0]
        if (!(CALLOUT_TONES as readonly string[]).includes(c.tone)) {
          throw new ContentError(file, c.line, `unknown callout tone "[!${c.tone}]" — expected [!info], [!success], or [!warning]`)
        }
        if (!c.label) throw new ContentError(file, c.line, 'callouts need a label: `> [!info] Label text`')
        if (!c.body) throw new ContentError(file, c.line, 'callouts need body lines below the label (each starting with `>`)')
        const callout: Callout = { label: c.label, body: c.body, tone: c.tone as Callout['tone'] }
        fields['callout'] = callout
      }
      break
    }
    case 'discussion':
    case 'question': {
      forbid('fences', 'code fences')
      forbid('admonitions', 'callouts')
      forbid('heading', 'a `### heading` (the prompt is the heading)')
      if (paragraphsJoined) fields['prompt'] = paragraphsJoined
      else if (raw.props['prompt'] == null) {
        throw new ContentError(file, raw.line, `${type} steps need a prompt — write it as a paragraph under the step header`)
      }
      if (plainList.length > 0) fields[type === 'discussion' ? 'talkingPoints' : 'hints'] = plainList
      break
    }
    case 'command': {
      requireHeading()
      forbid('listItems', 'list items — use the description paragraph or a content step')
      if (paragraphsJoined) fields['description'] = paragraphsJoined
      const impacts = raw.admonitions
      for (const a of impacts) {
        if (a.tone !== 'impact') {
          throw new ContentError(file, a.line, `command steps only support \`> [!impact]\` admonitions, not [!${a.tone}]`)
        }
      }
      if (impacts.length > 1) throw new ContentError(file, impacts[1].line, 'command steps support a single [!impact] note')
      if (impacts.length === 1) {
        const body = [impacts[0].label, impacts[0].body].filter(Boolean).join('\n')
        if (!body) throw new ContentError(file, impacts[0].line, '[!impact] needs body text')
        fields['impact'] = body
      }
      if (raw.fences.length === 0 && raw.props['commands'] == null) {
        throw new ContentError(file, raw.line, 'command steps need at least one fenced code block')
      }
      if (raw.fences.length > 0) {
        fields['commands'] = raw.fences.map((f): CommandBlock => {
          const block: CommandBlock = { lang: f.lang, code: f.code }
          if (f.attrs['label']) block.label = f.attrs['label']
          if (f.attrs['live']) block.liveId = f.attrs['live']
          if (f.attrs['__output'] != null) block.output = f.attrs['__output']
          return block
        })
      }
      break
    }
    case 'diagram': {
      requireHeading()
      forbid('fences', 'code fences')
      forbid('admonitions', 'callouts')
      forbid('listItems', 'list items — put narrative in paragraphs')
      if (paragraphsJoined) fields['narrative'] = paragraphsJoined
      break
    }
  }

  // Props-block overrides: props always win over sugar-derived values.
  const allowed = ALLOWED_PROPS[type]
  for (const [key, value] of Object.entries(raw.props)) {
    if (key === 'id' || key === 'title') {
      if (typeof value !== 'string' || !value.trim()) throw new ContentError(file, raw.line, `\`${key}\` must be a non-empty string`)
      continue
    }
    if (key === 'links') {
      if (
        !Array.isArray(value) ||
        value.some(
          (l) => l == null || typeof l !== 'object' || typeof (l as Record<string, unknown>)['label'] !== 'string' || typeof (l as Record<string, unknown>)['url'] !== 'string',
        )
      ) {
        throw new ContentError(file, raw.line, '`links` must be a list of { label, url } entries')
      }
      fields['links'] = value
      continue
    }
    if (!allowed.includes(key)) {
      throw new ContentError(file, raw.line, `unknown prop \`${key}\` for a ${type} step — supported: id, title, links, ${allowed.join(', ')}`)
    }
    if (key === 'variant') {
      const legal = VARIANTS[type] ?? []
      if (typeof value !== 'string' || !legal.includes(value)) {
        throw new ContentError(file, raw.line, `\`variant\` for a ${type} step must be one of: ${legal.join(', ')}`)
      }
      fields['variant'] = value
      continue
    }
    if (key === 'source') {
      fields['sourceUrl'] = value
      continue
    }
    if (key === 'diagram') {
      diagram.diagramId = expectString(file, raw.line, key, value)
      continue
    }
    if (key === 'show' || key === 'add' || key === 'remove' || key === 'active') {
      diagram[key] = expectStringArray(file, raw.line, key, value)
      continue
    }
    fields[key] = value
  }

  if (type === 'diagram') {
    if (!diagram.diagramId) {
      throw new ContentError(file, raw.line, 'diagram steps need `diagram: <diagram-id>` in their props block')
    }
    if (diagram.show && (diagram.add || diagram.remove)) {
      throw new ContentError(file, raw.line, '`show:` replaces the visible set — combine it with `active:`, not `add:`/`remove:`')
    }
    fields['diagramId'] = diagram.diagramId
  }
  if (!SOURCEABLE.includes(type) && fields['sourceUrl'] != null) delete fields['sourceUrl']

  const explicitId = raw.props['id']
  return {
    file,
    line: raw.line,
    type,
    title: typeof raw.props['title'] === 'string' ? (raw.props['title'] as string) : raw.title,
    id: raw.id ?? (typeof explicitId === 'string' ? explicitId : undefined),
    fields,
    diagram,
  }
}

/**
 * Content-step card bullets:
 *   - icon:shield **Title** — description
 *   - **[Title](https://…)** — description
 *   - plain text item
 * The ` — ` separator is space + em-dash + space, split on first occurrence
 * after the closing `**`. Anything this grammar can't express belongs in the
 * step's props block as `bullets:` YAML.
 */
function parseCardBullet(file: string, line: number, text: string): ContentBullet {
  let rest = text
  let icon: string | undefined
  const iconMatch = /^icon:([a-z0-9-]+)\s+(.*)$/.exec(rest)
  if (iconMatch) {
    icon = iconMatch[1]
    rest = iconMatch[2]
  }
  if (!rest.startsWith('**')) {
    if (rest.includes('**')) {
      throw new ContentError(file, line, 'card bullets must start with the bold title: `- **Title** — description`')
    }
    return icon ? { title: rest, icon } : { title: rest }
  }
  const close = rest.indexOf('**', 2)
  if (close === -1) throw new ContentError(file, line, 'unterminated `**` in card bullet title')
  let title = rest.slice(2, close)
  const after = rest.slice(close + 2)
  let titleUrl: string | undefined
  const link = /^\[(.+)\]\((\S+)\)$/.exec(title)
  if (link) {
    title = link[1]
    titleUrl = link[2]
  }
  const bullet: ContentBullet = { title }
  if (titleUrl) bullet.titleUrl = titleUrl
  if (icon) bullet.icon = icon
  if (after.trim() !== '') {
    if (!after.startsWith(' — ')) {
      throw new ContentError(
        file,
        line,
        'card bullet descriptions are separated from the title by " — " (space, em-dash, space): `- **Title** — description`',
      )
    }
    bullet.description = after.slice(3)
  }
  return bullet
}

function expectString(file: string, line: number, key: string, value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new ContentError(file, line, `\`${key}\` must be a non-empty string`)
  return value
}

function expectStringArray(file: string, line: number, key: string, value: unknown): string[] {
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
    throw new ContentError(file, line, `\`${key}\` must be a list of ids, e.g. ${key}: [node-a, edge-b]`)
  }
  return value as string[]
}
