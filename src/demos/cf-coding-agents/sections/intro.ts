import type { DemoStep } from '@/types/demo'

const REPO = 'https://github.com/asaikali/cf-coding-agents/blob/main'

export const introSteps: DemoStep[] = [
  {
    id: 'intro-title',
    type: 'title',
    section: 'Introduction',
    title: 'Welcome',
    eyebrow: 'cf-coding-agents · Scenario 1 — the Claude Code CLI binary',
    heading: 'CF Coding Agents',
    subheading:
      'Run Claude Code as a one-shot `cf task` instead of a long-lived web app — then swap the model it talks to for a locally-hosted Qwen, through Tanzu AI Services, without touching a single line of the agent.',
    bullets: ['cf task, not cf push', 'Same binary, either model', 'Zero code changes', 'Credentials via UPS'],
  },
  {
    id: 'intro-why-tasks',
    type: 'content',
    title: 'Why tasks, not servers',
    heading: 'A coding agent isn\'t a server',
    section: 'Introduction',
    body: 'It wakes up, works against a prompt, and exits. `cf task` matches that shape exactly: stage the droplet once, then fire any number of ad-hoc invocations against it with their own command, memory, and disk.',
    bullets: [
      { title: 'No route, no idle instance', icon: 'server', description: 'The manifest declares zero web instances — nothing sits around burning resources between runs.' },
      { title: 'Stage once, run many', icon: 'play', description: '`cf push --task` stages the droplet and leaves it stopped. Each `cf run-task` is a fresh, isolated invocation.' },
      { title: 'Own command, memory, disk', icon: 'layers', description: 'Every task invocation can override the process command and resource limits independently of the staged defaults.' },
      { title: 'Fresh shell every time', icon: 'terminal', description: 'No cross-task state leakage — `.profile.d/` scripts re-run on every single invocation.' },
    ],
    callout: {
      label: 'The three moving parts',
      tone: 'info',
      body: '1) Download the agent binary so the droplet ships an exact, known version. 2) Layer on the tools the agent needs via `apt-buildpack`. 3) Push as a task-only app — no route, no running process, work happens on demand.',
    },
    sourceUrl: `${REPO}/README.md`,
  },
  {
    id: 'intro-discussion',
    type: 'discussion',
    section: 'Introduction',
    title: 'Where would a one-shot agent fit?',
    prompt: 'Think about the agent workflows your team already runs by hand — triage, small fixes, dependency bumps. Which of those is actually a task, not a service?',
    talkingPoints: [
      'Anything that starts from a prompt, does work, and exits cleanly is a `cf task` candidate — no idle web dyno required',
      'The CLI-binary shape (this scenario) generalizes to any pre-built agent binary; scenario 2+ in the source repo swap in SDK-driven agents on the exact same CF patterns',
      'The model behind the agent is a runtime choice, not a build-time one — that is the whole story of this demo',
    ],
  },
]
