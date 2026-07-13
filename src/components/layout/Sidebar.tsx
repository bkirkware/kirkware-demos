import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, FileText, HelpCircle, MessageSquare, Network, Rocket, Terminal } from 'lucide-react'
import type { DemoStep, StepType } from '@/types/demo'
import { useDemoStore } from '@/store/demoStore'
import { NavControls } from './NavControls'

const stepIcon: Record<StepType, typeof Rocket> = {
  title: Rocket,
  content: FileText,
  discussion: MessageSquare,
  question: HelpCircle,
  command: Terminal,
  diagram: Network,
}

interface StepGroup {
  section: string
  items: { step: DemoStep; index: number }[]
}

export function Sidebar() {
  const demo = useDemoStore((s) => s.currentDemo)
  const stepIndex = useDemoStore((s) => s.currentStepIndex)
  const goToStep = useDemoStore((s) => s.goToStep)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const groups = useMemo<StepGroup[]>(() => {
    if (!demo) return []
    const out: StepGroup[] = []
    demo.steps.forEach((step, index) => {
      const last = out[out.length - 1]
      if (last && last.section === step.section) {
        last.items.push({ step, index })
      } else {
        out.push({ section: step.section, items: [{ step, index }] })
      }
    })
    return out
  }, [demo])

  if (!demo) return null

  const progress = ((stepIndex + 1) / demo.steps.length) * 100

  function toggleSection(section: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  return (
    <aside className="glass-panel flex w-80 shrink-0 flex-col border-r border-white/10">
      <div className="h-1 w-full bg-white/5">
        <div
          className="h-1 bg-gradient-to-r from-indigo-400 to-cyan-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => {
          const isCollapsed = collapsed.has(group.section)
          const hasActiveStep = group.items.some(({ index }) => index === stepIndex)
          return (
            <div key={group.section} className="mb-2">
              <button
                onClick={() => toggleSection(group.section)}
                className="group flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase transition hover:text-slate-300"
              >
                <ChevronDown
                  size={12}
                  className={`shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                />
                <span className="flex-1 text-left">{group.section}</span>
                {isCollapsed && hasActiveStep && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />}
              </button>
              <motion.div
                initial={false}
                animate={{ height: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5 pt-1 pb-2">
                  {group.items.map(({ step, index }) => {
                    const Icon = stepIcon[step.type]
                    const isActive = index === stepIndex
                    return (
                      <button
                        key={step.id}
                        onClick={() => goToStep(index)}
                        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-400/15 to-cyan-400/10 text-slate-100'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                            isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'
                          }`}
                        >
                          <Icon size={13} />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{step.title}</span>
                        {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            </div>
          )
        })}
      </nav>

      <NavControls />
    </aside>
  )
}
