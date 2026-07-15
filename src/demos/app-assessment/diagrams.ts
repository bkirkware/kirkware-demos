import type { DiagramDef } from '@/types/demo'

// Discovery: a CSV of repos + business metadata becomes a Repository Group,
// which triggers an assessment against the actual source code and publishes
// results to Tanzu Hub.
export const portfolioIntakeFlow: DiagramDef = {
  id: 'portfolio-intake-flow',
  nodes: [
    { id: 'csv', label: 'Input CSV', sublabel: 'repo URLs + business metadata', kind: 'client', icon: 'file-text', position: { x: 40, y: 340 }, width: 280 },
    { id: 'repogroup', label: 'Repository Group', sublabel: 'e.g. "JaimeDiverse"', kind: 'gateway', icon: 'boxes', position: { x: 680, y: 340 }, width: 320 },
    { id: 'git', label: 'Source Repositories', sublabel: 'GitHub · GitLab · Bitbucket · TFS', kind: 'external', icon: 'git-branch', position: { x: 1360, y: 60 }, width: 320 },
    { id: 'scanner', label: 'Assessment Engine', sublabel: 'rules · suitability scoring', kind: 'service', icon: 'workflow', position: { x: 1360, y: 340 }, width: 320 },
    { id: 'hub', label: 'Tanzu Hub', sublabel: 'Portfolio Summary', kind: 'observability', icon: 'gauge', position: { x: 2040, y: 340 }, width: 300 },
  ],
  edges: [
    { id: 'e-csv-repogroup', source: 'csv', target: 'repogroup', label: 'creates group', animated: true },
    { id: 'e-repogroup-scanner', source: 'repogroup', target: 'scanner', label: 'triggers assessment', animated: true },
    { id: 'e-scanner-git', source: 'scanner', target: 'git', label: 'reads source', dashed: true },
    { id: 'e-scanner-hub', source: 'scanner', target: 'hub', label: 'publishes results', animated: true },
  ],
}

// What actually produces a suitability score, and how business context
// overlays onto it to drive a lift-and-shift / modernize / divest decision.
export const suitabilityModel: DiagramDef = {
  id: 'suitability-model',
  nodes: [
    { id: 'challenges', label: 'Challenges', sublabel: 'Low · Medium · High · Blocker', kind: 'security', icon: 'shield', position: { x: 40, y: 100 }, width: 320 },
    { id: 'facets', label: 'Technical Facets', sublabel: 'languages · frameworks · databases', kind: 'data', icon: 'database', position: { x: 680, y: 100 }, width: 320 },
    { id: 'debt', label: 'Technical Debt', sublabel: 'anti-patterns · code maintenance', kind: 'service', icon: 'layers', position: { x: 1320, y: 100 }, width: 320 },
    { id: 'score', label: 'Suitability Score', sublabel: 'a comparative scale, not man-hours', kind: 'gateway', icon: 'gauge', position: { x: 680, y: 420 }, width: 320 },
    { id: 'biz', label: 'Business Criticality & Cost', sublabel: 'from the intake CSV', kind: 'client', icon: 'users', position: { x: 40, y: 740 }, width: 320 },
    { id: 'decision', label: 'Lift-and-Shift · Modernize · Divest', sublabel: 'portfolio owner decision', kind: 'platform', icon: 'workflow', position: { x: 680, y: 740 }, width: 340 },
  ],
  edges: [
    { id: 'e-challenges-score', source: 'challenges', target: 'score', label: 'weighs into' },
    { id: 'e-facets-score', source: 'facets', target: 'score', label: 'informs' },
    { id: 'e-debt-score', source: 'debt', target: 'score', label: 'weighs into' },
    { id: 'e-biz-decision', source: 'biz', target: 'decision', label: 'overlay', dashed: true },
    { id: 'e-score-decision', source: 'score', target: 'decision', label: 'drives', animated: true },
  ],
}

