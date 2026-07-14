import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import type { TitleStep } from '@/types/demo'
import { EditableField } from '@/components/ui/EditableField'
import { useEditModeStore } from '@/store/editModeStore'
import { addArrayItem, removeArrayItem } from '@/lib/arrayEdits'

export function TitleStepView({ step }: { step: TitleStep }) {
  const editsEnabled = useEditModeStore((s) => s.enabled)
  const [bullets, setBullets] = useState(step.bullets ?? [])

  async function handleAddBullet() {
    const result = await addArrayItem(step.id, 'bullets', 'New item')
    if (result.ok) setBullets((prev) => [...prev, 'New item'])
  }

  async function handleRemoveBullet(index: number, value: string) {
    const result = await removeArrayItem(step.id, 'bullets', index, value)
    if (result.ok) setBullets((prev) => prev.filter((_, i) => i !== index))
  }

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
      {(bullets.length > 0 || editsEnabled) && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {bullets.map((b, i) => (
            <div key={i} className="group relative">
              <EditableField stepId={step.id} field={`bullets[${i}]`} value={b} variant="inline">
                {(v) => <span className="glass-panel rounded-full px-4 py-2 text-sm font-medium text-slate-300">{v}</span>}
              </EditableField>
              {editsEnabled && (
                <button
                  onClick={() => handleRemoveBullet(i, b)}
                  className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-400/20 text-rose-300 opacity-0 shadow transition group-hover:opacity-100 hover:bg-rose-400/30"
                  title="Remove this item"
                >
                  <X size={9} />
                </button>
              )}
            </div>
          ))}
          {editsEnabled && (
            <button
              onClick={handleAddBullet}
              className="flex items-center gap-1 rounded-full border border-dashed border-white/20 px-4 py-2 text-sm text-slate-500 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <Plus size={13} /> Add
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}
