import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Lock } from 'lucide-react'
import { useEnvVarsStore } from '@/store/envVarsStore'

interface Coords {
  top: number
  left: number
  placeAbove: boolean
}

export function VariableHover({ text, varName }: { text: string; varName: string }) {
  const [coords, setCoords] = useState<Coords | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const info = useEnvVarsStore((s) => s.vars[varName])

  function handleEnter() {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const placeAbove = rect.bottom > window.innerHeight - 90
    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 260),
      placeAbove,
    })
  }

  return (
    <span
      ref={ref}
      className="cursor-help underline decoration-dotted decoration-cyan-400/60 underline-offset-2"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setCoords(null)}
    >
      {text}
      {coords &&
        createPortal(
          <span
            className="pointer-events-none fixed z-50 block w-max max-w-xs rounded-md border border-white/10 bg-[#0a0d16] px-2.5 py-1.5 text-[11px] leading-snug shadow-lg shadow-black/40"
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.placeAbove ? 'translateY(-100%)' : undefined,
            }}
          >
            <span className="block font-sans text-[10px] font-semibold tracking-wide text-slate-500 normal-case">
              {varName}
            </span>
            {info?.sensitive ? (
              <span className="flex items-center gap-1 font-sans text-amber-300">
                <Lock size={10} /> sensitive — hidden
              </span>
            ) : info ? (
              <span className="font-mono break-all text-emerald-300">
                {info.value === '' ? '(empty)' : info.value}
              </span>
            ) : (
              <span className="font-sans text-slate-500">not set</span>
            )}
          </span>,
          document.body,
        )}
    </span>
  )
}
