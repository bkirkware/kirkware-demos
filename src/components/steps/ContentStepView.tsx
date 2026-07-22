import { motion } from 'framer-motion'
import type { ContentStep } from '@/types/demo'
import { Markdown } from '@/components/ui/Markdown'
import { Icon } from '@/components/ui/Icon'
import { useEnvVarsStore } from '@/store/envVarsStore'
import { interpolateEnvVars } from '@/lib/envVarTokens'
import { StepHeader } from './StepHeader'

const calloutTone = {
  info: 'border-indigo-400/30 bg-indigo-400/8 text-indigo-200',
  success: 'border-emerald-400/30 bg-emerald-400/8 text-emerald-200',
  warning: 'border-amber-400/30 bg-amber-400/8 text-amber-200',
}

export function ContentStepView({ step }: { step: ContentStep }) {
  const envVars = useEnvVarsStore((s) => s.vars)
  const bullets = step.bullets ?? []

  return (
    <div className="mx-auto h-full max-w-3xl overflow-y-auto px-12 py-12">
      <StepHeader section={step.section} heading={step.heading} sourceUrl={step.sourceUrl} />

      {step.body && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Markdown>{step.body}</Markdown>
        </motion.div>
      )}

      {bullets.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bullets.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.3 }}
              className="glass-panel rounded-xl p-4"
            >
              <div className="mb-2 flex items-center gap-2.5">
                {b.icon && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                    <Icon name={b.icon} size={16} />
                  </div>
                )}
                {b.titleUrl ? (
                  <a
                    href={interpolateEnvVars(b.titleUrl, envVars)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200"
                  >
                    {b.title}
                  </a>
                ) : (
                  <div className="text-sm font-semibold text-slate-100">{b.title}</div>
                )}
              </div>
              {b.description && <p className="text-[13px] leading-relaxed break-words text-slate-400">{b.description}</p>}
            </motion.div>
          ))}
        </div>
      )}

      {step.callout && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mt-6 rounded-xl border p-4 ${calloutTone[step.callout.tone ?? 'info']}`}
        >
          <div className="mb-1 text-xs font-semibold tracking-wide uppercase opacity-80">{step.callout.label}</div>
          <div className="text-sm leading-relaxed break-words">{step.callout.body}</div>
        </motion.div>
      )}
    </div>
  )
}
