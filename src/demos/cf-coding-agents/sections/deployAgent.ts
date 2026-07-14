import type { DemoStep } from '@/types/demo'

const REPO = 'https://github.com/asaikali/cf-coding-agents/blob/main'
const SECTION = 'Deploy the Agent'

export const deployAgentSteps: DemoStep[] = [
  {
    id: 'deploy-agent-intro',
    type: 'content',
    section: SECTION,
    title: 'From clone to staged droplet',
    heading: 'Every command below runs from 01-claude-cli/',
    body: 'This is the first of the three moving parts from the source repo\'s README: download the exact binary, layer on the tools via `apt.yml`, then push as a task-only app. Nothing here is agent-specific yet — it\'s the same droplet whichever model answers later.',
    sourceUrl: `${REPO}/01-claude-cli/README.md`,
  },
  {
    id: 'deploy-agent-download',
    type: 'command',
    section: SECTION,
    title: 'Download the binary',
    heading: 'Ship an exact, known Claude Code version',
    description: '`download.sh` resolves the latest Linux x64 build and writes it to `./agent/bin/claude` — the exact binary that ends up in the droplet, not whatever happens to be on the presenter\'s laptop.',
    commands: [
      {
        label: 'download.sh',
        lang: 'bash',
        code: `./download.sh`,
      },
    ],
    sourceUrl: `${REPO}/01-claude-cli/download.sh`,
  },
  {
    id: 'deploy-agent-creds',
    type: 'command',
    section: SECTION,
    title: 'Create the credential services',
    heading: 'Two UPS, bound in the manifest — never on a push command line',
    commands: [
      {
        label: 'get-github-token.sh',
        lang: 'bash',
        code: `export GITHUB_TOKEN=$(gh auth token)`,
      },
      {
        label: 'create-anthropic-creds.sh',
        lang: 'bash',
        code: `cf create-user-provided-service anthropic-creds -p "{\\"api_key\\":\\"$ANTHROPIC_API_KEY\\"}"`,
      },
      {
        label: 'create-github-creds.sh',
        lang: 'bash',
        code: `cf create-user-provided-service github-creds -p "{\\"token\\":\\"$GITHUB_TOKEN\\"}"`,
      },
    ],
    sourceUrl: `${REPO}/01-claude-cli/create-services.sh`,
  },
  {
    id: 'deploy-agent-push',
    type: 'command',
    section: SECTION,
    title: 'Push as a task-only app',
    heading: 'Stage the droplet, leave it stopped',
    description: 'The manifest chains `apt-buildpack` ahead of `binary_buildpack`, declares zero `web` instances, and binds both services. `--task` stages without starting anything.',
    commands: [
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cf push agent-cli --task`,
      },
    ],
    sourceUrl: `${REPO}/01-claude-cli/manifest.yaml`,
  },
  {
    id: 'deploy-agent-verify',
    type: 'command',
    section: SECTION,
    title: 'Verify the toolchain',
    heading: 'Prove every installed tool actually works before trusting the agent to it',
    description: '`versions.sh` prints every tool\'s version — including a real `git clone` over HTTPS to prove the credential-helper wiring from `.profile.d/vcap.sh` actually works — and reports gaps as "NOT FOUND" rather than halting, so one missing tool doesn\'t hide the rest.',
    commands: [
      {
        label: 'run-versions.sh',
        lang: 'bash',
        code: `cf run-task agent-cli --name versions --command './versions.sh'`,
      },
      {
        label: 'check-tasks.sh',
        lang: 'bash',
        code: `cf tasks agent-cli`,
      },
      {
        label: 'view-logs.sh',
        lang: 'bash',
        code: `cf logs agent-cli --recent`,
      },
    ],
    impact: 'This is the moment that catches a bad Adoptium key, a missing `.profile.d/java.sh` truststore fix, or a `gh` credential helper that never got wired — before an actual agent run wastes time discovering it mid-issue.',
    sourceUrl: `${REPO}/01-claude-cli/agent/versions.sh`,
  },
]
