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
  {
    id: 'cf-coding-agents',
    title: 'CF Coding Agents',
    subtitle: 'Claude Code as a cf task — and swapping the model for on-platform Qwen with zero code changes',
    tags: ['Agents', 'Tanzu Platform', 'Cloud Foundry'],
    load: () => import('./cf-coding-agents'),
  },
  {
    id: 'kirkwaregpt',
    title: 'KirkwareGPT',
    subtitle: 'An internal AI agent — Agent Buildpack, MCP Gateway, RAG, and policy governance on Tanzu AI Services',
    tags: ['Agents', 'Tanzu Platform', 'MCP'],
    load: () => import('./kirkwaregpt'),
  },
  {
    id: 'app-assessment',
    title: 'Application Assessment',
    subtitle: 'Portfolio discovery, suitability scoring, and onboarding — from a CSV of repos to a running app on Tanzu Platform',
    tags: ['Spring', 'Tanzu Platform', 'Modernization'],
    load: () => import('./app-assessment'),
  },
]
