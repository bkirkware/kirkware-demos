import type { DemoStep } from '@/types/demo'

const SECTION = 'Lab Preparation'

export const labPrepSteps: DemoStep[] = [
  {
    id: 'labprep-spaces',
    type: 'command',
    section: SECTION,
    title: 'Pre-checks: spaces & login',
    heading: 'Two spaces, one org — coding-agents and petclinic',
    description: 'The agent task app and its target app live in separate spaces so a runaway agent can never touch the space its own target app is deployed into. Every script below is independent and safe to re-run.',
    commands: [
      {
        label: 'login.sh',
        lang: 'bash',
        code: `cf login -a "$CF_API_URL" -u "$CF_USERNAME" -p "$CF_PASSWORD" -o "$CF_ORG" < /dev/null`,
        liveId: 'cf-login.sh',
      },
      {
        label: 'set-space-coding-agents.sh',
        lang: 'bash',
        code: `export CF_SPACE=coding-agents
echo $CF_SPACE`,
        liveId: 'set-cf-space-coding-agents.sh',
      },
      {
        label: 'ensure-coding-agents-space.sh',
        lang: 'bash',
        code: `cf space "$CF_SPACE" || cf create-space "$CF_SPACE" -o "$CF_ORG"`,
        liveId: 'cf-ensure-space.sh',
      },
      {
        label: 'set-space-petclinic.sh',
        lang: 'bash',
        code: `export CF_SPACE=petclinic
echo $CF_SPACE`,
        liveId: 'set-cf-space-petclinic.sh',
      },
      {
        label: 'ensure-petclinic-space.sh',
        lang: 'bash',
        code: `cf space "$CF_SPACE" || cf create-space "$CF_SPACE" -o "$CF_ORG"`,
        liveId: 'cf-ensure-space.sh',
      },
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
    impact: 'Everything from here through "Deploy the Agent" runs targeted at coding-agents. We switch to petclinic only once, right before pushing the target app.',
  },
  {
    id: 'labprep-qwen-service',
    type: 'command',
    section: SECTION,
    title: 'Pre-checks: Qwen model service',
    heading: 'Provision the on-platform model the agent will swap onto',
    description: 'This is the AI Services side of the demo, done once up front: confirm the Anthropic-wireformat Qwen plan is on the marketplace, provision an instance, and pull a service key — before the agent ever runs.',
    commands: [
      {
        label: 'marketplace.sh',
        lang: 'bash',
        code: `cf marketplace -e ai-models`,
        liveId: 'marketplace.sh',
      },
      {
        label: 'ensure-qwen-service.sh',
        lang: 'bash',
        code: `cf service anthropic-qwen-model || cf create-service ai-models anthropic-qwen3.6 anthropic-qwen-model --wait`,
        liveId: 'cf-ensure-qwen-service.sh',
      },
      {
        label: 'ensure-qwen-service-key.sh',
        lang: 'bash',
        code: `cf service-key anthropic-qwen-model anthropic-qwen-model-key >/dev/null 2>&1 || cf create-service-key anthropic-qwen-model anthropic-qwen-model-key`,
        liveId: 'cf-ensure-qwen-service-key.sh',
      },
      {
        label: 'show-qwen-service-key.sh',
        lang: 'bash',
        code: `cf service-key anthropic-qwen-model anthropic-qwen-model-key`,
        liveId: 'cf-show-qwen-service-key.sh',
      },
    ],
    impact: '`anthropic-qwen3.6` is a plan on the same `ai-models` marketplace offering as every other Tanzu AI Services plan — the service key it hands back is shaped like an Anthropic Messages API endpoint, not an OpenAI one. That shape is exactly what the agent swap in this demo depends on.',
  },
  {
    id: 'labprep-cleanup',
    type: 'command',
    section: SECTION,
    title: 'Cleanup',
    heading: 'Tear down both apps and every service',
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
      {
        label: 'delete-agent-app.sh',
        lang: 'bash',
        code: `cf delete agent-cli -f`,
      },
      {
        label: 'delete-anthropic-creds.sh',
        lang: 'bash',
        code: `cf delete-service anthropic-creds -f`,
      },
      {
        label: 'delete-github-creds.sh',
        lang: 'bash',
        code: `cf delete-service github-creds -f`,
      },
      {
        label: 'delete-qwen-service-key.sh',
        lang: 'bash',
        code: `cf delete-service-key anthropic-qwen-model anthropic-qwen-model-key -f --wait`,
      },
      {
        label: 'delete-qwen-service.sh',
        lang: 'bash',
        code: `cf delete-service anthropic-qwen-model -f --wait`,
      },
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
        label: 'delete-petclinic-app.sh',
        lang: 'bash',
        code: `cf delete spring-petclinic -r -f`,
      },
    ],
  },
]
