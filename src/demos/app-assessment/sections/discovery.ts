import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub'
const GETTING_STARTED = `${DOCS}/app-port-onboard-getting-started.html`
const SCALE = `${DOCS}/app-port-onboard-app-port-scale.html`
const SECTION = 'Portfolio Discovery'

export const discoverySteps: DemoStep[] = [
  {
    id: 'discovery-intro',
    type: 'content',
    section: SECTION,
    title: 'Repository Groups',
    heading: 'The unit of everything: a Repository Group',
    body: 'A Repository Group is a named collection of repos — usually aligned to a team, a business unit, or a line of business — plus the business metadata that makes the results meaningful to a portfolio owner, not just an engineer. RBAC scopes access per group, so a team only ever sees its own portfolio.',
    bullets: [
      { title: 'Source of truth: Git', icon: 'git-branch', description: 'The actual repository URLs — GitHub, GitLab, Bitbucket, or TFS. This is what gets scanned.' },
      { title: 'Business context: the CSV', icon: 'file-text', description: 'App name, business criticality, the business application it rolls up to, technical/business owners, and a cost/investment designation — everything a dashboard needs to matter to a non-engineer.' },
    ],
    callout: {
      label: 'Scale numbers, for context',
      tone: 'info',
      body: 'Up to 8,000 repositories across all groups on an Enterprise install, up to 1,000 small repos (<1MB) per group, with up to five repositories assessed in parallel. Anything over 750MB should be assessed on its own; groups over 500 repos should be saved before running the assessment.',
    },
    sourceUrl: SCALE,
  },
  {
    id: 'discovery-diagram-1',
    type: 'diagram',
    section: SECTION,
    title: 'From CSV to Repository Group',
    heading: 'Step 1 — the CSV creates the group',
    diagramId: 'portfolio-intake-flow',
    narrative: 'Uploading the CSV during group creation is the entire "get my portfolio into Hub" step — no per-repo manual entry.',
    visibleNodeIds: ['csv', 'repogroup'],
    visibleEdgeIds: ['e-csv-repogroup'],
    activeNodeIds: ['repogroup'],
    sourceUrl: GETTING_STARTED,
  },
  {
    id: 'discovery-csv-fields',
    type: 'content',
    section: SECTION,
    title: 'What goes in the CSV',
    heading: 'One row per repository',
    body: 'The same input file works whether you\'re onboarding two repos or two thousand.',
    bullets: [
      { title: 'Repository URL', icon: 'git-branch', description: 'HTTPS only. The `Branch` and `Subfolder` columns handle monorepos and non-default branches.' },
      { title: 'App Name', icon: 'file-text', description: 'What shows up in every Hub view — independent of the repo\'s actual name.' },
      { title: 'Business Criticality & Business App', icon: 'users', description: 'Rolls individual repos up into the business application they serve, and how critical that application is.' },
      { title: 'Technical & Business Owner', icon: 'key', description: 'Who to talk to about this repo — one technical contact, one business contact.' },
      { title: 'Cost & Investment', icon: 'bar-chart', description: 'Whether the business is planning to Invest in or Divest from this application — feeds directly into the modernize-vs-lift-and-shift-vs-divest decision later.' },
      {
        title: 'See it live',
        titleUrl: '$HUB_URL',
        icon: 'gauge',
        description: 'Navigate to App Portfolio Assessment → Repository Groups → Create Repository Group to see this upload step live.',
      },
    ],
  },
  {
    id: 'discovery-create-group',
    type: 'content',
    section: SECTION,
    title: 'Create without assessing, then assess separately',
    heading: 'Two clicks, not one, when you\'re demoing',
    body: 'Repository Group creation and running the assessment are separate steps — useful for a demo (create first, narrate, assess second) and useful in production (stage a large group, then kick off assessment during a maintenance window).',
    bullets: [
      { title: '1. Create Repository Group', icon: 'boxes', description: 'Name it, describe it, pick the Git provider, upload the CSV, add credentials.' },
      { title: '2. Choose: assess now, or later', icon: 'gauge', description: '"Create and Analyze" runs the assessment immediately; "Create" alone just registers the group.' },
      { title: '3. Assess — individually, in bulk, or the whole group', icon: 'workflow', description: 'The Repositories tab\'s action menu covers all three granularities once the group exists.' },
    ],
    sourceUrl: GETTING_STARTED,
  },
  {
    id: 'discovery-diagram-2',
    type: 'diagram',
    section: SECTION,
    title: 'Triggering the assessment',
    heading: 'Step 2 — the engine reads real source code',
    diagramId: 'portfolio-intake-flow',
    narrative: 'Once triggered, the assessment engine clones and statically analyzes every repo in the group — languages, frameworks, dependency manifests, and every rule in the engine\'s ruleset — and publishes the results back to Hub.',
    visibleNodeIds: ['csv', 'repogroup', 'git', 'scanner', 'hub'],
    visibleEdgeIds: ['e-csv-repogroup', 'e-repogroup-scanner', 'e-scanner-git', 'e-scanner-hub'],
    activeNodeIds: ['scanner', 'hub'],
  },
  {
    id: 'discovery-hub-summary',
    type: 'content',
    section: SECTION,
    title: 'The Summary landing page',
    heading: 'One dashboard, every portfolio',
    body: 'Once results land, the Summary page aggregates across every Repository Group you have access to.',
    bullets: [
      {
        title: 'Tanzu Hub — App Portfolio Assessment',
        titleUrl: '$HUB_URL',
        icon: 'gauge',
        description: 'Suitability, business criticality, technical facets, and technical debt — all cross-cut, so a critical app with a blocker-severity challenge stands out from a low-priority app with the same challenge.',
      },
    ],
  },
  {
    id: 'discovery-discussion',
    type: 'discussion',
    section: SECTION,
    title: 'What would your first Repository Group be?',
    prompt: 'If you had to pick one real team or business unit to run through this today, which one — and would you scope it by team, by business application, or by technology stack?',
    talkingPoints: [
      'RBAC is scoped per Repository Group — this is also an access-control decision, not just an organizational one',
      'A diverse first group (mixed languages and frameworks) shows off more of the dashboard; a narrow first group (one team\'s repos) is easier to validate against what that team already knows',
      'Nothing about a Repository Group is permanent — repos can move between groups, and groups can be re-scoped later',
    ],
  },
]
