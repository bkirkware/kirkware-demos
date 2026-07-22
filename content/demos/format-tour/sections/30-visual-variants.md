---
section: Visual Variants
---

## title: Section divider {#tour-divider}
---
variant: section
---

### Visual Variants

Layout variants keep long demos from feeling repetitive — declare them with
one `variant:` line in the props block.

- Section dividers
- Stat tiles
- Split layout
- Pull quotes

## content: Stat tiles {#tour-stats}
---
variant: stats
---

### Numbers that land

- icon:cpu **40+** — steps migrated to markdown, byte-for-byte
- icon:boxes **6** — step types, one authoring grammar
- icon:sparkles **0** — lines of JavaScript to write a demo
- icon:rocket **1** — folder to copy for a new demo

## content: Split layout {#tour-split}
---
variant: split
links:
  - label: Spring.io
    url: https://spring.io
  - label: TechDocs
    url: https://techdocs.broadcom.com
---

### Body left, cards right

The `split` variant pairs a short narrative with supporting cards side by
side — good for "what it is" next to "why it matters".

The `links:` prop renders labeled chips next to the heading, so deep
technical references stay one click away without cluttering the slide.

> [!info] When to use it
> Reach for split when the body would otherwise crowd the cards below it.

- icon:file-text **Concise body** — two short paragraphs, max
- icon:layers **Supporting cards** — stacked in the right column
- icon:globe **Docs chips** — TechDocs and Spring.io, one click away

## content: Pull quote {#tour-quote}
---
variant: quote
---

### Say the big thing once

Platform teams don't want another portal — they want the marketplace they
already trust to hand out models the same way it hands out databases.

## content: Tables via GFM {#tour-table}

### Markdown tables just work

Pipe tables render styled out of the box:

| Wire format | Endpoint | Status |
| --- | --- | --- |
| OpenAI | `/openai/v1/chat/completions` | GA |
| Anthropic | `/anthropic/v1/messages` | Experimental |
| Embeddings | `/openai/v1/embeddings` | GA |
