export type StepType = 'title' | 'content' | 'discussion' | 'question' | 'command' | 'diagram'

export interface DemoMeta {
  id: string
  title: string
  subtitle?: string
  tags?: string[]
  /** Tailwind-compatible hex used for this demo's accent (gradients, highlights) */
  accent?: string
}

interface DemoStepBase {
  id: string
  type: StepType
  /** Sidebar section/grouping header this step belongs to */
  section: string
  /** Short label shown in the sidebar step list */
  title: string
}

export interface TitleStep extends DemoStepBase {
  type: 'title'
  eyebrow?: string
  heading: string
  subheading?: string
  bullets?: string[]
}

export interface ContentBullet {
  title: string
  description?: string
  icon?: string
}

export interface Callout {
  label: string
  body: string
  tone?: 'info' | 'success' | 'warning'
}

export interface ContentStep extends DemoStepBase {
  type: 'content'
  heading: string
  body?: string
  bullets?: ContentBullet[]
  callout?: Callout
  sourceUrl?: string
}

export interface DiscussionStep extends DemoStepBase {
  type: 'discussion'
  prompt: string
  talkingPoints?: string[]
}

export interface QuestionStep extends DemoStepBase {
  type: 'question'
  prompt: string
  hints?: string[]
}

export interface CommandBlock {
  label?: string
  lang: string
  code: string
  /** Simulated terminal/API output shown once the command "runs" */
  output?: string
}

export interface CommandStep extends DemoStepBase {
  type: 'command'
  heading: string
  description?: string
  commands: CommandBlock[]
  impact?: string
  sourceUrl?: string
}

export type DiagramNodeKind =
  | 'client'
  | 'gateway'
  | 'service'
  | 'model'
  | 'data'
  | 'security'
  | 'observability'
  | 'external'
  | 'platform'

export interface DiagramNodeDef {
  id: string
  label: string
  sublabel?: string
  icon?: string
  kind: DiagramNodeKind
  position: { x: number; y: number }
  width?: number
  /** Optional visual grouping frame (e.g. "Tanzu Platform", "Your Namespace") */
  group?: string
}

export interface DiagramEdgeDef {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
  dashed?: boolean
}

export interface DiagramGroupDef {
  id: string
  label: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export interface DiagramDef {
  id: string
  nodes: DiagramNodeDef[]
  edges: DiagramEdgeDef[]
  groups?: DiagramGroupDef[]
}

export interface DiagramStep extends DemoStepBase {
  type: 'diagram'
  heading: string
  narrative?: string
  diagramId: string
  visibleNodeIds: string[]
  visibleEdgeIds: string[]
  activeNodeIds?: string[]
  activeEdgeIds?: string[]
  sourceUrl?: string
}

export type DemoStep =
  | TitleStep
  | ContentStep
  | DiscussionStep
  | QuestionStep
  | CommandStep
  | DiagramStep

export interface DemoDefinition {
  meta: DemoMeta
  diagrams?: DiagramDef[]
  steps: DemoStep[]
}
