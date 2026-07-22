---
section: Preparation
---

## title: Welcome {#tour-welcome}
---
eyebrow: Kirkware Demos · Authoring Reference
---

### The Markdown Demo Format

Every demo is a folder of markdown and YAML — no JavaScript required. This
demo is itself written in the format it documents.

- One .md file per sidebar section
- Steps are `## type: Title` headers
- Props blocks override anything

## command: Check the environment {#tour-env-check}

### Command steps run things

A command step: fenced code with optional `label=` and `live=` attributes. An
`output` fence right after a command shows simulated output.

```bash label=env-check.sh live=env-check.sh
# Prints the demo environment variables from .env
cat .env
```

```output
CF_ORG=kirkware-demos
CF_SPACE=dev
```

> [!impact]
> The `live=env-check.sh` attribute wires this block to the dev server's
> allowlisted command, so Run Live executes the real thing.
