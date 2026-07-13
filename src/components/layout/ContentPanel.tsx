import { AnimatePresence, motion } from 'framer-motion'
import { useDemoStore } from '@/store/demoStore'
import { TitleStepView } from '@/components/steps/TitleStepView'
import { ContentStepView } from '@/components/steps/ContentStepView'
import { DiscussionStepView } from '@/components/steps/DiscussionStepView'
import { QuestionStepView } from '@/components/steps/QuestionStepView'
import { CommandStepView } from '@/components/steps/CommandStepView'
import { DiagramStepView } from '@/components/steps/DiagramStepView'

export function ContentPanel() {
  const demo = useDemoStore((s) => s.currentDemo)
  const stepIndex = useDemoStore((s) => s.currentStepIndex)

  if (!demo) return null
  const step = demo.steps[stepIndex]

  return (
    <main className="bg-app-grid relative min-w-0 flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {step.type === 'title' && <TitleStepView step={step} />}
          {step.type === 'content' && <ContentStepView step={step} />}
          {step.type === 'discussion' && <DiscussionStepView step={step} />}
          {step.type === 'question' && <QuestionStepView step={step} />}
          {step.type === 'command' && <CommandStepView step={step} />}
          {step.type === 'diagram' && <DiagramStepView step={step} />}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
