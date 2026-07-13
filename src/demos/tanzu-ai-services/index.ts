import type { DemoDefinition } from '@/types/demo'
import { systemArchitecture, gatewayWireFormat, mcpGatewaySecurity } from './diagrams'
import { introSteps } from './sections/intro'
import { architectureSteps } from './sections/architecture'
import { gettingStartedSteps } from './sections/gettingStarted'
import { gatewaySteps } from './sections/gateway'
import { agentSteps } from './sections/agent'
import { securitySteps } from './sections/security'
import { observabilitySteps } from './sections/observability'
import { ragAndWrapupSteps } from './sections/ragAndWrapup'

const demo: DemoDefinition = {
  meta: {
    id: 'tanzu-ai-services',
    title: 'Tanzu AI Services',
    subtitle: 'Architecture, gateway routing, model lifecycle & security deep dive',
    tags: ['AI', 'Tanzu Platform', 'Architecture'],
    accent: '#22d3ee',
  },
  diagrams: [systemArchitecture, gatewayWireFormat, mcpGatewaySecurity],
  steps: [
    ...introSteps,
    ...architectureSteps,
    ...gettingStartedSteps,
    ...gatewaySteps,
    ...agentSteps,
    ...securitySteps,
    ...observabilitySteps,
    ...ragAndWrapupSteps,
  ],
}

export default demo
