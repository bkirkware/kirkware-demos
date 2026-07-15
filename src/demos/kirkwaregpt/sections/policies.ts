import type { DemoStep } from '@/types/demo'

const AI_DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'
const POLICIES_DOC = `${AI_DOCS}/how-to-guides-configure-policies.html`
const SECTION = 'Policies'

export const policiesSteps: DemoStep[] = [
  {
    id: 'policies-intro',
    type: 'content',
    section: SECTION,
    title: 'Governance at the gateway, not in the agent',
    heading: 'Three policy types, one attachment mechanism',
    body: 'Rate limits, quotas, and webhooks are all configured the same way in Tanzu Operations Manager: give the policy a unique **handle**, set its specific fields, save. Handles then get attached to a plan — comma-separated — in that plan\'s Config tab. None of this touches KirkwareGPT\'s own code; every agent bound to the plan inherits the same governance.',
    callout: {
      label: 'Everything below is instructions, not implementation',
      tone: 'info',
      body: 'This section is deliberately Ops Manager click-through instructions rather than commands to run — nothing here gets configured live in this demo.',
    },
    sourceUrl: POLICIES_DOC,
  },
  {
    id: 'policies-rate-limit',
    type: 'content',
    section: SECTION,
    title: 'Configure a rate limit',
    heading: 'Requests per minute, tokens per minute, or both',
    body: 'In Tanzu Operations Manager:',
    bullets: [
      { title: '1. Open the Policy tab', icon: 'gauge', description: 'On the AI Services tile in Operations Manager' },
      { title: '2. Add under Rate Limits', icon: 'route', description: 'Click Add, then enter a unique policy handle — e.g. `1000-tpm`' },
      { title: '3. Set the thresholds', icon: 'activity', description: 'Requests per Minute and/or Tokens per Minute — at least one is required' },
      { title: '4. Save', icon: 'shield-check', description: 'The handle now exists, but applies to nothing until attached to a plan' },
    ],
    sourceUrl: POLICIES_DOC,
  },
  {
    id: 'policies-quota',
    type: 'content',
    section: SECTION,
    title: 'Configure a quota',
    heading: 'A budget over a longer window than a rate limit',
    body: 'Same tab, a different subsection — quotas cap cumulative usage over days or weeks rather than per-minute bursts:',
    bullets: [
      { title: '1. Add under Quotas', icon: 'gauge', description: 'Enter a unique policy handle — e.g. `kirkwaregpt-weekly-budget`' },
      { title: '2. Set request/token thresholds', icon: 'activity', description: 'The cumulative ceiling for the window' },
      { title: '3. Set the duration', icon: 'route', description: 'e.g. `7d` for a one-week rolling window' },
      { title: '4. Save', icon: 'shield-check', description: 'Same handle-then-attach pattern as rate limits' },
    ],
    sourceUrl: POLICIES_DOC,
  },
  {
    id: 'policies-webhook',
    type: 'content',
    section: SECTION,
    title: 'Configure the credit-card filter webhook',
    heading: 'Filtering sensitive data before it reaches the model',
    body: 'A webhook policy points the gateway at an external service that inspects (and can rewrite or block) chat and embedding requests before they reach the model:',
    bullets: [
      { title: '1. Add under Webhooks', icon: 'shield', description: 'Enter a unique policy handle — e.g. `kirkwaregpt-cc-filter`' },
      { title: '2. Populate the endpoint fields', icon: 'globe', description: '`Chat Base URL` and/or `Embedding URL(s)` — the service that receives the request for inspection' },
      { title: '3. Save', icon: 'shield-check', description: 'Same handle-then-attach pattern as the other two policy types' },
    ],
    callout: {
      label: 'Technical preview — and a real documentation gap',
      tone: 'warning',
      body: 'Broadcom\'s own docs state webhook policies "are currently under technical preview and are not recommended for production usage." They also don\'t currently publish the exact request/response payload contract for the filtering service. Build to the general pattern — receive the outbound request, scan for credit-card-shaped strings (a PAN regex, or a library like Microsoft Presidio, which is exactly what the docs\' own example handle name, `presidio-content-filter`, implies), return a redacted or blocked payload — and verify the actual wire format against your own foundation before relying on it.',
    },
    sourceUrl: POLICIES_DOC,
  },
  {
    id: 'policies-apply',
    type: 'content',
    section: SECTION,
    title: 'Apply the policies to a plan',
    heading: 'One field, comma-separated handles',
    body: 'Handles do nothing until attached to a plan:',
    bullets: [
      { title: '1. Open Plan Config', icon: 'layers', description: 'On the AI Services tile, Plan Config tab' },
      { title: '2. Select kirkware-all-models', icon: 'bot', description: 'The plan KirkwareGPT is bound to' },
      { title: '3. Enter the handles', icon: 'route', description: 'In the Policies field: `1000-tpm,kirkwaregpt-weekly-budget,kirkwaregpt-cc-filter`' },
      { title: '4. Save and apply changes', icon: 'shield-check', description: 'Every app bound to this plan — not just KirkwareGPT — now inherits all three policies' },
    ],
    callout: {
      label: 'This is the entire integration surface',
      tone: 'success',
      body: 'KirkwareGPT never sees a line of rate-limit, quota, or filtering logic — it just occasionally gets a throttled or blocked response, exactly like it would from any other quota-governed API.',
    },
    sourceUrl: POLICIES_DOC,
  },
  {
    id: 'policies-diagram',
    type: 'diagram',
    section: SECTION,
    title: 'Where enforcement happens',
    heading: 'At the gateway, in front of the model — never inside the agent',
    diagramId: 'kirkwaregpt-policy-flow',
    narrative: 'Rate limits and quotas throttle at the gateway before a request goes anywhere. The webhook policy inspects the request body — and can rewrite or block it — before it ever reaches claude-sonnet-4-6.',
    visibleNodeIds: ['client', 'gateway', 'webhook', 'model'],
    visibleEdgeIds: ['e-client-gateway', 'e-gateway-webhook', 'e-gateway-model'],
    activeNodeIds: ['gateway', 'webhook'],
    sourceUrl: POLICIES_DOC,
  },
  {
    id: 'policies-question',
    type: 'question',
    section: SECTION,
    title: 'What else needs filtering?',
    prompt: 'Credit-card numbers are one pattern. What other sensitive data would you want a webhook like this one to catch before it reaches a model — for KirkwareGPT, or any other agent on the same plan?',
    hints: [
      'SSNs, internal employee IDs, API keys and tokens accidentally pasted into a chat are all the same shape of problem',
      'A single webhook policy attached to a plan covers every agent bound to it — this isn\'t a per-agent decision once it\'s in place',
      'Technical preview means test thoroughly before leaning on this for anything with compliance stakes',
    ],
  },
]
