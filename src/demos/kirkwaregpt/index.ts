import type { DemoDefinition } from '@/types/demo'
import { kirkwaregptArchitecture, kirkwaregptAgentLifecycle, kirkwaregptMcpGatewayFlow, kirkwaregptPolicyFlow, kirkwaregptUiWrapperFlow } from './diagrams'
import { labPrepSteps } from './sections/labPrep'
import { introSteps } from './sections/intro'
import { agentSteps } from './sections/agent'
import { mcpGatewaySteps } from './sections/mcpGateway'
import { policiesSteps } from './sections/policies'
import { uiCustomizationWrapperSteps } from './sections/uiCustomizationWrapper'
import { wrapupSteps } from './sections/wrapup'

const demo: DemoDefinition = {
  meta: {
    id: 'kirkwaregpt',
    title: 'KirkwareGPT',
    subtitle: 'An internal AI agent — Agent Buildpack, MCP Gateway, RAG, and policy governance on Tanzu AI Services',
    tags: ['Agents', 'Tanzu Platform', 'MCP'],
    accent: '#14B8A6',
  },
  diagrams: [kirkwaregptArchitecture, kirkwaregptAgentLifecycle, kirkwaregptMcpGatewayFlow, kirkwaregptPolicyFlow, kirkwaregptUiWrapperFlow],
  steps: [
    ...labPrepSteps,
    ...introSteps,
    ...agentSteps,
    ...mcpGatewaySteps,
    ...policiesSteps,
    ...uiCustomizationWrapperSteps,
    ...wrapupSteps,
  ],
}

export default demo
