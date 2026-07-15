import type { DemoDefinition } from '@/types/demo'
import { portfolioIntakeFlow, suitabilityModel, onboardingLifecycle, currencyReportingFlow } from './diagrams'
import { labPrepSteps } from './sections/labPrep'
import { introSteps } from './sections/intro'
import { discoverySteps } from './sections/discovery'
import { assessmentSteps } from './sections/assessment'
import { onboardingSteps } from './sections/onboarding'
import { reportingSteps } from './sections/reporting'
import { wrapupSteps } from './sections/wrapup'

const demo: DemoDefinition = {
  meta: {
    id: 'app-assessment',
    title: 'Application Assessment',
    subtitle: 'Portfolio discovery, suitability scoring, and onboarding — from a CSV of repos to a running app on Tanzu Platform',
    tags: ['Spring', 'Tanzu Platform', 'Modernization'],
    accent: '#38BDF8',
  },
  diagrams: [portfolioIntakeFlow, suitabilityModel, onboardingLifecycle, currencyReportingFlow],
  steps: [
    ...labPrepSteps,
    ...introSteps,
    ...discoverySteps,
    ...assessmentSteps,
    ...onboardingSteps,
    ...reportingSteps,
    ...wrapupSteps,
  ],
}

export default demo
