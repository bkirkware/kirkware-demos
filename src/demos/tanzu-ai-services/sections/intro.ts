import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'

export const introSteps: DemoStep[] = [
  {
    id: 'intro-title',
    type: 'title',
    section: 'Introduction',
    title: 'Welcome',
    eyebrow: 'VMware Tanzu Platform · AI Services v10.4',
    heading: 'Tanzu AI Services',
    subheading:
      'Bring large language models into your Cloud Foundry applications — hosted on your own infrastructure or proxied to the cloud, all through one gateway your developers already know how to consume.',
    bullets: ['Privacy', 'Accessibility', 'Unlimited Tokens', 'CPU or GPU'],
  },
  {
    id: 'intro-why',
    type: 'content',
    section: 'Introduction',
    title: 'Why Tanzu AI Services',
    heading: 'Four pillars, straight from the product docs',
    body: "Every platform team wrestling with AI adoption runs into the same tension: developers want fast, self-service access to models; platform teams want control over cost, data residency, and hardware. Tanzu AI Services frames its value around four pillars.",
    bullets: [
      {
        title: 'Privacy',
        icon: 'shield',
        description: 'Models run inside your own infrastructure, managed by BOSH and Tanzu Operations Manager — no data has to leave your environment for on-platform models.',
      },
      {
        title: 'Accessibility',
        icon: 'boxes',
        description: 'Models are discoverable in the Cloud Foundry Marketplace — developers self-serve the same way they would provision a database.',
      },
      {
        title: 'Unlimited Tokens',
        icon: 'sparkles',
        description: 'No artificial token caps are imposed by the platform — only your own hardware capacity limits usage.',
      },
      {
        title: 'CPU Hardware Support',
        icon: 'cpu',
        description: 'LLMs can run on modern CPUs for proof-of-concept work, though GPU hardware is recommended once you need production-grade latency.',
      },
    ],
    callout: {
      label: 'Operating model',
      tone: 'info',
      body: "This is an Ops Manager tile — a BOSH-based add-on to Tanzu Platform for Cloud Foundry / Elastic Application Runtime — not a Kubernetes operator or Helm chart. Platform operators configure it in Ops Manager; developers consume it entirely through the familiar `cf marketplace` / `cf create-service` / `cf bind-service` workflow.",
    },
    sourceUrl: `${DOCS}/index.html`,
  },
  {
    id: 'intro-discussion',
    type: 'discussion',
    section: 'Introduction',
    title: 'Self-hosted vs. SaaS',
    prompt: 'Where does your org draw the line between self-hosted models and calling out to a commercial LLM API?',
    talkingPoints: [
      'Data residency and compliance requirements often force on-platform hosting for regulated workloads',
      'SaaS models (OpenAI, Anthropic, Gemini) win on model quality and zero infra ops for lower-sensitivity workloads',
      "Tanzu AI Services doesn't force the choice — the same gateway proxies both, so teams can mix per use case",
    ],
  },
]
