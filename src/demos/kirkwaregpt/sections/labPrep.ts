import type { DemoStep } from '@/types/demo'

const SECTION = 'Lab Preparation'

export const labPrepSteps: DemoStep[] = [
  {
    id: 'labprep-login-target',
    type: 'command',
    section: SECTION,
    title: 'Pre-checks: login & target',
    heading: 'One org, one space — kirkware / kirkware-gpt',
    description: 'Everything in this demo — the agent, the MCP gateway, and the GitHub MCP server — deploys into the same space. Every script below is independent and safe to re-run.',
    commands: [
      {
        label: 'login.sh',
        lang: 'bash',
        code: `cf login -a "$CF_API_URL" -u "$CF_USERNAME" -p "$CF_PASSWORD" -o "$CF_ORG" < /dev/null`,
        liveId: 'cf-login.sh',
      },
      {
        label: 'set-space-kirkwaregpt.sh',
        lang: 'bash',
        code: `export CF_SPACE=kirkware-gpt
echo $CF_SPACE`,
        liveId: 'set-cf-space-kirkwaregpt.sh',
      },
      {
        label: 'ensure-kirkwaregpt-space.sh',
        lang: 'bash',
        code: `cf space "$CF_SPACE" || cf create-space "$CF_SPACE" -o "$CF_ORG"`,
        liveId: 'cf-ensure-space.sh',
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
    id: 'labprep-marketplace-checks',
    type: 'command',
    section: SECTION,
    title: 'Pre-checks: marketplace offerings',
    heading: 'Confirm every offering this demo needs is actually on the marketplace',
    description: 'Three offerings, three purposes: `ai-models` for the model behind the agent, `mcp-gateway` for the MCP dashboard, and a Postgres offering for the RAG store. Plan names vary by foundation — note whatever `postgres`\'s actual plan is called here before the Agent section.',
    commands: [
      {
        label: 'marketplace-ai-models.sh',
        lang: 'bash',
        code: `cf marketplace -e ai-models`,
        liveId: 'marketplace.sh',
      },
      {
        label: 'marketplace-mcp-gateway.sh',
        lang: 'bash',
        code: `cf marketplace -e mcp-gateway`,
        liveId: 'marketplace-mcp-gateway.sh',
      },
      {
        label: 'marketplace-postgres.sh',
        lang: 'bash',
        code: `cf marketplace -e postgres`,
        liveId: 'marketplace-postgres.sh',
      },
    ],
  },
  {
    id: 'labprep-provision-postgres',
    type: 'command',
    section: SECTION,
    title: 'Pre-checks: provision Postgres',
    heading: 'Start the RAG database now — it can take a few minutes to provision',
    description: 'Provisioning ahead of time means the Agent section\'s Postgres bind is instant instead of a multi-minute wait mid-demo.',
    commands: [
      {
        label: 'ensure-postgres.sh',
        lang: 'bash',
        code: `cf service kirkwaregpt-db || cf create-service postgres "$POSTGRES_PLAN" kirkwaregpt-db --wait`,
        liveId: 'kirkwaregpt-ensure-postgres.sh',
      },
    ],
  },
  {
    id: 'labprep-clean-check',
    type: 'command',
    section: SECTION,
    title: 'Pre-checks: confirm a clean space',
    heading: 'Nothing left over from a previous run',
    description: 'A quick sanity check before building anything — this space should have no apps and no service instances yet.',
    commands: [
      {
        label: 'apps.sh',
        lang: 'bash',
        code: `cf apps`,
        liveId: 'cf-apps.sh',
      },
      {
        label: 'services.sh',
        lang: 'bash',
        code: `cf services`,
        liveId: 'cf-services.sh',
      },
    ],
    impact: 'If either command lists something, the Cleanup step below removes it — run that first, then come back here.',
  },
  {
    id: 'labprep-cleanup',
    type: 'command',
    section: SECTION,
    title: 'Cleanup',
    heading: 'Tear down the agent, the gateway, the MCP server, and every service',
    commands: [
      {
        label: 'set-space-kirkwaregpt.sh',
        lang: 'bash',
        code: `export CF_SPACE=kirkware-gpt
echo $CF_SPACE`,
        liveId: 'set-cf-space-kirkwaregpt.sh',
      },
      {
        label: 'target.sh',
        lang: 'bash',
        code: `cf target -o "$CF_ORG" -s "$CF_SPACE"`,
        liveId: 'cf-target.sh',
      },
      {
        label: 'delete-agent.sh',
        lang: 'bash',
        code: `cf delete kirkwaregpt -f`,
        liveId: 'kirkwaregpt-delete-agent.sh',
      },
      {
        label: 'delete-github-mcp.sh',
        lang: 'bash',
        code: `cf delete github-mcp -f`,
        liveId: 'kirkwaregpt-delete-github-mcp.sh',
      },
      {
        label: 'unbind-and-delete-model.sh',
        lang: 'bash',
        code: `cf delete-service kirkwaregpt-model -f --wait`,
        liveId: 'kirkwaregpt-delete-model.sh',
      },
      {
        label: 'unbind-and-delete-postgres.sh',
        lang: 'bash',
        code: `cf delete-service kirkwaregpt-db -f --wait`,
        liveId: 'kirkwaregpt-delete-postgres.sh',
      },
      {
        label: 'delete-mcp-gateway.sh',
        lang: 'bash',
        code: `cf delete-service kirkwaregpt-mcp-gateway -f --wait`,
        liveId: 'kirkwaregpt-delete-mcp-gateway.sh',
      },
      {
        label: 'delete-oauth-ups.sh',
        lang: 'bash',
        code: `cf delete-service github-mcp-oauth -f`,
        liveId: 'kirkwaregpt-delete-oauth-ups.sh',
      },
      {
        label: 'delete-mcp-server-ups.sh',
        lang: 'bash',
        code: `cf delete-service github-mcp -f`,
        liveId: 'kirkwaregpt-delete-mcp-server-ups.sh',
      },
      {
        label: 'clean-workspace.sh',
        lang: 'bash',
        code: `rm -rf "$TEMP_WORKSPACE/kirkwaregpt"`,
        liveId: 'kirkwaregpt-clean-workspace.sh',
      },
    ],
  },
]
