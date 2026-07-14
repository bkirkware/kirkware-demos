import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, HelpCircle, Plus, X } from 'lucide-react'
import type { QuestionStep } from '@/types/demo'
import { EditableField } from '@/components/ui/EditableField'
import { useEditModeStore } from '@/store/editModeStore'
import { addArrayItem, removeArrayItem } from '@/lib/arrayEdits'

export function QuestionStepView({ step }: { step: QuestionStep }) {
  const [showHints, setShowHints] = useState(false)
  const editsEnabled = useEditModeStore((s) => s.enabled)
  const [hints, setHints] = useState(step.hints ?? [])

  async function handleAddHint() {
    const result = await addArrayItem(step.id, 'hints', 'New hint')
    if (result.ok) setHints((prev) => [...prev, 'New hint'])
  }

  async function handleRemoveHint(index: number, value: string) {
    const result = await removeArrayItem(step.id, 'hints', index, value)
    if (result.ok) setHints((prev) => prev.filter((_, i) => i !== index))
  }

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

      {(hints.length > 0 || editsEnabled) && (
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
              {hints.map((h, i) => (
                <li key={i} className="group flex items-start gap-2 text-sm text-slate-500">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  <EditableField stepId={step.id} field={`hints[${i}]`} value={h} variant="inline">
                    {(v) => <span>{v}</span>}
                  </EditableField>
                  {editsEnabled && (
                    <button
                      onClick={() => handleRemoveHint(i, h)}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-rose-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-400/20"
                      title="Remove this item"
                    >
                      <X size={9} />
                    </button>
                  )}
                </li>
              ))}
              {editsEnabled && (
                <li>
                  <button
                    onClick={handleAddHint}
                    className="flex items-center gap-1.5 rounded-md px-1 py-1 text-sm text-slate-500 transition hover:text-amber-300"
                  >
                    <Plus size={13} /> Add hint
                  </button>
                </li>
              )}
            </motion.ul>
          )}
        </div>
      )}
    </div>
  )
}
