import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, ChevronDown, Layers } from 'lucide-react'
import { useEnvProfilesStore } from '@/store/envProfilesStore'

export function EnvProfileSelector() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activating, setActivating] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const profiles = useEnvProfilesStore((s) => s.profiles)
  const activeFilename = useEnvProfilesStore((s) => s.activeFilename)
  const refresh = useEnvProfilesStore((s) => s.refresh)
  const activate = useEnvProfilesStore((s) => s.activate)

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleSelect(filename: string) {
    setActivating(filename)
    setError(null)
    const result = await activate(filename)
    setActivating(null)
    if (!result.ok) {
      setError(result.error ?? 'Activation failed')
      return
    }
    setOpen(false)
  }

  const activeLabel = profiles.find((p) => p.filename === activeFilename)?.label ?? 'Local .env'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        title="Switch between saved environment profiles"
      >
        <Layers size={15} />
        <span className="max-w-[10rem] truncate">{activeLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass-panel absolute right-0 z-50 mt-2 w-72 rounded-xl p-1.5 shadow-2xl shadow-black/50"
          >
            <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
              Environment profiles
            </div>

            {profiles.length === 0 && (
              <div className="px-2.5 py-3 text-sm text-slate-500">
                No saved profiles yet — use "Save As" on the Settings page to create one.
              </div>
            )}

            {profiles.map((profile) => (
              <button
                key={profile.filename}
                onClick={() => handleSelect(profile.filename)}
                disabled={activating !== null}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-white/8 disabled:cursor-wait ${
                  profile.filename === activeFilename ? 'bg-white/6' : ''
                }`}
              >
                <div className="h-4 w-4 shrink-0">
                  {profile.filename === activeFilename && <Check size={16} className="text-cyan-300" />}
                </div>
                <span className="min-w-0 flex-1 truncate font-mono text-slate-200">{profile.label}</span>
                {activating === profile.filename && (
                  <span className="text-[11px] text-slate-500">activating…</span>
                )}
              </button>
            ))}

            {error && (
              <div className="mt-1 flex items-start gap-1.5 rounded-lg bg-rose-400/10 px-2.5 py-2 text-xs text-rose-300">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
