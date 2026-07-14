import { motion } from 'framer-motion'
import type { TitleStep } from '@/types/demo'
import { EditableField } from '@/components/ui/EditableField'

export function TitleStepView({ step }: { step: TitleStep }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-16 text-center">
      {step.eyebrow && (
        <EditableField stepId={step.id} field="eyebrow" value={step.eyebrow} variant="inline" className="mb-5">
          {(v) => (
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wider text-cyan-300 uppercase"
            >
              {v}
            </motion.span>
          )}
        </EditableField>
      )}
      <EditableField stepId={step.id} field="heading" value={step.heading} variant="inline">
        {(v) => (
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className="text-gradient-accent max-w-4xl text-5xl font-bold tracking-tight text-balance"
          >
            {v}
          </motion.h1>
        )}
      </EditableField>
      {step.subheading && (
        <EditableField stepId={step.id} field="subheading" value={step.subheading} variant="inline" className="mt-5">
          {(v) => (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="max-w-2xl text-lg text-slate-400"
            >
              {v}
            </motion.p>
          )}
        </EditableField>
      )}
      {step.bullets && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {step.bullets.map((b) => (
            <span
              key={b}
              className="glass-panel rounded-full px-4 py-2 text-sm font-medium text-slate-300"
            >
              {b}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  )
}
