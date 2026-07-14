import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import type { CommandStep } from '@/types/demo'
import { Markdown } from '@/components/ui/Markdown'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { EditableField } from '@/components/ui/EditableField'
import { StepHeader } from './StepHeader'

export function CommandStepView({ step }: { step: CommandStep }) {
  return (
    <div className="mx-auto h-full max-w-3xl overflow-y-auto px-12 py-12">
      <StepHeader stepId={step.id} section={step.section} heading={step.heading} sourceUrl={step.sourceUrl} />

      {step.description && (
        <EditableField stepId={step.id} field="description" value={step.description} multiline>
          {(v) => <Markdown>{v}</Markdown>}
        </EditableField>
      )}

      <div className="mt-5 space-y-4">
        {step.commands.map((block, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.3 }}
          >
            <CodeBlock block={block} stepId={step.id} />
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
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-emerald-300 uppercase">
            <Zap size={12} /> Impact
          </div>
          <EditableField stepId={step.id} field="impact" value={step.impact} multiline>
            {(v) => <Markdown className="text-sm">{v}</Markdown>}
          </EditableField>
        </motion.div>
      )}
    </div>
  )
}
