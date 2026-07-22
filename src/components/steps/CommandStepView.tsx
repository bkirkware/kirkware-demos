import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import type { CommandStep } from '@/types/demo'
import { Markdown } from '@/components/ui/Markdown'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { StepHeader } from './StepHeader'

export function CommandStepView({ step }: { step: CommandStep }) {
  return (
    <div className="mx-auto h-full max-w-4xl overflow-y-auto px-12 py-12">
      <StepHeader section={step.section} heading={step.heading} sourceUrl={step.sourceUrl} links={step.links} />

      {step.description && <Markdown className="text-[17px]">{step.description}</Markdown>}

      <div className="mt-5 space-y-4">
        {step.commands.map((block, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.3 }}
          >
            <CodeBlock block={block} />
          </motion.div>
        ))}
      </div>

      {step.impact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + step.commands.length * 0.08 }}
          className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/6 p-4"
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-emerald-300 uppercase">
            <Zap size={12} /> Impact
          </div>
          <Markdown className="text-[15px]">{step.impact}</Markdown>
        </motion.div>
      )}
    </div>
  )
}
