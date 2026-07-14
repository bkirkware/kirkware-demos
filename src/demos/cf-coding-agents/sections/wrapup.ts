import type { DemoStep } from '@/types/demo'

const REPO = 'https://github.com/asaikali/cf-coding-agents/blob/main'

export const wrapupSteps: DemoStep[] = [
  {
    id: 'wrap-recap',
    type: 'content',
    section: 'Wrap-up',
    title: 'Recap',
    heading: 'What actually made the swap possible',
    body: 'None of this required a fork of Claude Code, a custom SDK integration, or a second agent binary. It required a platform that speaks the wire format the tool already expects.',
    bullets: [
      { title: 'cf task, not cf push', icon: 'play', description: 'A coding agent wakes up, works, and exits — the same shape as `cf run-task`, staged once and invoked any number of times.' },
      { title: 'Credentials via UPS', icon: 'key', description: 'Two user-provided services, bridged to flat env vars by `.profile.d/vcap.sh` — never a manifest secret, never a push argument.' },
      { title: 'The model is an env var', icon: 'globe', description: '`ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`, `ANTHROPIC_API_KEY` — three values, pulled from a real AI Services service key, are the entire swap.' },
      { title: 'One gateway, every wire format', icon: 'workflow', description: 'The `anthropic-qwen3.6` plan is the same Tanzu AI Services gateway from the other demo, just answering in the Messages API shape instead of OpenAI\'s.' },
    ],
    callout: {
      label: 'What this scenario deliberately leaves out',
      tone: 'info',
      body: 'This is scenario 1 of five in the source repo — the CLI-binary shape. Scenarios 2-4 swap in SDK-driven agents (Python, then TypeScript) on the same CF patterns; scenario 5 inverts the shape entirely into an always-on Managed Agents worker. The patterns established here — apt-buildpack, .profile.d/, UPS credentials — carry forward unchanged.',
    },
    sourceUrl: `${REPO}/README.md`,
  },
  {
    id: 'wrap-closing',
    type: 'title',
    section: 'Wrap-up',
    title: 'Closing',
    eyebrow: 'Discussion',
    heading: 'Questions?',
    subheading: 'What coding-agent workflow would you point at an on-platform model first?',
  },
]
