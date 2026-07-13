import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, LayoutGrid } from 'lucide-react'
import { demoRegistry } from '@/demos/registry'
import { useDemoStore } from '@/store/demoStore'
import { useViewStore } from '@/store/viewStore'

export function DemoSelector() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const currentDemoId = useDemoStore((s) => s.currentDemoId)
  const loadDemo = useDemoStore((s) => s.loadDemo)
  const setView = useViewStore((s) => s.setView)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
      >
        <LayoutGrid size={15} />
        Demos
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass-panel absolute right-0 z-50 mt-2 w-80 rounded-xl p-1.5 shadow-2xl shadow-black/50"
          >
            <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
              Available demos
            </div>
            {demoRegistry.map((demo) => (
              <button
                key={demo.id}
                onClick={() => {
                  loadDemo(demo.id)
                  setView('demo')
                  setOpen(false)
                }}
                className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-white/8 ${
                  demo.id === currentDemoId ? 'bg-white/6' : ''
                }`}
              >
                <div className="mt-0.5 h-4 w-4 shrink-0">
                  {demo.id === currentDemoId && <Check size={16} className="text-cyan-300" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-100">{demo.title}</div>
                  {demo.subtitle && <div className="mt-0.5 line-clamp-2 text-xs text-slate-400">{demo.subtitle}</div>}
                  {demo.tags && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {demo.tags.map((t) => (
                        <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