// The live-walkthrough lifecycle: a candidate repo goes through onboard-app,
// gets pushed, and comes back around through re-assessment to "Onboarded".
export const onboardingLifecycle: DiagramDef = {
  id: 'onboarding-lifecycle',
  nodes: [
    { id: 'candidate', label: 'Candidate Repo', sublabel: 'marked in Tanzu Hub', kind: 'client', icon: 'git-branch', position: { x: 40, y: 140 }, width: 300 },
    { id: 'onboard', label: 'cf repo onboard-app', sublabel: 'detects + offers auto-fix', kind: 'gateway', icon: 'workflow', position: { x: 680, y: 140 }, width: 340 },
    { id: 'manifest', label: 'Generated manifest.yml', sublabel: 'buildpack + recipe fix applied', kind: 'data', icon: 'file-text', position: { x: 1360, y: 140 }, width: 340 },
    { id: 'build', label: 'mvn package', sublabel: 'local build', kind: 'service', icon: 'layers', position: { x: 2040, y: 140 }, width: 300 },
    { id: 'app', label: 'Running App', sublabel: 'cf push', kind: 'platform', icon: 'server', position: { x: 2040, y: 460 }, width: 300 },
    { id: 'reassess', label: 'Re-run Assessment', sublabel: 'back in Tanzu Hub', kind: 'observability', icon: 'gauge', position: { x: 2720, y: 460 }, width: 320 },
    { id: 'onboarded', label: 'Marked Onboarded', sublabel: 'challenge cleared', kind: 'security', icon: 'shield-check', position: { x: 3400, y: 460 }, width: 320 },
  ],
  edges: [
    { id: 'e-candidate-onboard', source: 'candidate', target: 'onboard', label: 'cf repo onboard-app', animated: true },
    { id: 'e-onboard-manifest', source: 'onboard', target: 'manifest', label: 'generates + fixes' },
    { id: 'e-manifest-build', source: 'manifest', target: 'build', label: 'mvn package', animated: true },
    { id: 'e-build-app', source: 'build', target: 'app', label: 'cf push', animated: true },
    { id: 'e-app-reassess', source: 'app', target: 'reassess', label: 'assess again', dashed: true },
    { id: 'e-reassess-onboarded', source: 'reassess', target: 'onboarded', label: 'challenge resolved', animated: true },
  ],
}

// Currency (SBOM -> Hub -> vulnerabilities/compliance) and the reporting
// surface (custom rules feed the same Hub data that GraphQL/custom reports
// and the Playground query).
export const currencyReportingFlow: DiagramDef = {
  id: 'currency-reporting-flow',
  nodes: [
    { id: 'sbom', label: 'Build Config (SBOM)', sublabel: 'from cf repo onboard-app', kind: 'data', icon: 'database', position: { x: 40, y: 140 }, width: 320 },
    { id: 'hub', label: 'Tanzu Hub · Repositories', sublabel: 'vulnerabilities · compliance', kind: 'observability', icon: 'gauge', position: { x: 680, y: 140 }, width: 340 },
    { id: 'rules', label: 'Custom Rules Engine', sublabel: 'regex-based, org-specific', kind: 'security', icon: 'shield-check', position: { x: 40, y: 460 }, width: 320 },
    { id: 'graphql', label: 'GraphQL API', sublabel: 'Altair interface', kind: 'gateway', icon: 'braces', position: { x: 680, y: 460 }, width: 300 },
    { id: 'reports', label: 'Custom Reports & Playground', sublabel: 'slice/dice by facet, debt, archetype', kind: 'service', icon: 'bar-chart', position: { x: 1360, y: 460 }, width: 340 },
  ],
  edges: [
    { id: 'e-sbom-hub', source: 'sbom', target: 'hub', label: 'publish-sbom', animated: true },
    { id: 'e-rules-hub', source: 'rules', target: 'hub', label: 'flags challenges', dashed: true },
    { id: 'e-hub-graphql', source: 'hub', target: 'graphql', label: 'queried via', dashed: true },
    { id: 'e-graphql-reports', source: 'graphql', target: 'reports', label: 'powers', animated: true },
  ],
}
