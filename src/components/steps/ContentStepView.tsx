import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import type { ContentBullet, ContentStep } from '@/types/demo'
import { Markdown } from '@/components/ui/Markdown'
import { Icon } from '@/components/ui/Icon'
import { EditableField } from '@/components/ui/EditableField'
import { useEnvVarsStore } from '@/store/envVarsStore'
import { useEditModeStore } from '@/store/editModeStore'
import { interpolateEnvVars } from '@/lib/envVarTokens'
import { addArrayItem, removeArrayItem } from '@/lib/arrayEdits'
import { StepHeader } from './StepHeader'

const calloutTone = {
  info: 'border-indigo-400/30 bg-indigo-400/8 text-indigo-200',
  success: 'border-emerald-400/30 bg-emerald-400/8 text-emerald-200',
  warning: 'border-amber-400/30 bg-amber-400/8 text-amber-200',
}

export function ContentStepView({ step }: { step: ContentStep }) {
  const envVars = useEnvVarsStore((s) => s.vars)
  const editsEnabled = useEditModeStore((s) => s.enabled)
  const [bullets, setBullets] = useState<ContentBullet[]>(step.bullets ?? [])

  async function handleAddBullet() {
    const newBullet: ContentBullet = { title: 'New item', description: 'Description' }
    const result = await addArrayItem(step.id, 'bullets', newBullet)
    if (result.ok) setBullets((prev) => [...prev, newBullet])
  }

  async function handleRemoveBullet(index: number, title: string) {
    const result = await removeArrayItem(step.id, 'bullets', index, title, 'title')
    if (result.ok) setBullets((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="mx-auto h-full max-w-3xl overflow-y-auto px-12 py-12">
      <StepHeader stepId={step.id} section={step.section} heading={step.heading} sourceUrl={step.sourceUrl} />

      {step.body && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <EditableField stepId={step.id} field="body" value={step.body} multiline>
            {(v) => <Markdown>{v}</Markdown>}
          </EditableField>
        </motion.div>
      )}

      {(bullets.length > 0 || editsEnabled) && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bullets.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.3 }}
              className="group relative glass-panel rounded-xl p-4"
            >
              {editsEnabled && (
                <button
                  onClick={() => handleRemoveBullet(i, b.title)}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-400/20 text-rose-300 opacity-0 shadow transition group-hover:opacity-100 hover:bg-rose-400/30"
                  title="Remove this item"
                >
                  <X size={11} />
                </button>
              )}
              <div className="mb-2 flex items-center gap-2.5">
                {b.icon && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                    <Icon name={b.icon} size={16} />
                  </div>
                )}
                <EditableField stepId={step.id} field={`bullets[${i}].title`} value={b.title} variant="inline">
                  {(v) =>
                    b.titleUrl ? (
                      <a
                        href={interpolateEnvVars(b.titleUrl!, envVars)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200"
                      >
                        {v}
                      </a>
                    ) : (
                      <div className="text-sm font-semibold text-slate-100">{v}</div>
                    )
                  }
                </EditableField>
              </div>
              {b.description && (
                <EditableField stepId={step.id} field={`bullets[${i}].description`} value={b.description} multiline>
                  {(v) => <p className="text-[13px] leading-relaxed break-words text-slate-400">{v}</p>}
                </EditableField>
              )}
            </motion.div>
          ))}
          {editsEnabled && (
            <button
              onClick={handleAddBullet}
              className="flex min-h-[4.5rem] items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 text-sm text-slate-500 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <Plus size={14} /> Add item
            </button>
          )}
        </div>
      )}

      {step.callout && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mt-6 rounded-xl border p-4 ${calloutTone[step.callout.tone ?? 'info']}`}
        >
          <EditableField stepId={step.id} field="callout.label" value={step.callout.label}>
            {(v) => <div className="mb-1 text-xs font-semibold tracking-wide uppercase opacity-80">{v}</div>}
          </EditableField>
          <EditableField stepId={step.id} field="callout.body" value={step.callout.body} multiline>
            {(v) => <div className="text-sm leading-relaxed break-words">{v}</div>}
          </EditableField>
        </motion.div>
      )}
    </div>
  )
}
