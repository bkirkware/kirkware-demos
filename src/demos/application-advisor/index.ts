import type { DemoDefinition } from '@/types/demo'
import { advisorUpgradeLoop, advisorCicdFlow } from './diagrams'
import { labPrepSteps } from './sections/labPrep'
import { introSteps } from './sections/intro'
import { howItWorksSteps } from './sections/howItWorks'
import { liveUpgradeSteps } from './sections/liveUpgrade'
import { adviceSteps } from './sections/advice'
import { integrationsSteps } from './sections/integrations'
import { wrapupSteps } from './sections/wrapup'

const demo: DemoDefinition = {
  meta: {
    id: 'application-advisor',
    title: 'Application Advisor',
    subtitle: 'Continuous Spring upgrades — SBOM, upgrade plans, recipes & best-practice advice',
    tags: ['Spring', 'Tanzu Platform', 'Upgrades'],
    accent: '#6db33f',
  },
  diagrams: [advisorUpgradeLoop, advisorCicdFlow],
  steps: [
    ...labPrepSteps,
    ...introSteps,
    ...howItWorksSteps,
    ...liveUpgradeSteps,
    ...adviceSteps,
    ...integrationsSteps,
    ...wrapupSteps,
  ],
}

export default demo
