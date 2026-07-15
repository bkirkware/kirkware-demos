import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub'
const OVERVIEW = `${DOCS}/app-port-onboard-overview.html`

export const wrapupSteps: DemoStep[] = [
  {
    id: 'wrap-recap',
    type: 'content',
    section: 'Summary',
    title: 'Recap',
    heading: 'From a CSV to a running, currency-tracked app',
    body: 'One capability, but it spans the entire lifecycle from "I don\'t know what\'s in our portfolio" to "this app is live, and we know exactly what\'s in it."',
    bullets: [
      { title: 'Portfolio-wide discovery', icon: 'file-text', description: 'A CSV of repo URLs plus business metadata becomes a scored, assessed Repository Group — no per-repo manual triage.' },
      { title: 'A suitability score you can rank by', icon: 'gauge', description: 'Challenges, technical facets, and technical debt roll up into one comparative number, overlaid with business criticality to drive real decisions.' },
      { title: 'One command from candidate to running', icon: 'workflow', description: '`cf repo onboard-app` detects challenges, offers automatic fixes, and generates the manifest — `mvn package` and `cf push` finish the job.' },
      { title: 'Currency tracking from day one', icon: 'shield-check', description: 'Publishing the onboarding SBOM to Hub means vulnerability and compliance visibility starts the moment an app goes live, not months later.' },
    ],
    callout: {
      label: 'Where this hands off',
      tone: 'info',
      body: 'This demo stops at "onboarded and currency-tracked." Continuous upgrades from there — SBOM, plan, apply, advice — are the Application Advisor demo\'s whole story.',
    },
    sourceUrl: OVERVIEW,
  },
  {
    id: 'wrap-diagram',
    type: 'diagram',
    section: 'Summary',
    title: 'The full loop',
    heading: 'Discovery, scoring, onboarding, currency — one system',
    diagramId: 'onboarding-lifecycle',
    narrative: 'Every node here started as a row in a CSV and ended as a running, currency-tracked application — with a human decision (mark as candidate, mark as onboarded) at exactly two points, and automation everywhere else.',
    visibleNodeIds: ['candidate', 'onboard', 'manifest', 'build', 'app', 'reassess', 'onboarded'],
    visibleEdgeIds: ['e-candidate-onboard', 'e-onboard-manifest', 'e-manifest-build', 'e-build-app', 'e-app-reassess', 'e-reassess-onboarded'],
  },
  {
    id: 'wrap-closing',
    type: 'title',
    section: 'Summary',
    title: 'Closing',
    eyebrow: 'Discussion',
    heading: 'Questions?',
    subheading: 'Which repository would you run through this first — and what do you already suspect it\'ll tell you?',
  },
]
