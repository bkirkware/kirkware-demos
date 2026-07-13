import type { DemoDefinition } from '@/types/demo'
import { systemArchitecture, gatewayWireFormat, mcpGatewaySecurity } from './diagrams'
import { introSteps } from './sections/intro'
import { architectureSteps } from './sections/architecture'
import { gettingStartedSteps } from './sections/gettingStarted'
import { gatewaySteps } from './sections/gateway'
import { policiesSteps } from './sections/policies'
import { agentSteps } from './sections/agent'
import { securitySteps } from './sections/security'
import { observabilitySteps } from './sections/observability'
import { wrapupSteps } from './sections/wrapup'

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
    ...policiesSteps,
    ...agentSteps,
    ...securitySteps,
    ...observabilitySteps,
    ...wrapupSteps,
  ],
}

export default demo
