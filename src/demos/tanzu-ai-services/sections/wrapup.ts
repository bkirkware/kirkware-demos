import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'

export const wrapupSteps: DemoStep[] = [
  {
    id: 'wrap-recap',
    type: 'content',
    section: 'Wrap-up',
    title: 'Recap & roadmap',
    heading: 'Where the platform is headed',
    body: "A few threads worth calling back to as you close: several capabilities shown today are Experimental or Technical Preview, and the platform's own naming is still catching up with its scope.",
    bullets: [
      { title: 'Anthropic API Plans', icon: 'sparkles', description: 'Experimental as of 10.4.2 — Messages API wire format alongside the default OpenAI format.' },
      { title: 'AI Agent buildpack', icon: 'bot', description: 'Technical Preview — zero-code chat agents, now with SSO and bearer-token MCP auth options.' },
      { title: 'Off-platform MCP OAuth', icon: 'key', description: 'Technical Preview — forward_token and oauth_passthrough auth modes for off-platform MCP servers.' },
      { title: 'Naming migration', icon: 'git-branch', description: 'The marketplace offering was renamed `genai` → `ai-models` in 10.4.0. Prefer the stable `tanzu-ai-models` / `tanzu-mcp-gateway` tags over offering-name lookups going forward.' },
    ],
    callout: {
      label: 'Support boundary, stated plainly',
      tone: 'info',
      body: "Broadcom supports deployment and configuration of specific released vLLM/Ollama versions on GPU hardware. Choosing the right model for a use case, hardware compatibility validation, and performance tuning are explicitly the customer's responsibility.",
    },
    sourceUrl: `${DOCS}/release-notes.html`,
  },
  {
    id: 'wrap-closing',
    type: 'title',
    section: 'Wrap-up',
    title: 'Closing',
    eyebrow: 'Discussion',
    heading: 'Questions?',
    subheading: 'What would it take to get Tanzu AI Services onto your platform roadmap?',
  },
]
