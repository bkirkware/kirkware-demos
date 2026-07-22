/**
 * The canonical list of icon names demos may reference (content-step bullet
 * `icon:` values and diagram node `icon:` values). Kept separate from
 * Icon.tsx (no JSX, no lucide import) so the Node-side content pipeline can
 * validate icon names in demo markdown without pulling React into the
 * build tooling. Icon.tsx types its registry as Record<IconName, …>, so
 * adding a name here without a component (or vice versa) is a compile error.
 */
export const iconNames = [
  'activity',
  'bar-chart',
  'bot',
  'boxes',
  'braces',
  'cloud',
  'cloud-foundry',
  'cpu',
  'database',
  'file-text',
  'gauge',
  'git-branch',
  'globe',
  'help-circle',
  'key',
  'layers',
  'lock',
  'message',
  'network',
  'play',
  'route',
  'rocket',
  'server',
  'shield',
  'shield-check',
  'sparkles',
  'spring-ai',
  'spring-leaf',
  'tanzu',
  'terminal',
  'users',
  'waypoints',
  'workflow',
] as const

export type IconName = (typeof iconNames)[number]
