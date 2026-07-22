import { describe, expect, it } from 'vitest'
import { parseSection } from '../parseSection.ts'
import { ContentError } from '../errors.ts'

const wrap = (body: string) => `---\nsection: Test Section\n---\n\n${body}\n`

describe('parseSection', () => {
  it('requires frontmatter with a section label', () => {
    expect(() => parseSection('f.md', '## title: Hi\n')).toThrow(ContentError)
    expect(() => parseSection('f.md', '---\nother: x\n---\n')).toThrow(/section/)
  })

  it('rejects unknown step types with the list of valid ones', () => {
    expect(() => parseSection('f.md', wrap('## slide: Nope'))).toThrow(/unknown step type "slide".*title, content/)
  })

  it('maps a title step: heading, subheading paragraph, plain bullets', () => {
    const { steps } = parseSection(
      'f.md',
      wrap(['## title: Welcome {#w}', '---', 'eyebrow: Above', '---', '', '### Big Heading', '', 'Sub text here.', '', '- one', '- two'].join('\n')),
    )
    expect(steps).toHaveLength(1)
    expect(steps[0].id).toBe('w')
    expect(steps[0].title).toBe('Welcome')
    expect(steps[0].fields).toMatchObject({
      eyebrow: 'Above',
      heading: 'Big Heading',
      subheading: 'Sub text here.',
      bullets: ['one', 'two'],
    })
  })

  it('maps a content step: body, card bullets, callout, source', () => {
    const md = [
      '## content: Cards {#c}',
      '---',
      'source: https://example.com/docs',
      '---',
      '',
      '### Heading',
      '',
      'First paragraph.',
      '',
      'Second paragraph.',
      '',
      '- icon:shield **Privacy** — stays inside',
      '- **[Docs](https://example.com)** — linked title',
      '- plain item',
      '',
      '> [!warning] Watch out',
      '> The body of the callout.',
    ].join('\n')
    const { steps } = parseSection('f.md', wrap(md))
    expect(steps[0].fields).toMatchObject({
      heading: 'Heading',
      body: 'First paragraph.\n\nSecond paragraph.',
      sourceUrl: 'https://example.com/docs',
      bullets: [
        { title: 'Privacy', icon: 'shield', description: 'stays inside' },
        { title: 'Docs', titleUrl: 'https://example.com', description: 'linked title' },
        { title: 'plain item' },
      ],
      callout: { label: 'Watch out', body: 'The body of the callout.', tone: 'warning' },
    })
  })

  it('rejects malformed card bullets with a helpful message', () => {
    expect(() => parseSection('f.md', wrap('## content: X\n### H\n- **Broken* — desc'))).toThrow(/unterminated/)
    expect(() => parseSection('f.md', wrap('## content: X\n### H\n- **T** desc without dash'))).toThrow(/em-dash/)
  })

  it('maps discussion prompts and talking points; question hints', () => {
    const { steps } = parseSection('f.md', wrap('## discussion: D\n\nThe prompt?\n\n- point a\n\n## question: Q\n\nWhy?\n\n- hint 1'))
    expect(steps[0].fields).toMatchObject({ prompt: 'The prompt?', talkingPoints: ['point a'] })
    expect(steps[1].fields).toMatchObject({ prompt: 'Why?', hints: ['hint 1'] })
  })

  it('maps command steps: fences with attrs, attached output, impact', () => {
    const md = [
      '## command: Run {#r}',
      '',
      '### Do the thing',
      '',
      'Description text.',
      '',
      '```bash label=go.sh live=env-check.sh',
      'echo hi',
      '```',
      '',
      '```output',
      'hi',
      '```',
      '',
      '> [!impact]',
      '> Nothing was deployed.',
    ].join('\n')
    const { steps } = parseSection('f.md', wrap(md))
    expect(steps[0].fields).toMatchObject({
      heading: 'Do the thing',
      description: 'Description text.',
      impact: 'Nothing was deployed.',
      commands: [{ lang: 'bash', label: 'go.sh', liveId: 'env-check.sh', code: 'echo hi', output: 'hi' }],
    })
  })

  it('supports double-quoted fence attribute values containing spaces', () => {
    const { steps } = parseSection('f.md', wrap('## command: R\n### H\n```bash label="Chat (openai wire format)" live=env-check.sh\nx\n```'))
    expect(steps[0].fields['commands']).toMatchObject([{ label: 'Chat (openai wire format)', liveId: 'env-check.sh' }])
  })

  it('rejects an output fence with no preceding command fence', () => {
    expect(() => parseSection('f.md', wrap('## command: R\n### H\n```output\nx\n```'))).toThrow(/directly follow/)
  })

  it('requires a heading for title/content/command/diagram steps', () => {
    expect(() => parseSection('f.md', wrap('## content: X\n\nJust a body.'))).toThrow(/### Heading/i)
  })

  it('keeps plain blockquotes in the body but extracts admonitions', () => {
    const { steps } = parseSection('f.md', wrap('## content: X\n### H\n\n> a real quote\n> second line'))
    expect(steps[0].fields['body']).toBe('> a real quote\n> second line')
  })

  it('rejects unknown props keys naming the step type', () => {
    expect(() => parseSection('f.md', wrap('## content: X\n---\nnarrative: nope\n---\n### H'))).toThrow(/unknown prop `narrative` for a content step/)
  })

  it('lets props override sugar-derived values', () => {
    const { steps } = parseSection('f.md', wrap('## content: X\n---\nbody: Override body\n---\n### H\n\nSugar body.'))
    expect(steps[0].fields['body']).toBe('Override body')
  })

  it('collects diagram sugar and requires the diagram id', () => {
    const { steps } = parseSection('f.md', wrap('## diagram: D\n---\ndiagram: main\nshow: [a, b]\nactive: [a]\n---\n### H\n\nNarrative.'))
    expect(steps[0].diagram).toEqual({ diagramId: 'main', show: ['a', 'b'], active: ['a'] })
    expect(steps[0].fields['narrative']).toBe('Narrative.')
    expect(() => parseSection('f.md', wrap('## diagram: D\n### H'))).toThrow(/diagram: <diagram-id>/)
    expect(() => parseSection('f.md', wrap('## diagram: D\n---\ndiagram: m\nshow: [a]\nadd: [b]\n---\n### H'))).toThrow(/`show:` replaces/)
  })

  it('reports the file and line for errors', () => {
    try {
      parseSection('sections/20-demo.md', wrap('## content: X\n### H\n\n> [!nope] Bad\n> body'))
      expect.unreachable()
    } catch (err) {
      expect(err).toBeInstanceOf(ContentError)
      expect((err as ContentError).message).toMatch(/^sections\/20-demo\.md:8 /)
    }
  })
})
