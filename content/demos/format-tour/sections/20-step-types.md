---
section: Step Types
---

## content: Content steps {#tour-content}
---
source: https://techdocs.broadcom.com/us/en/vmware-tanzu.html
---

### Cards, callouts, and links

Loose paragraphs become the **body** — normal markdown, including
[links](https://spring.io) and `inline code`. List items become cards.

- icon:boxes **Plain card** — a title with a description after an em-dash
- icon:shield **[Linked card](https://techdocs.broadcom.com)** — the bold title can be a markdown link
- Just a title, no description

> [!info] Callouts
> One callout per content step, with a tone of info, success, or warning.

## discussion: Discussion steps {#tour-discussion}

A discussion step opens a conversation with the audience. The first paragraph
is the prompt; list items become talking points.

- Where would your team push back?
- What would you automate first?

## question: Question steps {#tour-question}

What happens if a step's sugar can't express what you need?

- Any typed field can be set in the props block
- Props always win over markdown-derived values

## diagram: Reveal a diagram {#tour-diagram-1}
---
diagram: pipeline
show: [markdown, pipeline, e-md-pipeline]
active: [pipeline]
---

### From markdown to a live demo

Diagram steps reference a diagram from `diagrams.yaml` and list what is
visible with `show:` — node and edge ids, mixed freely.

## diagram: Build on the last step {#tour-diagram-2}
---
diagram: pipeline
add: [renderer, e-pipeline-renderer]
active: [renderer, e-pipeline-renderer]
---

### Progressive reveal

`add:` and `remove:` are relative to the previous step on the same diagram,
so a progressive reveal never repeats the whole list.
