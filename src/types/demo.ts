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
  /** If set, renders the title as a link — supports `$VAR` / `${VAR}` env-var interpolation, same as narrative text. */
  titleUrl?: string
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
  /**
   * Opt this block into the "Run Live" button, which executes a real,
   * server-side-allowlisted shell command via the dev server's /api/run-live
   * endpoint and displays actual stdout/stderr. Must match a key in
   * ALLOWED_COMMANDS in vite-plugin-run-live.ts — dev-server only.
   */
  liveId?: string
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

export type DiagramSide = 'top' | 'bottom' | 'left' | 'right'

export interface DiagramEdgeDef {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
  dashed?: boolean
  /** Force which side of the source/target the connector leaves/enters from, overriding auto-detection. Use to route an edge around an obstacle it would otherwise cut through. */
  sourceSide?: DiagramSide
  targetSide?: DiagramSide
  /** Explicit intermediate points (diagram coordinate space) the connector must route through, for edges that need to dodge an obstacle no single curve can avoid. Rendered as a rounded elbow through source port -> waypoints -> target port. */
  waypoints?: { x: number; y: number }[]
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
