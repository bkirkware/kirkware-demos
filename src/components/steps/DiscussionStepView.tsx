import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import type { DiscussionStep } from '@/types/demo'

export function DiscussionStepView({ step }: { step: DiscussionStep }) {
  const talkingPoints = step.talkingPoints ?? []

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-16 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 text-cyan-300"
      >
        <MessageSquare size={28} />
      </motion.div>
      <span className="relative z-10 mb-4 text-xs font-semibold tracking-widest text-cyan-400 uppercase">
        Pause &amp; discuss
      </span>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative z-10 max-w-2xl text-3xl font-semibold text-balance text-slate-100"
      >
        {step.prompt}
      </motion.p>
      {talkingPoints.length > 0 && (
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="relative z-10 mt-8 space-y-2 text-left"
        >
          {talkingPoints.map((tp) => (
            <li key={tp} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
              <span>{tp}</span>
            </li>
          ))}
        </motion.ul>
      )}
    </div>
  )
}
