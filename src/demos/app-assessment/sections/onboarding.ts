import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub'
const OVERVIEW = `${DOCS}/app-port-onboard-overview.html`
const ADVISOR_DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor'
const SECTION = 'Onboard & Deploy'

export const onboardingSteps: DemoStep[] = [
  {
    id: 'onboarding-intro',
    type: 'content',
    section: SECTION,
    title: 'From "assessed" to "running"',
    heading: 'The gap this closes: candidate → cf push',
    body: 'Assessment tells you *what\'s* wrong. Onboarding is the tool that actually prepares a repo to run on Tanzu Platform — detecting a challenge, offering an automatic fix, generating the buildpack manifest, and handing you back a repo that\'s one `mvn package` and `cf push` away from live.',
    callout: {
      label: 'A good candidate for this walkthrough',
      tone: 'success',
      body: '`tp-demo` — small, Spring Boot, suitable, and it carries exactly one challenge (Logging to Files) with a recipe available. Mark repos like this as `candidate` in Hub before running any of the commands below.',
    },
    sourceUrl: OVERVIEW,
  },
  {
    id: 'onboarding-clone',
    type: 'command',
    section: SECTION,
    title: 'Get the app',
    heading: 'Check out the demo branch',
    commands: [
      {
        label: 'clone.sh',
        lang: 'bash',
        code: `cd "$TEMP_WORKSPACE"
gh repo clone bkirkware/tp-demo
cd tp-demo
git checkout demo`,
      },
    ],
    sourceUrl: 'https://github.com/bkirkware/tp-demo',
  },
  {
    id: 'onboarding-mark-candidate',
    type: 'content',
    section: SECTION,
    title: 'Mark it as a candidate in Hub',
    heading: 'One click, before touching the CLI',
    body: 'In `tp-demo`\'s repository detail view, check for the challenge (Logging to Files), confirm a recipe is available, then flag it as a **Candidate** — this is what tells the platform, and your team, that onboarding is intentional and in progress.',
    bullets: [
      {
        title: 'Tanzu Hub — Repositories',
        titleUrl: '$HUB_URL',
        icon: 'gauge',
        description: 'Find tp-demo, open its detail view, and mark it as Candidate.',
      },
    ],
  },
  {
    id: 'onboarding-onboard-app',
    type: 'command',
    section: SECTION,
    title: 'Onboard the app',
    heading: '`cf repo onboard-app` detects, offers, and fixes',
    description: 'The command inspects the repo, builds a dependency SBOM to pick the right buildpack, and — if it recognizes a fixable challenge — offers to apply the recipe on the spot.',
    commands: [
      {
        label: 'onboard-app.sh',
        lang: 'bash',
        code: `cf repo onboard-app`,
      },
    ],
    impact: 'Expect a prompt: "1 challenge detected: we have an automatic fix for it." Choose yes. Accept every other default — except the jar file path, which needs to match your actual Maven output, e.g. `../target/tp-demo-0.0.1-SNAPSHOT.jar`.',
    sourceUrl: OVERVIEW,
  },
  {
    id: 'onboarding-diagram-1',
    type: 'diagram',
    section: SECTION,
    title: 'What onboard-app just did',
    heading: 'Step 1 — detection and an offered fix',
    diagramId: 'onboarding-lifecycle',
    narrative: '`onboard-app` reads the repo, recognizes the Logging to Files challenge, and — because a recipe exists for it — offers to apply the fix immediately rather than just reporting it.',
    visibleNodeIds: ['candidate', 'onboard', 'manifest'],
    visibleEdgeIds: ['e-candidate-onboard', 'e-onboard-manifest'],
    activeNodeIds: ['onboard', 'manifest'],
    sourceUrl: OVERVIEW,
  },
  {
    id: 'onboarding-review-build',
    type: 'command',
    section: SECTION,
    title: 'Review the changes, then build',
    heading: 'Everything onboard-app touched is a plain diff',
    commands: [
      {
        label: 'status.sh',
        lang: 'bash',
        code: `git status`,
      },
      {
        label: 'diff.sh',
        lang: 'bash',
        code: `git diff`,
      },
      {
        label: 'build.sh',
        lang: 'bash',
        code: `mvn clean package`,
      },
    ],
    impact: 'Look for the generated `.tanzu/manifest.yml` and the recipe\'s fix to the logging configuration — nothing else in the working tree should have changed.',
  },
  {
    id: 'onboarding-push',
    type: 'command',
    section: SECTION,
    title: 'Push, then commit',
    heading: 'A running app, and a paper trail',
    commands: [
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cf push -f .tanzu/manifest.yml`,
      },
      {
        label: 'commit.sh',
        lang: 'bash',
        code: `git add .
git commit -m "onboarded"`,
      },
    ],
  },
  {
    id: 'onboarding-diagram-2',
    type: 'diagram',
    section: SECTION,
    title: 'Build, push, running',
    heading: 'Step 2 — mvn package, then cf push',
    diagramId: 'onboarding-lifecycle',
    narrative: 'From the generated manifest to a running app is exactly two commands — the same shape as onboarding any other Java app, because that\'s exactly what this is now.',
    visibleNodeIds: ['candidate', 'onboard', 'manifest', 'build', 'app'],
    visibleEdgeIds: ['e-candidate-onboard', 'e-onboard-manifest', 'e-manifest-build', 'e-build-app'],
    activeNodeIds: ['app'],
  },
  {
    id: 'onboarding-reassess',
    type: 'content',
    section: SECTION,
    title: 'Re-assess, and mark it onboarded',
    heading: 'Prove the challenge is actually gone',
    body: 'Trigger a fresh assessment on `tp-demo` and confirm the Logging to Files challenge no longer appears — the recipe\'s fix is committed, not just applied locally. Once confirmed, mark the repo as **Onboarded** in Hub.',
    bullets: [
      {
        title: 'Tanzu Hub — Repositories',
        titleUrl: '$HUB_URL',
        icon: 'gauge',
        description: 'Select tp-demo, run Assess, confirm the challenge cleared, then mark it Onboarded.',
      },
    ],
  },
  {
    id: 'onboarding-diagram-3',
    type: 'diagram',
    section: SECTION,
    title: 'Full loop, closed',
    heading: 'Step 3 — re-assessment proves the fix landed',
    diagramId: 'onboarding-lifecycle',
    narrative: 'The loop closes back in Hub, not on the command line — re-running the same assessment that originally found the challenge is what confirms it\'s actually resolved, not just locally patched.',
    visibleNodeIds: ['candidate', 'onboard', 'manifest', 'build', 'app', 'reassess', 'onboarded'],
    visibleEdgeIds: ['e-candidate-onboard', 'e-onboard-manifest', 'e-manifest-build', 'e-build-app', 'e-app-reassess', 'e-reassess-onboarded'],
    activeNodeIds: ['reassess', 'onboarded'],
    sourceUrl: OVERVIEW,
  },
  {
    id: 'onboarding-publish-sbom',
    type: 'command',
    section: SECTION,
    title: 'Publish the SBOM for currency tracking',
    heading: 'The build config becomes Hub\'s vulnerability & compliance data',
    description: 'The SBOM `onboard-app` generated to pick the right buildpack is the same one that feeds Hub\'s compliance view. Publishing it needs a handful of environment variables Hub provides from the repository\'s own detail page.',
    commands: [
      {
        label: 'publish-sbom.sh',
        lang: 'bash',
        code: `cf repo publish-sbom`,
      },
    ],
    impact: 'Grab the required environment variables from the repository\'s detail page in Hub before running this — they\'re repo-specific and one-time-setup per repo, not global.',
  },
  {
    id: 'onboarding-diagram-4',
    type: 'diagram',
    section: SECTION,
    title: 'The SBOM feeds Hub directly',
    heading: 'Currency tracking starts the moment you publish',
    diagramId: 'currency-reporting-flow',
    narrative: 'The same build config generated during onboarding, once published, is what populates Hub\'s vulnerability and compliance view for this repo.',
    visibleNodeIds: ['sbom', 'hub'],
    visibleEdgeIds: ['e-sbom-hub'],
    activeNodeIds: ['hub'],
  },
  {
    id: 'onboarding-hub-check',
    type: 'content',
    section: SECTION,
    title: 'Check compliance and CVEs',
    heading: 'Now visible in the Repositories view',
    body: 'The published SBOM surfaces two things that weren\'t visible before onboarding: out-of-compliance libraries, and known CVEs against your actual dependency versions.',
    bullets: [
      {
        title: 'Tanzu Hub — Repositories',
        titleUrl: '$HUB_URL',
        icon: 'shield',
        description: 'Find tp-demo, check the Latest Analysis column, then drill into components and libraries for anything flagged.',
      },
    ],
  },
  {
    id: 'onboarding-whats-next',
    type: 'content',
    section: SECTION,
    title: 'What\'s next: continuous upgrades',
    heading: 'This is where Application Advisor picks up',
    body: 'The same `cf repo` plug-in that onboarded this app also upgrades it continuously — `upgrade-plan`, `apply-upgrade-plan`, `advice`, `apply-advice`. This demo stops at "onboarded and currency-tracked" on purpose — the full upgrade rhythm (SBOM → plan → apply → test → commit) is its own dedicated demo.',
    callout: {
      label: 'A quick preview, if you want it',
      tone: 'info',
      body: '`cf repo upgrade-plan` followed by `cf repo apply-upgrade-plan` will pick up right where onboarding left off. See the Application Advisor demo for the full walkthrough, including the javax → jakarta migration and best-practice advice like `spring-governance-starter`.',
    },
    sourceUrl: `${ADVISOR_DOCS}/upgrade-spring-app.html`,
  },
]
