import { motion } from 'framer-motion'
import type { ContentBullet, ContentStep } from '@/types/demo'
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
  const bullets = step.bullets ?? []
  const split = step.variant === 'split'

  const body = step.body && (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {step.variant === 'quote' ? (
        <blockquote className="relative mt-2 pl-8">
          <span aria-hidden className="absolute -top-4 left-0 text-6xl leading-none text-cyan-400/40 select-none">
            &ldquo;
          </span>
          <Markdown className="text-[26px] leading-snug font-medium [&_p]:text-slate-100">{step.body}</Markdown>
        </blockquote>
      ) : (
        <Markdown className="text-[17px]">{step.body}</Markdown>
      )}
    </motion.div>
  )

  const callout = step.callout && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`mt-6 rounded-xl border p-5 ${calloutTone[step.callout.tone ?? 'info']}`}
    >
      <div className="mb-1.5 text-[13px] font-semibold tracking-wide uppercase opacity-80">{step.callout.label}</div>
      <div className="text-base leading-relaxed break-words">{step.callout.body}</div>
    </motion.div>
  )

  const cards = bullets.length > 0 && (
    <div className={split ? 'flex flex-col gap-3' : 'mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2'}>
      {bullets.map((b, i) =>
        step.variant === 'stats' ? (
          <StatTile key={i} bullet={b} index={i} />
        ) : (
          <Card key={i} bullet={b} index={i} />
        ),
      )}
    </div>
  )

  return (
    <div className="mx-auto h-full max-w-4xl overflow-y-auto px-12 py-12">
      <StepHeader section={step.section} heading={step.heading} sourceUrl={step.sourceUrl} links={step.links} />
      {split ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            {body}
            {callout}
          </div>
          <div className="mt-1">{cards}</div>
        </div>
      ) : (
        <>
          {body}
          {cards}
          {callout}
        </>
      )}
    </div>
  )
}

function Card({ bullet, index }: { bullet: ContentBullet; index: number }) {
  const envVars = useEnvVarsStore((s) => s.vars)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.3 }}
      className="glass-panel rounded-xl p-5"
    >
      <div className="mb-2 flex items-center gap-3">
        {bullet.icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
            <Icon name={bullet.icon} size={17} />
          </div>
        )}
        {bullet.titleUrl ? (
          <a
            href={interpolateEnvVars(bullet.titleUrl, envVars)}
            target="_blank"
            rel="noreferrer"
            className="text-[17px] font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200"
          >
            {bullet.title}
          </a>
        ) : (
          <div className="text-[17px] font-semibold text-slate-100">{bullet.title}</div>
        )}
      </div>
      {bullet.description && <p className="text-[15px] leading-relaxed break-words text-slate-400">{bullet.description}</p>}
    </motion.div>
  )
}

/** `stats` variant: the card title is the figure, the description its label. */
function StatTile({ bullet, index }: { bullet: ContentBullet; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.35 }}
      className="glass-panel flex flex-col items-center justify-center rounded-xl px-6 py-8 text-center"
    >
      {bullet.icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
          <Icon name={bullet.icon} size={19} />
        </div>
      )}
      <div className="text-gradient-accent text-5xl font-bold tracking-tight">{bullet.title}</div>
      {bullet.description && (
        <div className="mt-3 text-[15px] leading-snug text-slate-400">{bullet.description}</div>
      )}
    </motion.div>
  )
}
