import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parseDemoDir } from '../parseDemo.ts'
import { ContentError } from '../errors.ts'

/** Writes a demo folder from a { relativePath: content } map and parses it. */
let tmpDirs: string[] = []
function demoDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-test-'))
  tmpDirs.push(dir)
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(dir, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
  return dir
}
afterEach(() => {
  for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true })
  tmpDirs = []
})

const DIAGRAMS = `
flow:
  nodes:
    - { id: a, label: A, kind: client, position: { x: 0, y: 0 } }
    - { id: b, label: B, kind: service, position: { x: 100, y: 0 } }
    - { id: c, label: C, kind: data, position: { x: 200, y: 0 } }
  edges:
    - { id: e-ab, source: a, target: b }
    - { source: b, target: c }
`

describe('parseDemoDir', () => {
  it('assembles meta, diagrams, and steps across section files in sorted order', () => {
    const dir = demoDir({
      'demo.yaml': 'title: My Demo\nsubtitle: Sub\ntags: [X]\naccent: "#22d3ee"\n',
      'diagrams.yaml': DIAGRAMS,
      'sections/10-a.md': '---\nsection: One\n---\n\n## title: Hello\n### Hi\n',
      'sections/20-b.md': '---\nsection: Two\n---\n\n## discussion: Talk\n\nPrompt?\n',
    })
    const { demo } = parseDemoDir(dir)
    expect(demo.meta).toMatchObject({ id: path.basename(dir), title: 'My Demo', accent: '#22d3ee' })
    expect(demo.diagrams?.[0].edges.map((e) => e.id)).toEqual(['e-ab', 'e-b-c'])
    expect(demo.steps.map((s) => s.section)).toEqual(['One', 'Two'])
    expect(demo.steps[0].id).toBe('one-hello')
  })

  it('resolves show/add/remove/active sugar into visible and active id lists', () => {
    const dir = demoDir({
      'demo.yaml': 'title: D\n',
      'diagrams.yaml': DIAGRAMS,
      'sections/10-a.md': [
        '---',
        'section: S',
        '---',
        '## diagram: First {#d1}',
        '---',
        'diagram: flow',
        'show: [a, b, e-ab]',
        'active: [b]',
        '---',
        '### H1',
        '## diagram: Second {#d2}',
        '---',
        'diagram: flow',
        'add: [c, e-b-c]',
        'remove: [a]',
        'active: [e-b-c]',
        '---',
        '### H2',
      ].join('\n'),
    })
    const { demo } = parseDemoDir(dir)
    const [d1, d2] = demo.steps as Extract<(typeof demo.steps)[number], { type: 'diagram' }>[]
    expect(d1).toMatchObject({ visibleNodeIds: ['a', 'b'], visibleEdgeIds: ['e-ab'], activeNodeIds: ['b'] })
    expect(d2.visibleNodeIds.sort()).toEqual(['b', 'c'])
    expect(d2.visibleEdgeIds.sort()).toEqual(['e-ab', 'e-b-c'])
    expect(d2.activeEdgeIds).toEqual(['e-b-c'])
  })

  it('rejects unknown diagram ids and unknown node/edge ids', () => {
    const base = {
      'demo.yaml': 'title: D\n',
      'diagrams.yaml': DIAGRAMS,
    }
    expect(() =>
      parseDemoDir(demoDir({ ...base, 'sections/10.md': '---\nsection: S\n---\n## diagram: X\n---\ndiagram: nope\nshow: [a]\n---\n### H' })),
    ).toThrow(/unknown diagram "nope" — defined diagrams: flow/)
    expect(() =>
      parseDemoDir(demoDir({ ...base, 'sections/10.md': '---\nsection: S\n---\n## diagram: X\n---\ndiagram: flow\nshow: [ghost]\n---\n### H' })),
    ).toThrow(/"ghost" is not a node or edge/)
    expect(() =>
      parseDemoDir(demoDir({ ...base, 'sections/10.md': '---\nsection: S\n---\n## diagram: X\n---\ndiagram: flow\nadd: [a]\n---\n### H' })),
    ).toThrow(/first step — use `show:`/)
  })

  it('rejects duplicate step ids across files', () => {
    const dir = demoDir({
      'demo.yaml': 'title: D\n',
      'sections/10-a.md': '---\nsection: A\n---\n## title: T {#dup}\n### H\n',
      'sections/20-b.md': '---\nsection: B\n---\n## title: T {#dup}\n### H\n',
    })
    expect(() => parseDemoDir(dir)).toThrow(/duplicate step id "dup"/)
  })

  it('rejects live= ids missing from the allowlist and accepts known ones', () => {
    const step = (live: string) =>
      `---\nsection: S\n---\n## command: C\n### H\n\`\`\`bash live=${live}\nx\n\`\`\`\n`
    expect(() => parseDemoDir(demoDir({ 'demo.yaml': 'title: D\n', 'sections/10.md': step('not-a-real-id.sh') }))).toThrow(
      /not in ALLOWED_COMMANDS/,
    )
    expect(() => parseDemoDir(demoDir({ 'demo.yaml': 'title: D\n', 'sections/10.md': step('env-check.sh') }))).not.toThrow()
  })

  it('warns on unknown icons instead of failing', () => {
    const dir = demoDir({
      'demo.yaml': 'title: D\n',
      'sections/10.md': '---\nsection: S\n---\n## content: C\n### H\n- icon:not-real **T** — d\n',
    })
    const { warnings } = parseDemoDir(dir)
    expect(warnings.some((w) => w.message.includes('unknown icon "not-real"'))).toBe(true)
  })

  it('honors an explicit sections order from demo.yaml and rejects unlisted files', () => {
    const files = {
      'demo.yaml': 'title: D\nsections: [20-b.md, 10-a.md]\n',
      'sections/10-a.md': '---\nsection: A\n---\n## title: T\n### H\n',
      'sections/20-b.md': '---\nsection: B\n---\n## title: T\n### H\n',
    }
    const { demo } = parseDemoDir(demoDir(files))
    expect(demo.steps.map((s) => s.section)).toEqual(['B', 'A'])
    expect(() =>
      parseDemoDir(demoDir({ ...files, 'demo.yaml': 'title: D\nsections: [20-b.md]\n' })),
    ).toThrow(ContentError)
  })

  it('validates demo.yaml accent format', () => {
    expect(() => parseDemoDir(demoDir({ 'demo.yaml': 'title: D\naccent: blue\n', 'sections/10.md': '---\nsection: S\n---\n## title: T\n### H\n' }))).toThrow(
      /hex color/,
    )
  })
})
