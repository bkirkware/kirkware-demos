import type { DemoDefinition } from '@/types/demo'
import { agentDropletBuild, agentCredentialFlow, agentModelSwap } from './diagrams'
import { labPrepSteps } from './sections/labPrep'
import { introSteps } from './sections/intro'
import { howItWorksSteps } from './sections/howItWorks'
import { deployAgentSteps } from './sections/deployAgent'
import { deployTargetSteps } from './sections/deployTarget'
import { swapModelSteps } from './sections/swapModel'
import { wrapupSteps } from './sections/wrapup'

const demo: DemoDefinition = {
  meta: {
    id: 'cf-coding-agents',
    title: 'CF Coding Agents',
    subtitle: 'Claude Code as a cf task — and swapping the model for on-platform Qwen with zero code changes',
    tags: ['Agents', 'Tanzu Platform', 'Cloud Foundry'],
    accent: '#D97757',
  },
  diagrams: [agentDropletBuild, agentCredentialFlow, agentModelSwap],
  steps: [
    ...labPrepSteps,
    ...introSteps,
    ...howItWorksSteps,
    ...deployAgentSteps,
    ...deployTargetSteps,
    ...swapModelSteps,
    ...wrapupSteps,
  ],
}

export default demo
