import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDemoStore } from '@/store/demoStore'

export function NavControls() {
  const demo = useDemoStore((s) => s.currentDemo)
  const stepIndex = useDemoStore((s) => s.currentStepIndex)
  const next = useDemoStore((s) => s.next)
  const prev = useDemoStore((s) => s.prev)

  if (!demo) return null
  const atStart = stepIndex === 0
  const atEnd = stepIndex === demo.steps.length - 1

  return (
    <div className="flex items-center gap-2 border-t border-white/10 p-3">
      <button
        onClick={prev}
        disabled={atStart}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft size={15} /> Prev
      </button>
      <button
        onClick={next}
        disabled={atEnd}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next <ChevronRight size={15} />
      </button>
    </div>
  )
}
