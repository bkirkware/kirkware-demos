import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Plus, X } from 'lucide-react'
import type { DiscussionStep } from '@/types/demo'
import { EditableField } from '@/components/ui/EditableField'
import { useEditModeStore } from '@/store/editModeStore'
import { addArrayItem, removeArrayItem } from '@/lib/arrayEdits'

export function DiscussionStepView({ step }: { step: DiscussionStep }) {
  const editsEnabled = useEditModeStore((s) => s.enabled)
  const [talkingPoints, setTalkingPoints] = useState(step.talkingPoints ?? [])

  async function handleAddTalkingPoint() {
    const result = await addArrayItem(step.id, 'talkingPoints', 'New talking point')
    if (result.ok) setTalkingPoints((prev) => [...prev, 'New talking point'])
  }

  async function handleRemoveTalkingPoint(index: number, value: string) {
    const result = await removeArrayItem(step.id, 'talkingPoints', index, value)
    if (result.ok) setTalkingPoints((prev) => prev.filter((_, i) => i !== index))
  }

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
      {(talkingPoints.length > 0 || editsEnabled) && (
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="relative z-10 mt-8 space-y-2 text-left"
        >
          {talkingPoints.map((tp, i) => (
            <li key={i} className="group flex items-start gap-2 text-sm text-slate-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
              <EditableField stepId={step.id} field={`talkingPoints[${i}]`} value={tp} variant="inline">
                {(v) => <span>{v}</span>}
              </EditableField>
              {editsEnabled && (
                <button
                  onClick={() => handleRemoveTalkingPoint(i, tp)}
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
                onClick={handleAddTalkingPoint}
                className="flex items-center gap-1.5 rounded-md px-1 py-1 text-sm text-slate-500 transition hover:text-cyan-300"
              >
                <Plus size={13} /> Add talking point
              </button>
            </li>
          )}
        </motion.ul>
      )}
    </div>
  )
}
