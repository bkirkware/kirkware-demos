import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  Braces,
  Cloud,
  Cpu,
  Database,
  FileText,
  Gauge,
  GitBranch,
  Globe,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  MessageSquare,
  Network,
  PlayCircle,
  Route,
  Rocket,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  Waypoints,
  Workflow,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { CloudFoundryIcon } from './icons/CloudFoundryIcon'
import { SpringAiIcon } from './icons/SpringAiIcon'
import { SpringLeafIcon } from './icons/SpringLeafIcon'
import { TanzuIcon } from './icons/TanzuIcon'
import type { IconName } from './iconNames'

export const iconRegistry: Record<IconName, ComponentType<LucideProps>> = {
  activity: Activity,
  'bar-chart': BarChart3,
  bot: Bot,
  boxes: Boxes,
  braces: Braces,
  cloud: Cloud,
  'cloud-foundry': CloudFoundryIcon,
  cpu: Cpu,
  database: Database,
  'file-text': FileText,
  gauge: Gauge,
  'git-branch': GitBranch,
  globe: Globe,
  'help-circle': HelpCircle,
  key: KeyRound,
  layers: Layers,
  lock: Lock,
  message: MessageSquare,
  network: Network,
  play: PlayCircle,
  route: Route,
  rocket: Rocket,
  server: Server,
  shield: Shield,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
  'spring-ai': SpringAiIcon,
  'spring-leaf': SpringLeafIcon,
  tanzu: TanzuIcon,
  terminal: Terminal,
  users: Users,
  waypoints: Waypoints,
  workflow: Workflow,
}

export type { IconName }

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Component = iconRegistry[name as IconName] ?? Sparkles
  return <Component {...props} />
}
