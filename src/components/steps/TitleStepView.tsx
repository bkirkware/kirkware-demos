import { motion } from 'framer-motion'
import type { TitleStep } from '@/types/demo'
import { useDemoStore } from '@/store/demoStore'

export function TitleStepView({ step }: { step: TitleStep }) {
  if (step.variant === 'section') return <SectionDivider step={step} />
  const bullets = step.bullets ?? []

  return (
    <div className="flex h-full flex-col items-center justify-center px-16 text-center">
      {step.eyebrow && (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium tracking-wider text-cyan-300 uppercase"
        >
          {step.eyebrow}
        </motion.span>
      )}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5 }}
        className="text-gradient-accent max-w-5xl text-6xl font-bold tracking-tight text-balance xl:text-7xl"
      >
        {step.heading}
      </motion.h1>
      {step.subheading && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-6 max-w-3xl text-xl leading-relaxed text-slate-400 xl:text-2xl"
        >
          {step.subheading}
        </motion.p>
      )}
      {bullets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {bullets.map((b) => (
            <span key={b} className="glass-panel rounded-full px-5 py-2.5 text-base font-medium text-slate-300">
              {b}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  )
}

/**
 * Section-divider slide: an oversized section number, the heading at full
 * scale, and the bullets as an agenda chip row — a visual "chapter break"
 * between demo sections.
 */
function SectionDivider({ step }: { step: TitleStep }) {
  const demo = useDemoStore((s) => s.currentDemo)
  const sections: string[] = []
  for (const s of demo?.steps ?? []) {
    if (!sections.includes(s.section)) sections.push(s.section)
  }
  const index = sections.indexOf(step.section) + 1
  const bullets = step.bullets ?? []

  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden px-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        aria-hidden
        className="pointer-events-none absolute -top-24 right-4 text-[22rem] leading-none font-bold tracking-tighter text-white/[0.04] select-none"
      >
        {String(index).padStart(2, '0')}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-5 flex items-center gap-4"
      >
        <span className="text-sm font-semibold tracking-[0.25em] text-cyan-400 uppercase">
          {step.eyebrow ?? `Section ${String(index).padStart(2, '0')}`}
        </span>
        <span className="h-px w-24 bg-gradient-to-r from-cyan-400/60 to-transparent" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-gradient-accent max-w-4xl text-6xl font-bold tracking-tight text-balance xl:text-7xl"
      >
        {step.heading}
      </motion.h1>
      {step.subheading && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-6 max-w-3xl text-xl leading-relaxed text-slate-400"
        >
          {step.subheading}
        </motion.p>
      )}
      {bullets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          {bullets.map((b, i) => (
            <span key={b} className="glass-panel flex items-center gap-2.5 rounded-full px-5 py-2.5 text-base font-medium text-slate-300">
              <span className="text-[13px] font-semibold text-cyan-400">{i + 1}</span>
              {b}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  )
}
