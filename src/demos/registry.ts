import type { DemoDefinition } from '@/types/demo'

export interface DemoRegistryEntry {
  id: string
  title: string
  subtitle?: string
  tags?: string[]
  load: () => Promise<{ default: DemoDefinition }>
}

export const demoRegistry: DemoRegistryEntry[] = [
  {
    id: 'tanzu-ai-services',
    title: 'Tanzu AI Services',
    subtitle: 'Architecture, gateway routing, model lifecycle & security deep dive',
    tags: ['AI', 'Tanzu Platform', 'Architecture'],
    load: () => import('./tanzu-ai-services'),
  },
  {
    id: 'application-advisor',
    title: 'Application Advisor',
    subtitle: 'Continuous Spring upgrades — SBOM, upgrade plans, recipes & best-practice advice',
    tags: ['Spring', 'Tanzu Platform', 'Upgrades'],
    load: () => import('./application-advisor'),
  },
]
