import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import type { QuestionStep } from '@/types/demo'
import { EditableField } from '@/components/ui/EditableField'

export function QuestionStepView({ step }: { step: QuestionStep }) {
  const [showHints, setShowHints] = useState(false)

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-16 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-fuchsia-500/8" />
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-fuchsia-400/20 text-amber-300"
      >
        <HelpCircle size={28} />
      </motion.div>
      <span className="relative z-10 mb-4 text-xs font-semibold tracking-widest text-amber-400 uppercase">
        Ask the audience
      </span>
      <EditableField stepId={step.id} field="prompt" value={step.prompt} variant="inline" multiline className="relative z-10">
        {(v) => (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="max-w-2xl text-3xl font-semibold text-balance text-slate-100"
          >
            {v}
          </motion.p>
        )}
      </EditableField>

      {step.hints && (
        <div className="relative z-10 mt-8">
          <button
            onClick={() => setShowHints((v) => !v)}
            className="mx-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            Presenter notes
            <ChevronDown size={13} className={`transition-transform ${showHints ? 'rotate-180' : ''}`} />
          </button>
          {showHints && (
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-2 text-left"
            >
              {step.hints.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {h}
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      )}
    </div>
  )
}
