import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub'
const OVERVIEW = `${DOCS}/app-port-onboard-overview.html`
const SECTION = 'Understanding the Assessment'

export const assessmentSteps: DemoStep[] = [
  {
    id: 'assessment-intro',
    type: 'content',
    section: SECTION,
    title: 'Three signals, one score',
    heading: 'What actually produces a suitability score',
    body: 'A repo\'s suitability score isn\'t a single rule firing — it\'s a rollup of everything the assessment engine found, weighted by severity.',
    bullets: [
      { title: 'Challenges', icon: 'shield', description: 'Specific, actionable problems — a hardcoded file-system write, a J2EE dependency, a `javax.*` import — each with a severity and, sometimes, a recipe.' },
      { title: 'Technical Facets', icon: 'database', description: 'Discovery, not judgment: languages, frameworks, databases, and other technology-stack characteristics. A facet isn\'t good or bad, just true.' },
      { title: 'Technical Debt', icon: 'layers', description: 'Anti-patterns and code-maintenance concerns that make an app harder to work on, independent of whether they block a cloud move.' },
    ],
    callout: {
      label: 'Suitability is a comparative scale',
      tone: 'info',
      body: 'The score estimates relative effort to remediate everything found — it is explicitly not an estimate of man-hours or days. Use it to rank repos against each other, not to build a project plan.',
    },
    sourceUrl: OVERVIEW,
  },
  {
    id: 'assessment-diagram-1',
    type: 'diagram',
    section: SECTION,
    title: 'The suitability model',
    heading: 'Step 1 — three signals roll up into one score',
    diagramId: 'suitability-model',
    narrative: 'Challenges, technical facets, and technical debt each feed the score — none of them alone tells the whole story.',
    visibleNodeIds: ['challenges', 'facets', 'debt', 'score'],
    visibleEdgeIds: ['e-challenges-score', 'e-facets-score', 'e-debt-score'],
    activeNodeIds: ['score'],
    sourceUrl: OVERVIEW,
  },
  {
    id: 'assessment-severity',
    type: 'content',
    section: SECTION,
    title: 'Challenge severity',
    heading: 'Four levels, and what each one means for you',
    body: 'Not every challenge deserves the same response — severity is what tells you where to look first.',
    bullets: [
      { title: 'Low (with recipe)', icon: 'sparkles', description: 'The cheapest win available: an automated fix exists, reviewed as a diff. Start here.' },
      { title: 'Medium', icon: 'shield', description: 'Well-understood by the platform team, with a documented recipe to review and apply — not fully automatic, but not a mystery either.' },
      { title: 'High', icon: 'shield-check', description: 'Typically requires deeper review — solution alternatives that may vary per organization, not a one-size recipe.' },
      { title: 'Blocker', icon: 'help-circle', description: 'A hard stop for platform suitability as-is. Avoid marking these as onboarding candidates until addressed.' },
    ],
    callout: {
      label: 'A good first candidate',
      tone: 'success',
      body: 'Start with high-suitability repos that have a recipe available. If none exist, look at medium-suitability repos next — and steer clear of anything carrying a blocker.',
    },
  },
  {
    id: 'assessment-diagram-2',
    type: 'diagram',
    section: SECTION,
    title: 'Where business context enters',
    heading: 'Step 2 — the score alone doesn\'t decide anything',
    diagramId: 'suitability-model',
    narrative: 'The same suitability score means something different for a low-criticality internal tool versus a high-criticality revenue system. Business criticality and cost/investment — both from the intake CSV — overlay the technical score to drive the actual lift-and-shift / modernize / divest call.',
    visibleNodeIds: ['challenges', 'facets', 'debt', 'score', 'biz', 'decision'],
    visibleEdgeIds: ['e-challenges-score', 'e-facets-score', 'e-debt-score', 'e-biz-decision', 'e-score-decision'],
    activeNodeIds: ['biz', 'decision'],
  },
  {
    id: 'assessment-rules',
    type: 'content',
    section: SECTION,
    title: 'Rules — what actually detects a challenge',
    heading: 'Pattern matching, not magic',
    body: 'Every challenge traces back to a rule — most are regular-expression pattern matches against source files, dependency manifests, or configuration. Open any triggered rule to see exactly what matched and why, and the specific advice tied to it.',
    bullets: [
      { title: 'java-springboot-controllers', icon: 'sparkles', description: 'An example of a suitable-signal rule — detects Spring Boot REST controllers, a strong "already cloud-shaped" indicator.' },
      { title: 'java-file-io-write', icon: 'file-text', description: 'Flags direct filesystem writes — a twelve-factor violation in general, but not universally: some orgs treat this as an intentional feature for specific app types.' },
      { title: 'J2EE / server dependency rules', icon: 'boxes', description: 'Detect application-server-coupled code (EJBs, IWA, desktop dependencies) — usually High severity or a Blocker, since these require real architectural change.' },
    ],
    callout: {
      label: 'Rules are tunable per Repository Group',
      tone: 'info',
      body: 'If a rule doesn\'t fit your org — `java-file-io-write` being a deliberate feature for one team, for instance — change its effort to zero, edit its advice, or ignore it entirely, scoped to the group it applies to.',
    },
  },
  {
    id: 'assessment-question',
    type: 'question',
    section: SECTION,
    title: 'What would a custom rule catch for you?',
    prompt: 'Beyond the built-in rules, what\'s a pattern specific to your organization — a deprecated internal library, a banned dependency, a naming convention — that would be worth detecting as its own challenge or facet?',
    hints: [
      'Custom rules today are pattern/regex-based against source and dependency files, scoped to a Repository Group',
      'A custom rule can be styled as a challenge (something to fix), a debt (something to track), or a facet (something to simply know)',
      'Richer custom tagging is on the roadmap — today\'s custom rules cover the pattern-matching case well, not every possible signal yet',
    ],
  },
]
