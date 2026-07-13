import type { DiagramNodeKind } from '@/types/demo'

export const NODE_WIDTH = 256
export const NODE_HEIGHT = 92

export interface KindTheme {
  border: string
  iconBg: string
  iconColor: string
  glow: string
}

export const kindTheme: Record<DiagramNodeKind, KindTheme> = {
  client: {
    border: 'border-sky-400/40',
    iconBg: 'bg-sky-400/15',
    iconColor: 'text-sky-300',
    glow: 'rgba(56,189,248,0.55)',
  },
  gateway: {
    border: 'border-indigo-400/40',
    iconBg: 'bg-indigo-400/15',
    iconColor: 'text-indigo-300',
    glow: 'rgba(129,140,248,0.55)',
  },
  service: {
    border: 'border-violet-400/40',
    iconBg: 'bg-violet-400/15',
    iconColor: 'text-violet-300',
    glow: 'rgba(167,139,250,0.55)',
  },
  model: {
    border: 'border-fuchsia-400/40',
    iconBg: 'bg-fuchsia-400/15',
    iconColor: 'text-fuchsia-300',
    glow: 'rgba(232,121,249,0.55)',
  },
  data: {
    border: 'border-amber-400/40',
    iconBg: 'bg-amber-400/15',
    iconColor: 'text-amber-300',
    glow: 'rgba(251,191,36,0.55)',
  },
  security: {
    border: 'border-rose-400/40',
    iconBg: 'bg-rose-400/15',
    iconColor: 'text-rose-300',
    glow: 'rgba(251,113,133,0.55)',
  },
  observability: {
    border: 'border-emerald-400/40',
    iconBg: 'bg-emerald-400/15',
    iconColor: 'text-emerald-300',
    glow: 'rgba(52,211,153,0.55)',
  },
  external: {
    border: 'border-slate-400/40',
    iconBg: 'bg-slate-400/15',
    iconColor: 'text-slate-300',
    glow: 'rgba(148,163,184,0.55)',
  },
  platform: {
    border: 'border-cyan-400/40',
    iconBg: 'bg-cyan-400/15',
    iconColor: 'text-cyan-300',
    glow: 'rgba(34,211,238,0.55)',
  },
}
