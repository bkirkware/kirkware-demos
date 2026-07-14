import type { DemoStep } from '@/types/demo'

const DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/spring/application-advisor/1-6/app-advisor'
const SECTION = 'Integrations'

export const integrationsSteps: DemoStep[] = [
  {
    id: 'int-cicd',
    type: 'content',
    section: SECTION,
    title: 'Continuous, unattended upgrades',
    heading: 'From a manual loop to a pipeline step',
    body: 'The same commands from the live walkthrough collapse into a CI/CD step once a repo is trusted to upgrade itself. GitLab Enterprise, GitHub Enterprise, Jenkins, Bitbucket, and generic SaaS CI are all supported.',
    bullets: [
      { title: 'GIT_TOKEN_FOR_PRS', icon: 'key', description: 'An access token with repo write permission — the CLI uses it to create branches and open pull requests on your behalf.' },
      { title: '.spring-app-advisor.yml', icon: 'file-text', description: 'Drop this in the repo root with `enabled: true` to opt it into continuous upgrades.' },
      { title: 'ADVISOR_SCM_HOST', icon: 'server', description: 'Set alongside the token for self-hosted GitHub Enterprise / GitLab instances.' },
    ],
    sourceUrl: `${DOCS}/integrations.html`,
  },
  {
    id: 'int-cicd-cmd',
    type: 'command',
    section: SECTION,
    title: 'The pipeline version of today\'s walkthrough',
    heading: 'Three commands replace the whole manual loop',
    description: 'Everything demonstrated live above — build config, upgrade plan, apply, review, test, commit — becomes this, running unattended on every pipeline trigger.',
    commands: [
      {
        label: 'pipeline-upgrade.sh',
        lang: 'bash',
        code: `cf repo build-sbom
cf repo publish-sbom
cf repo apply-upgrade-plan --push --from-yml`,
      },
    ],
    impact: '`--push --from-yml` reads `.spring-app-advisor.yml`, applies the next eligible step, and opens the pull request itself — no human runs `git diff` until review time.',
    sourceUrl: `${DOCS}/upgrade-spring-app.html`,
  },
  {
    id: 'int-cicd-diagram',
    type: 'diagram',
    section: SECTION,
    title: 'The pipeline, end to end',
    heading: 'A push in, a reviewed PR out',
    diagramId: 'advisor-cicd-flow',
    narrative: 'Every upgrade opportunity opens a new pull request instead of editing `main` directly — a human still reviews and merges. The CLI runs entirely inside the CI job: no source code is ever transferred anywhere, it only resolves OpenRewrite recipes from your artifact manager.',
    visibleNodeIds: ['main-branch', 'ci-job', 'advisor-cli', 'artifact-mgr', 'pr-node', 'review'],
    visibleEdgeIds: ['e-main-ci', 'e-ci-cli', 'e-cli-artifact', 'e-cli-pr', 'e-pr-review', 'e-review-main'],
    activeNodeIds: ['advisor-cli'],
    sourceUrl: `${DOCS}/app-advisor-architecture.html`,
  },
  {
    id: 'int-hub-ide',
    type: 'content',
    section: SECTION,
    title: 'Tanzu Hub & the IDE',
    heading: 'Two more ways in: a fleet-wide dashboard, and inline in the editor',
    bullets: [
      {
        title: 'Tanzu Hub',
        titleUrl: '$HUB_URL',
        icon: 'gauge',
        description: '`publish-sbom` sends the build config to Tanzu Hub, surfacing support status and known vulnerabilities across every onboarded repo in one place.',
      },
      { title: 'IDE via MCP', icon: 'bot', description: 'Model Context Protocol integration lets a developer run upgrade plans and apply best-practice advice from inside their editor, no terminal context-switch required.' },
    ],
    sourceUrl: `${DOCS}/integrations.html`,
  },
]
