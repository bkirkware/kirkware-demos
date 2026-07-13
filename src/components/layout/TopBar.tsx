import { Sparkles } from 'lucide-react'
import { useDemoStore } from '@/store/demoStore'
import { DemoSelector } from './DemoSelector'

export function TopBar() {
  const demo = useDemoStore((s) => s.currentDemo)
  const stepIndex = useDemoStore((s) => s.currentStepIndex)

  return (
    <header className="glass-panel relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-cyan-400">
            <Sparkles size={16} className="text-slate-950" />
          </div>
          <span className="text-sm font-semibold text-slate-400">Kirkware Demos</span>
        </div>
        {demo && (
          <>
            <div className="h-6 w-px shrink-0 bg-white/10" />
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold text-slate-100">{demo.meta.title}</h1>
              {demo.meta.subtitle && <p className="truncate text-xs text-slate-500">{demo.meta.subtitle}</p>}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {demo && (
          <span className="hidden font-mono text-xs text-slate-500 sm:inline">
            Step {stepIndex + 1} / {demo.steps.length}
          </span>
        )}
        <DemoSelector />
      </div>
    </header>
  )
}
