import type { DemoStep } from '@/types/demo'

const SECTION = 'Custom Reports & Rules'

export const reportingSteps: DemoStep[] = [
  {
    id: 'reporting-intro',
    type: 'content',
    section: SECTION,
    title: 'Beyond the built-in dashboards',
    heading: 'The same data, queried your way',
    body: 'Every chart in the Summary and Repositories views is backed by a GraphQL API — the same one available to you directly, for the questions the built-in views don\'t already answer.',
  },
  {
    id: 'reporting-diagram',
    type: 'diagram',
    section: SECTION,
    title: 'Rules feed reports feed decisions',
    heading: 'The full loop, from custom rule to custom report',
    diagramId: 'currency-reporting-flow',
    narrative: 'Custom rules flag challenges the same way built-in rules do — that data lands in Hub, is queryable via GraphQL, and powers both custom reports and the Playground.',
    visibleNodeIds: ['sbom', 'hub', 'rules', 'graphql', 'reports'],
    visibleEdgeIds: ['e-sbom-hub', 'e-rules-hub', 'e-hub-graphql', 'e-graphql-reports'],
    activeNodeIds: ['rules', 'graphql', 'reports'],
  },
  {
    id: 'reporting-graphql',
    type: 'content',
    section: SECTION,
    title: 'Querying directly',
    heading: 'Altair, or your own tooling',
    body: 'Hub ships an embedded Altair GraphQL client for testing queries interactively, and the same endpoint is fair game for any GraphQL-capable tool or script — including a browser GraphQL inspector extension pointed at Hub while you click around the UI.',
    bullets: [
      {
        title: 'Tanzu Hub — Altair',
        titleUrl: '$HUB_URL/hub/altair/',
        icon: 'braces',
        description: 'The embedded GraphQL playground — write and run a query against your own portfolio data directly.',
      },
    ],
  },
  {
    id: 'reporting-custom-reports',
    type: 'content',
    section: SECTION,
    title: 'Custom Reports',
    heading: 'A sample to start from, not a blank page',
    body: 'The Custom Reports section of App Portfolio Assessment lets you upload a self-contained HTML report that queries the GraphQL API and renders however you like — useful when a stakeholder needs a view shaped differently than anything built in.',
    bullets: [
      { title: 'sample_custom_report.html', icon: 'file-text', description: 'A minimal working example — GraphQL query, basic parsing, a chart. Start here.' },
      { title: 'Playground', icon: 'bar-chart', description: 'A more ambitious report letting you slice and dice by any combination of challenges, facets, and technical debt to find archetypes of similar apps.' },
    ],
    callout: {
      label: 'Try it in the Playground',
      tone: 'info',
      body: 'Pick a Repository Group, then narrow by a characteristic like "Write Local Files" or a framework range like "Spring Boot 2.0 to 2.6" — watch the matching repo set shrink as you add criteria. This is the fastest way to find a coherent modernization wave.',
    },
  },
  {
    id: 'reporting-custom-rules-recap',
    type: 'content',
    section: SECTION,
    title: 'Closing the loop with custom rules',
    heading: 'If a report reveals a gap, a rule can fill it',
    body: 'Custom Reports are often how you *discover* that a custom rule is worth writing — you notice a pattern across several apps that none of the built-in rules capture, then encode it as a new rule scoped to the relevant Repository Group so it shows up automatically in every future assessment.',
    callout: {
      label: 'What\'s not there yet',
      tone: 'info',
      body: 'Custom tagging beyond pattern-matched rules — and saving/loading/comparing archetypes directly in the Playground — are both roadmap items, not available today. The pattern-matching case (a regex against source or dependency files) is fully supported now.',
    },
  },
  {
    id: 'reporting-discussion',
    type: 'discussion',
    section: SECTION,
    title: 'Who in your org needs a custom view?',
    prompt: 'A portfolio owner, a security team, and a platform team all want different slices of the same assessment data. Who would you build a custom report for first, and what would it show that the built-in dashboards don\'t?',
    talkingPoints: [
      'Security teams often want a single view of every Blocker-severity challenge across the whole org, cutting across Repository Groups entirely',
      'A portfolio owner usually wants business criticality crossed with suitability — exactly the Summary page\'s core chart, but scoped to their business app',
      'Anything queryable via GraphQL is fair game for a custom report — the built-in views are a starting point, not a ceiling',
    ],
  },
]
