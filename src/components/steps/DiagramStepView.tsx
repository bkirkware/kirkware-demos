import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import type { DiagramStep } from '@/types/demo'
import { useDemoStore } from '@/store/demoStore'
import { ArchitectureDiagram } from '@/components/diagram/ArchitectureDiagram'
import { Markdown } from '@/components/ui/Markdown'
import { StepHeader } from './StepHeader'

export function DiagramStepView({ step }: { step: DiagramStep }) {
  const demo = useDemoStore((s) => s.currentDemo)
  const diagram = demo?.diagrams?.find((d) => d.id === step.diagramId)

  return (
    <div className="flex h-full flex-col px-10 py-8">
      <StepHeader section={step.section} heading={step.heading} sourceUrl={step.sourceUrl} />

      {step.narrative && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel mb-4 flex max-h-24 shrink-0 items-start gap-3 overflow-y-auto rounded-xl px-5 py-3.5"
        >
          <Info size={16} className="mt-0.5 shrink-0 text-cyan-300" />
          <div className="min-w-0 flex-1">
            <Markdown className="text-sm">{step.narrative}</Markdown>
          </div>
        </motion.div>
      )}

      <div className="glass-panel bg-grid-lines min-h-0 flex-1 rounded-2xl">
        {diagram ? (
          <ArchitectureDiagram
            diagram={diagram}
            visibleNodeIds={step.visibleNodeIds}
            visibleEdgeIds={step.visibleEdgeIds}
            activeNodeIds={step.activeNodeIds}
            activeEdgeIds={step.activeEdgeIds}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Diagram "{step.diagramId}" not found
          </div>
        )}
      </div>
    </div>
  )
}
