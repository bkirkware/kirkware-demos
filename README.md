# kirkware-demos

A presenter tool for live technical demos — guided, keyboard-driven
walkthroughs that mix slide-style content, progressive architecture
diagrams, and terminal commands that can execute for real against a Cloud
Foundry foundation.

Demos are **authored entirely in markdown + YAML** under
[content/demos/](content/demos/) — no JavaScript required. See the
**[Authoring Guide](docs/AUTHORING.md)**, or open the *Authoring Format
Tour* demo in the app for a rendered reference of every feature.

## Running

```bash
npm install
npm run dev        # http://localhost:5173
```

Requires Node 20.19+ / 22.12+. Navigate steps with ←/→ (or Space/PageUp/
PageDown); the sidebar jumps anywhere; your position survives refreshes.

Environment variables for live commands live in `.env`, managed from the
in-app **Settings** screen. "Run Live" buttons execute allowlisted commands
(see `run-live-commands.ts`) through the dev server only.

## Authoring workflow

```bash
npm run new-demo -- my-demo "My Demo"   # scaffold from the template
npm run dev                             # edits hot-reload without losing your step
npm run validate:content                # file:line errors for anything malformed
```

Every demo follows the same skeleton: **Preparation** → **Demo** →
**Cleanup**.

## Repository layout

```
content/demos/<id>/     demo content: demo.yaml, diagrams.yaml, sections/*.md
content-pipeline/       markdown/YAML → DemoDefinition parser + validation
src/                    the React app (rendering, stores, diagram engine)
scripts/                validate-content, new-demo, screenshots, diff-screenshots
vite-plugin-*.ts        dev-server plugins (content, run-live, env settings)
docs/AUTHORING.md       the full authoring reference
```

## Checks

```bash
npm test                  # parser unit tests (vitest)
npm run lint              # oxlint
npm run build             # tsc -b + vite build (also validates all content)
npm run screenshots -- x  # headless step-walk render pass
```

> Historical note: demos were originally TypeScript modules with an in-app
> edit mode. Both were replaced by the markdown pipeline — content edits now
> happen in your editor, with hot reload into the running presentation.
