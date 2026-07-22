# Demo Authoring Guide

Demos are folders of markdown and YAML under `content/demos/<demo-id>/` — no
JavaScript. The app parses and validates them at dev/build time; while
`npm run dev` is running, saving a file updates the running presentation in
place without losing your current step.

```
content/demos/<demo-id>/
  demo.yaml            # title, subtitle, tags, accent, picker order
  diagrams.yaml        # architecture diagrams (optional)
  sections/
    10-preparation.md  # one file per sidebar section; NN- prefix = order
    20-the-demo.md
    90-cleanup.md
```

**Quick start:** `npm run new-demo -- my-demo "My Demo"` copies the template
(`content/demos/_template/`) into a new folder. The
[Authoring Format Tour](../content/demos/format-tour/) demo in the app is this
guide's living counterpart — every feature below, rendered.

**Convention:** structure every demo as **Preparation** (pre-steps: cf
targeting, pre-provisioning, cloning repos) → **Demo** (any number of
sections) → **Cleanup** (return the environment to its pre-demo state).

Folders starting with `_` (like `_template`) are parsed by
`npm run validate:content` but never appear in the app.

## demo.yaml

```yaml
title: Tanzu AI Services                  # required
subtitle: One sentence on the demo
tags: [AI, Tanzu Platform]
accent: "#22d3ee"                         # hex color for gradients
order: 10                                 # picker position, lower first (default 100)
sections: [10-intro.md, 20-deep.md]       # optional explicit order; default = filename sort
```

The folder name is the demo id.

## Section files

Each file starts with frontmatter naming its sidebar group:

```markdown
---
section: Getting Started
---
```

A **step** starts with an H2 in the form `## <type>: <sidebar title> {#step-id}`.
The `{#id}` is optional (a stable slug is generated) but recommended. Types:
`title`, `content`, `discussion`, `question`, `command`, `diagram`.

Immediately after the header, an optional **props block** (`---` fenced YAML)
can set *any* typed field of the step — **props always win** over values
derived from the markdown below them. This is the escape hatch whenever the
sugar can't express something.

HTML comments (`<!-- ... -->` starting at a line, outside code fences) are
author notes and never render.

### Shared props (all step types)

| Prop | Meaning |
| --- | --- |
| `id`, `title` | Alternative to `{#id}` / the header title |
| `links` | `[{label, url}]` — labeled chips beside the heading |
| `source` | URL rendered as a highlighted **Docs** chip (content/command/diagram) |

`$VAR` / `${VAR}` tokens in narrative text, URLs, and code resolve from the
`.env` managed in Settings.

### title — hero / section-divider slides

```markdown
## title: Welcome {#intro-title}
---
eyebrow: VMware Tanzu Platform · AI Services v10.4.3
# variant: section        <- numbered section-divider layout with agenda chips
---

### The Big Heading

One paragraph becomes the subheading. (Plain text here, not markdown.)

- Chip one
- Chip two
```

### content — narrative, cards, callouts

```markdown
## content: Why it matters {#why}
---
source: https://techdocs.broadcom.com/...
# variant: split | stats | quote
---

### Display heading

Markdown body — keep it to a sentence or two. GFM pipe tables render styled;
images (`![alt](/demos/<id>/img.png)`, assets in `public/demos/<id>/`) render
framed with a caption.

- icon:shield **Card title** — description after a space-em-dash-space
- icon:boxes **[Linked title](https://spring.io)** — bold titles can be links
- Plain item (title only)

> [!info] Callout label
> Callout body. Tones: [!info], [!success], [!warning]. One per step.
```

Variants: `split` = body left, cards right · `stats` = cards as big-number
tiles (title = the figure, description = its label) · `quote` = body as an
oversized pull quote. Icon names live in `src/components/ui/iconNames.ts`.

### discussion / question — audience moments

```markdown
## discussion: Self-hosted vs. SaaS {#disc}

The first paragraph is the prompt?

- List items become talking points (discussion) or presenter hints (question)
```

### command — terminal steps

````markdown
## command: Provision a model {#cmd-1}

### Display heading

Paragraphs become the description.

```bash label=provision.sh live=marketplace.sh
cf create-service ai-models all-models my-model
```

```output
Creating service instance my-model ... OK
```

> [!impact]
> What just changed, called out under the commands.
````

- Fence attributes: `label=` (header text; quote values with spaces) and
  `live=` (wires the **Run Live** button to a key in `run-live-commands.ts`
  — an unknown key fails validation).
- An ` ```output ` fence attaches simulated output to the fence directly
  above it, revealed by the **Run** button.

### diagram — progressive architecture reveals

```markdown
## diagram: Trace: app → gorouter {#arch-1}
---
diagram: system-architecture      # id from diagrams.yaml
show: [client, gorouter, e-client-gorouter]   # node AND edge ids, mixed
active: [gorouter]                # highlighted this step
---

### Display heading

Paragraphs become the narrative panel above the diagram.
```

Later steps on the same diagram can build relatively:

```yaml
add: [ai-server, e-gorouter-aiserver]
remove: [client]
```

`show:` replaces the visible set; `add:`/`remove:` adjust the previous step's.
Unknown ids fail validation with the list of defined diagrams.

## diagrams.yaml

A mapping of diagram id → `{ groups?, nodes, edges }`:

```yaml
system-architecture:
  groups:
    - { id: tile, label: AI Services tile, position: { x: 300, y: 40 }, size: { width: 400, height: 300 } }
  nodes:
    - id: client
      label: CF App
      sublabel: bound as a service
      kind: client            # client gateway service model data security observability external platform
      icon: boxes
      position: { x: 40, y: 120 }
      # width: 200            # optional
      # group: tile           # optional group membership
  edges:
    - id: e-client-gw         # id optional; defaults to e-<source>-<target>
      source: client
      target: gateway
      label: HTTPS
      animated: true          # dashed: true also available
      # sourceSide/targetSide: top|bottom|left|right — force connector sides
      # waypoints: [{ x: 500, y: 80 }] — route around obstacles
```

## Validation

Everything is checked at dev/build time and by `npm run validate:content`,
with file:line errors: unknown step types or props, missing required fields,
unknown diagram/node/edge ids, `live=` keys missing from the allowlist, bad
callout tones, duplicate step ids, orphan output fences; unknown icons warn.

## Tooling

| Command | Purpose |
| --- | --- |
| `npm run dev` | Present; content edits hot-reload in place |
| `npm run validate:content` | Validate every demo (including `_`-prefixed) |
| `npm run new-demo -- <id> "<Title>"` | Scaffold a demo from the template |
| `npm test` | Parser unit tests |
| `npm run screenshots -- <name> [demo-id]` | Walk every step headlessly, save PNGs |
| `npx tsx scripts/diff-screenshots.ts a b` | Perceptually diff two screenshot runs |

To allowlist a new Run Live command, add an entry to
`run-live-commands.ts` — the browser can only ever reference keys from that
table, never send command text.
