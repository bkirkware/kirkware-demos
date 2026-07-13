import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'

export const policiesSteps: DemoStep[] = [
  {
    id: 'policies-intro',
    type: 'content',
    section: 'Policies & Governance',
    title: 'Four policy types',
    heading: 'Governing how plans get used',
    body: "Policies are configured on the tile's **Policy** tab in Tanzu Operations Manager, each one saved under a short **handle** — then attached to one or more plans by listing those handles on the plan's own config. Two are GA today; two are Technical Preview.",
    bullets: [
      { title: 'Rate Limits', icon: 'gauge', description: 'GA. Throttles a plan by Requests per Minute and/or Tokens per Minute — the day-to-day guardrail against runaway or noisy-neighbor traffic.' },
      { title: 'Quotas', icon: 'shield', description: 'GA. A request/token budget enforced over a longer window (e.g. a week), rather than a per-minute ceiling — good for "this team gets X tokens a week," not just "no bursts."' },
      { title: 'Webhooks', icon: 'workflow', description: "Technical Preview — not recommended for production. Routes chat/embedding traffic through an external endpoint first, e.g. a content-filtering or PII-redaction service." },
      { title: 'Custom', icon: 'braces', description: 'Technical Preview — not recommended for production. Advanced, bespoke policy logic; requires explicit instruction from Broadcom Support to use.' },
    ],
    callout: {
      label: 'Attaching a policy to a plan',
      tone: 'info',
      body: 'Every policy is created once and referenced by handle. On the plan itself, the **Policies** field on the Plan Config tab takes a comma-separated list of those handles — one plan can carry a rate limit and a quota at the same time.',
    },
    sourceUrl: `${DOCS}/how-to-guides-configure-policies.html`,
  },
  {
    id: 'policies-cmd',
    type: 'command',
    section: 'Policies & Governance',
    title: 'Defining and attaching policies',
    heading: 'From the Policy tab to a plan',
    description: "These are Ops Manager form fields, not CLI flags — shown here as the handle → field values a platform operator would fill in, followed by how a plan picks them up.",
    commands: [
      {
        label: 'Rate Limit policy',
        lang: 'text',
        code: `Handle:            1000-tpm
Tokens per Minute: 1000`,
      },
      {
        label: 'Quota policy',
        lang: 'text',
        code: `Handle:   dev-token-budget-weekly
Tokens:   1000000
Duration: 7d`,
      },
      {
        label: 'Webhook policy (Technical Preview)',
        lang: 'text',
        code: `Handle:          presidio-content-filter
Chat Base URL:   https://presidio.internal.example.com/chat
Embedding URL(s): https://presidio.internal.example.com/embeddings`,
      },
      {
        label: 'Plan Config → Policies field',
        lang: 'text',
        code: `1000-tpm,dev-token-budget-weekly`,
        output: `Plan "all-models" updated.
Apply Changes to push the new policy attachments live.`,
      },
    ],
    impact: 'Every request against this plan is now throttled at 1,000 tokens/minute *and* capped at 1,000,000 tokens/week — two independently-tunable guardrails stacked on the same plan, with zero code changes on the app side.',
    sourceUrl: `${DOCS}/how-to-guides-configure-policies.html`,
  },
]
