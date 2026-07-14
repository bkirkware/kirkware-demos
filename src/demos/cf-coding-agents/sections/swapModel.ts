import type { DemoStep } from '@/types/demo'

const REPO_DOCS = 'https://github.com/asaikali/cf-coding-agents/blob/main'
const AI_DOCS = 'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/ai-services/10-4/ai'
const SECTION = 'Swap the Model'

export const swapModelSteps: DemoStep[] = [
  {
    id: 'swap-intro',
    type: 'content',
    section: SECTION,
    title: 'Two ways to run the exact same skill',
    heading: 'Same repo, same issue, same skill file — only the model changes',
    body: 'Both options below invoke the identical `github-issue-workflow` skill against the identical issue on the identical fork. The only difference is which environment variables `cf run-task` sets before `./bin/claude` starts.',
    callout: {
      label: 'Ignoring one path on purpose',
      tone: 'info',
      body: 'The source script this is based on also supports a `--direct` mode that bypasses the platform entirely and hits a raw model endpoint. This demo skips it — the point here is what the AI Services tile buys you, not what happens without it.',
    },
  },
  {
    id: 'swap-target-space',
    type: 'command',
    section: SECTION,
    title: 'Back to coding-agents',
    heading: 'The agent task app lives in its own space',
    commands: [
      {
        label: 'set-space-coding-agents.sh',
        lang: 'bash',
        code: `export CF_SPACE=coding-agents
echo $CF_SPACE`,
        liveId: 'set-cf-space-coding-agents.sh',
      },
      {
        label: 'target.sh',
        lang: 'bash',
        code: `cf target -o "$CF_ORG" -s "$CF_SPACE"`,
        liveId: 'cf-target.sh',
      },
    ],
  },
  {
    id: 'swap-option-1-claude',
    type: 'command',
    section: SECTION,
    title: 'Option 1 — run with Claude',
    heading: 'The unmodified path: real Anthropic models',
    description: 'No environment overrides at all — the credentials `.profile.d/vcap.sh` already exported from `anthropic-creds` are exactly what the CLI needs.',
    commands: [
      {
        label: 'set-vars.sh',
        lang: 'bash',
        code: `REPO=bkirkware/spring-petclinic
ISSUE="1"`,
      },
      {
        label: 'run-agent-claude.sh',
        lang: 'bash',
        code: `cf run-task agent-cli \\
  --name "issue-\${ISSUE}" \\
  --process task \\
  --command "./bin/claude -p 'Use the github-issue-workflow skill to work on issue \${ISSUE} in repo \${REPO}.' --dangerously-skip-permissions"`,
      },
      {
        label: 'view-logs.sh',
        lang: 'bash',
        code: `cf logs agent-cli --recent | grep issue-\${ISSUE}`,
      },
    ],
    sourceUrl: `${REPO_DOCS}/01-claude-cli/run.sh`,
  },
  {
    id: 'swap-option-2-qwen',
    type: 'command',
    section: SECTION,
    title: 'Option 2 — run with Qwen',
    heading: 'The swap: pull a service key, override three env vars',
    description: 'Everything else about the command is identical to Option 1. `MODEL_BASE_URL` and `MODEL_API_KEY` come straight from the AI Services service key created in Lab Preparation — this is the whole trick.',
    commands: [
      {
        label: 'get-model-endpoint.sh',
        lang: 'bash',
        code: `MODEL_BASE_URL=$(cf service-key anthropic-qwen-model anthropic-qwen-model-key | tail -n +3 | jq -r '.credentials.endpoint.anthropic_api_base')`,
      },
      {
        label: 'get-model-key.sh',
        lang: 'bash',
        code: `MODEL_API_KEY=$(cf service-key anthropic-qwen-model anthropic-qwen-model-key | tail -n +3 | jq -r '.credentials.endpoint.api_key')`,
      },
      {
        label: 'set-model.sh',
        lang: 'bash',
        code: `MODEL=qwen3.6-27b`,
      },
      {
        label: 'run-agent-qwen.sh',
        lang: 'bash',
        code: `cf run-task agent-cli \\
  --name "issue-\${ISSUE}" \\
  --process task \\
  --command "API_FORCE_IDLE_TIMEOUT=0 API_TIMEOUT_MS=3600000 ANTHROPIC_BASE_URL='\${MODEL_BASE_URL}' ANTHROPIC_MODEL='\${MODEL}' ANTHROPIC_API_KEY='\${MODEL_API_KEY}' CLAUDE_CODE_ATTRIBUTION_HEADER='0' CLAUDE_CODE_ENABLE_TELEMETRY='0' ./bin/claude -p 'Use the github-issue-workflow skill to work on issue \${ISSUE} in repo \${REPO}.' --dangerously-skip-permissions --bare --exclude-dynamic-system-prompt-sections"`,
      },
      {
        label: 'view-logs.sh',
        lang: 'bash',
        code: `cf logs agent-cli --recent | grep issue-\${ISSUE}`,
      },
    ],
    impact: 'Same fork, same issue, same skill, same `--dangerously-skip-permissions` flag — the diff between this command and Option 1\'s is three environment variables and two CLI flags (`--bare --exclude-dynamic-system-prompt-sections`, which trim Claude-specific system-prompt sections that don\'t apply to a different model). Everything upstream of the model call — cloning, reading the issue, implementing, testing, opening the PR — is identical.',
    sourceUrl: `${AI_DOCS}/how-to-guides-create-a-plan-using-the-anthropic-api.html`,
  },
  {
    id: 'swap-question',
    type: 'question',
    section: SECTION,
    title: 'What would you swap next?',
    prompt: 'Any tool that reads ANTHROPIC_BASE_URL — not just Claude Code — gets this same swap for free the moment it\'s pointed at an Anthropic-wireformat AI Services plan. Where else in your stack could that apply?',
    hints: [
      'Anthropic SDK-based internal tools (support bots, review assistants) swap the same way — just a base URL, no code change',
      'Cost and data-residency conversations get a lot easier once "which model" is a runtime env var instead of a vendor lock-in',
      'The reverse is also true: a Qwen-first workflow can fail over to real Anthropic the same way, by swapping the same three variables back',
    ],
  },
  {
    id: 'swap-land-pr',
    type: 'command',
    section: SECTION,
    title: 'Land the agent\'s PR',
    heading: 'Deploy exactly what the agent shipped',
    description: 'Whichever option produced the PR, the target app deploy is the same: switch to the agent\'s branch, rebuild, push.',
    commands: [
      {
        label: 'set-space-petclinic.sh',
        lang: 'bash',
        code: `export CF_SPACE=petclinic
echo $CF_SPACE`,
        liveId: 'set-cf-space-petclinic.sh',
      },
      {
        label: 'target.sh',
        lang: 'bash',
        code: `cf target -o "$CF_ORG" -s "$CF_SPACE"`,
        liveId: 'cf-target.sh',
      },
      {
        label: 'switch-branch.sh',
        lang: 'bash',
        code: `cd ~/work/git/kirkware/kirkware-lab/dev/spring-petclinic
git switch agent/issue-\${ISSUE}`,
      },
      {
        label: 'package.sh',
        lang: 'bash',
        code: `mvn clean package`,
      },
      {
        label: 'push.sh',
        lang: 'bash',
        code: `cf push`,
      },
    ],
  },
]
